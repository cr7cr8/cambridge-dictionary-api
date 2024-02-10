const cheerio = require('cheerio')
const request = require('request')
const express = require('express')
const axios = require('axios')
const app = express()
const puppeteer = require('puppeteer')


const superagent = require('superagent');  //npm install -D @types/superagent


const fs = require("fs")
const path = require("path")

const key = fs.readFileSync('./cert/key.pem')
const cert = fs.readFileSync('./cert/cert.pem');
const csr = fs.readFileSync('./cert/csr.pem');

//console.log(key,cert,csr)

const fetchVerbs = (wiki) => {


    console.log("in fetch verbs")

    return new Promise((resolve, reject) => {
        axios.get(wiki)
            .then((response) => {
                console.log("in axios then")
                const $$ = cheerio.load(response.data)
                const verb = $$('tr > td > p ').text()

                const lines = verb
                    .split('\n')
                    .map((line) => line.trim())
                    .filter(Boolean)

                const verbs = []
                for (let i = 0; i < lines.length; i += 2) {
                    const type = lines[i]
                    const text = lines[i + 1]
                    verbs.push({ type, text })
                }

                resolve(verbs)
            })
            .catch((error) => {
                console.log(error)
                reject(error)

            })
    })
}

const puppeteerGetHtml = async (url) => {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 100000 })

    const html = await page.content()
    // console.log(html)
    return html
}

const cheerioLoad = (html) => {

    const $ = cheerio.load(html)
    const word = $('.hw.dhw').first().text()
    const pos = $('.pos.dpos') // part of speech
        .map((index, element) => {
            return $(element).text()
        })
        .get()

    const siteurl = 'https://dictionary.cambridge.org'
    const usaudio = siteurl + $('.us.dpron-i audio source').first().attr('src')
    const uspron = $('.us.dpron-i .pron.dpron').first().text()

    const ukaudio = siteurl + $('.uk.dpron-i audio source').first().attr('src')
    const ukpron = $('.uk.dpron-i .pron.dpron').first().text()



    const exampleCount = $('.def-body.ddef_b')
        .map((index, element) => {
            const exampleElements = $(element).find('.examp.dexamp')
            return exampleElements.length
        })
        .get()
    for (let i = 0; i < exampleCount.length; i++) {
        if (i == 0) {
            exampleCount[i] = exampleCount[i]
        } else {
            exampleCount[i] = exampleCount[i] + exampleCount[i - 1]
        }
    }

    const exampletrans = $('.examp.dexamp > .trans.dtrans.dtrans-se.hdb.break-cj') // translation of the example
    const example = $('.examp.dexamp > .eg.deg')
        .map((index, element) => {
            return {
                id: index,
                text: $(element).text(),
                translation: exampletrans.eq(index).text(),
            }
        })
        .get()

    const definitiontrans = $('.def-body.ddef_b > .trans.dtrans.dtrans-se.break-cj') // translation of the definition
    const definition = $('.def.ddef_d.db')
        .map((index, element) => {
            return {
                id: index,
                text: $(element).text(),
                translation: definitiontrans.eq(index).text(),
                example: example.slice(exampleCount[index - 1], exampleCount[index]),
            }
        })
        .get()


    return {

        word,
        ukpron,
        ukaudio,

        uspron,
        usaudio,

        pos,

        definition,
        // definitiontrans,

    }

}

const requestGetHtml = (url) => {

    request(url, async (error, response, html) => {

    })

}

const data = fs.readFileSync(path.join("./", "wordlist.txt"))
const arr = data.toString().split("\r\n")
arr.sort()


async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

let count = 1
async function recordMP3(word, index) {
    const url = `https://dictionary.cambridge.org/us/dictionary/english-chinese-simplified/${word}`
    //console.log(word)

    await superagent.get(url).then(data => {
        const html = data.text
        const vocab = cheerioLoad(html)

        //  console.log(index + 1, word, vocab.word, vocab.usaudio.substring(vocab.usaudio.lastIndexOf("/") + 1))
        console.log(index + 1, word, vocab.word, vocab.usaudio.substring(vocab.ukaudio.lastIndexOf("/") + 1))


        if (word === vocab.word) {
            const stream = fs.createWriteStream("./uksound/" + vocab.word + '.mp3');
            stream.on('finish', () => { stream.close(); })
            stream.on("error", () => { stream.destroy() })
            // superagent.get(vocab.usaudio).pipe(stream)
            superagent.get(vocab.ukaudio).pipe(stream)
        }
        else {
            console.log("===", word, vocab.word, count++)
        }



    })
}


//asyncForEach(arr, recordMP3)




// ["batter", "sink", "fly", "numb", "revolt","slapdash"].forEach(async (word) => {
// //   arr.forEach(async (word) => {

//     const url = `https://dictionary.cambridge.org/us/dictionary/english-chinese-simplified/${word}`
//     //const url = "https://www.qq.com"


//     // superagent
//     //     .get("https://192.168.0.100:3443")
//     //     .disableTLSCerts()
//     //     //  .key(key)
//     //     //  .cert(cert)
//     //     //  .ca(cert)
//     //     .then(data => { console.log(data.text) })

//     // superagent
//     //     .get("https://192.168.0.100:3443")
//     //     .then(data => { console.log(data.text) })

//     superagent.get(url).then(data => {
//         const html = data.text
//         //  console.log(cheerioLoad(html))

//         //   cheerioLoad(html).definition.forEach(item=>{
//         //     console.log(item.example)
//         //   })

//         const vocab = cheerioLoad(html)


//         // console.log(vocab.word + "\n" + vocab.usaudio)
//         // vocab.definition.forEach((item, index) => {
//         //     console.log(index + 1, item.text)
//         //     console.log(" ", item.translation)
//         //     item.example.forEach(sample => {
//         //         console.log("-------------> ", sample.text)
//         //         console.log("               ", sample.translation)
//         //     })
//         //     console.log("")
//         // })
//         // console.log("")
//         return { word: vocab.word, mp3Addr: vocab.usaudio }



//     }).then(item => {
//         // console.log(mp3add)
//         const stream = fs.createWriteStream("./ussound/" + item.word + '.mp3');
//         stream.on('finish', () => { stream.close(); })
//         stream.on("error", () => { stream.destroy() })
//         superagent.get(item.mp3Addr).pipe(stream)


//     })




//     //  const html = await puppeteerGetHtml(url)
//     //     console.log(cheerioLoad(html))

// });





//app.get('/api/dictionary/:language/:entry', async (req, res, next) => {
app.get('/api/dictionary/:entry', async (req, res, next) => {
    const entry = req.params.entry
    const language = req.params.language
    // const url = `https://dictionary.cambridge.org/us/dictionary/${language}/${entry}`

    const url = `https://dictionary.cambridge.org/us/dictionary/english-chinese-simplified/${entry}`
    request(url, async (error, response, html) => {
        res.json(cheerioLoad(html))
        if (!error && response.statusCode == 200) {
            const $ = cheerio.load(html)
            const siteurl = 'https://dictionary.cambridge.org'
            const wiki = `https://simple.wiktionary.org/wiki/${entry}`
            const google = `https://www.google.com/search?q=${entry}+definition`

            // get verbs

            const verbs = await fetchVerbs(wiki)

            // basic

            const word = $('.hw.dhw').first().text()
            const pos = $('.pos.dpos') // part of speech
                .map((index, element) => {
                    return $(element).text()
                })
                .get()

            const usaudio = siteurl + $('.us.dpron-i audio source').first().attr('src')
            const uspron = $('.us.dpron-i .pron.dpron').first().text()
            const ukaudio = siteurl + $('.uk.dpron-i audio source').first().attr('src')
            const ukpron = $('.uk.dpron-i .pron.dpron').first().text()

            // definition & example

            const exampleCount = $('.def-body.ddef_b')
                .map((index, element) => {
                    const exampleElements = $(element).find('.examp.dexamp')
                    return exampleElements.length
                })
                .get()
            for (let i = 0; i < exampleCount.length; i++) {
                if (i == 0) {
                    exampleCount[i] = exampleCount[i]
                } else {
                    exampleCount[i] = exampleCount[i] + exampleCount[i - 1]
                }
            }

            const exampletrans = $('.examp.dexamp > .trans.dtrans.dtrans-se.hdb.break-cj') // translation of the example
            const example = $('.examp.dexamp > .eg.deg')
                .map((index, element) => {
                    return {
                        id: index,
                        text: $(element).text(),
                        translation: exampletrans.eq(index).text(),
                    }
                })
                .get()

            const definitiontrans = $('.def-body.ddef_b > .trans.dtrans.dtrans-se.break-cj') // translation of the definition
            const definition = $('.def.ddef_d.db')
                .map((index, element) => {
                    return {
                        id: index,
                        text: $(element).text(),
                        translation: definitiontrans.eq(index).text(),
                        example: example.slice(exampleCount[index - 1], exampleCount[index]),
                    }
                })
                .get()

            // api response

            res.status(200).json({
                word: word,
                pos: pos,
                verbs: verbs,
                pronunciation: [
                    {
                        lang: 'us',
                        url: usaudio,
                        pron: uspron,
                    },
                    {
                        lang: 'uk',
                        url: ukaudio,
                        pron: ukpron,
                    },
                ],
                definition: definition,
            })
        }
    })




    // const html = await puppeteerGetHtml(url)
    // res.json(cheerioLoad(html))

})



// app.get('/api/dictionary/:language/:entry', (req, res, next) => {
//     const entry = req.params.entry
//     const language = req.params.language
//     const url = `https://dictionary.cambridge.org/us/dictionary/${language}/${entry}`


//     request(url, async (error, response, html) => {



//         const $ = cheerio.load(html)
//         const siteurl = 'https://dictionary.cambridge.org'
//         const wiki = `https://simple.wiktionary.org/wiki/${entry}`
//         const google = `https://www.google.com/search?q=${entry}+definition`

//         // get verbs

//         const verbs = await fetchVerbs(wiki)




//         // basic

//         const word = $('.hw.dhw').first().text()
//         const pos = $('.pos.dpos') // part of speech
//             .map((index, element) => {
//                 return $(element).text()
//             })
//             .get()

//         const usaudio = siteurl + $('.us.dpron-i audio source').first().attr('src')
//         const uspron = $('.us.dpron-i .pron.dpron').first().text()
//         const ukaudio = siteurl + $('.uk.dpron-i audio source').first().attr('src')
//         const ukpron = $('.uk.dpron-i .pron.dpron').first().text()

//         // definition & example

//         const exampleCount = $('.def-body.ddef_b')
//             .map((index, element) => {
//                 const exampleElements = $(element).find('.examp.dexamp')
//                 return exampleElements.length
//             })
//             .get()
//         for (let i = 0; i < exampleCount.length; i++) {
//             if (i == 0) {
//                 exampleCount[i] = exampleCount[i]
//             } else {
//                 exampleCount[i] = exampleCount[i] + exampleCount[i - 1]
//             }
//         }

//         const exampletrans = $('.examp.dexamp > .trans.dtrans.dtrans-se.hdb.break-cj') // translation of the example
//         const example = $('.examp.dexamp > .eg.deg')
//             .map((index, element) => {
//                 return {
//                     id: index,
//                     text: $(element).text(),
//                     translation: exampletrans.eq(index).text(),
//                 }
//             })
//             .get()

//         const definitiontrans = $('.def-body.ddef_b > .trans.dtrans.dtrans-se.break-cj') // translation of the definition
//         const definition = $('.def.ddef_d.db')
//             .map((index, element) => {
//                 return {
//                     id: index,
//                     text: $(element).text(),
//                     translation: definitiontrans.eq(index).text(),
//                     example: example.slice(exampleCount[index - 1], exampleCount[index]),
//                 }
//             })
//             .get()

//         // api response




//         res.status(200).json({
//             word: word,
//             pos: pos,
//             verbs: verbs,
//             pronunciation: [
//                 {
//                     lang: 'us',
//                     url: usaudio,
//                     pron: uspron,
//                 },
//                 {
//                     lang: 'uk',
//                     url: ukaudio,
//                     pron: ukpron,
//                 },
//             ],
//             definition: definition,
//         })



//     })
// })

module.exports = app
