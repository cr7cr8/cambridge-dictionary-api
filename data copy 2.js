const cheerio = require('cheerio')
const request = require('request')
const express = require('express')
const axios = require('axios')
const app = express()
const puppeteer = require('puppeteer')






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

const puppeteerHtml = async (url) => {
    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 100000 })

    const html = await page.content()
    // console.log(html)
    return html
}

const cheerioLoad = (html) => {



}




app.get('/api/dictionary/:language/:entry', (req, res, next) => {
    const entry = req.params.entry
    const language = req.params.language
    const url = `https://dictionary.cambridge.org/us/dictionary/${language}/${entry}`


    request(url, async (error, response, html) => {



        // const content = await test(url)
        // console.log(content)


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


        //  console.log(definition)




        res.json({

            word,
            ukpron,
            ukaudio,

            uspron,
            usaudio,

            pos,

            definition,
            // definitiontrans,

        })




        // if (!error && response.statusCode == 200) {
        //     const $ = cheerio.load(html)
        //     const siteurl = 'https://dictionary.cambridge.org'
        //     const wiki = `https://simple.wiktionary.org/wiki/${entry}`
        //     const google = `https://www.google.com/search?q=${entry}+definition`

        //     // get verbs

        //     const verbs = await fetchVerbs(wiki)

        //     // basic

        //     const word = $('.hw.dhw').first().text()
        //     const pos = $('.pos.dpos') // part of speech
        //         .map((index, element) => {
        //             return $(element).text()
        //         })
        //         .get()

        //     const usaudio = siteurl + $('.us.dpron-i audio source').first().attr('src')
        //     const uspron = $('.us.dpron-i .pron.dpron').first().text()
        //     const ukaudio = siteurl + $('.uk.dpron-i audio source').first().attr('src')
        //     const ukpron = $('.uk.dpron-i .pron.dpron').first().text()

        //     // definition & example

        //     const exampleCount = $('.def-body.ddef_b')
        //         .map((index, element) => {
        //             const exampleElements = $(element).find('.examp.dexamp')
        //             return exampleElements.length
        //         })
        //         .get()
        //     for (let i = 0; i < exampleCount.length; i++) {
        //         if (i == 0) {
        //             exampleCount[i] = exampleCount[i]
        //         } else {
        //             exampleCount[i] = exampleCount[i] + exampleCount[i - 1]
        //         }
        //     }

        //     const exampletrans = $('.examp.dexamp > .trans.dtrans.dtrans-se.hdb.break-cj') // translation of the example
        //     const example = $('.examp.dexamp > .eg.deg')
        //         .map((index, element) => {
        //             return {
        //                 id: index,
        //                 text: $(element).text(),
        //                 translation: exampletrans.eq(index).text(),
        //             }
        //         })
        //         .get()

        //     const definitiontrans = $('.def-body.ddef_b > .trans.dtrans.dtrans-se.break-cj') // translation of the definition
        //     const definition = $('.def.ddef_d.db')
        //         .map((index, element) => {
        //             return {
        //                 id: index,
        //                 text: $(element).text(),
        //                 translation: definitiontrans.eq(index).text(),
        //                 example: example.slice(exampleCount[index - 1], exampleCount[index]),
        //             }
        //         })
        //         .get()

        //     // api response

        //     res.status(200).json({
        //         word: word,
        //         pos: pos,
        //         verbs: verbs,
        //         pronunciation: [
        //             {
        //                 lang: 'us',
        //                 url: usaudio,
        //                 pron: uspron,
        //             },
        //             {
        //                 lang: 'uk',
        //                 url: ukaudio,
        //                 pron: ukpron,
        //             },
        //         ],
        //         definition: definition,
        //     })
        // }


    })





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
