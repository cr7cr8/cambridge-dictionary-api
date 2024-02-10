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

    await superagent.get(url).disableTLSCerts().then(data => {
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






app.get('/:entry',  (req, res, next) => {
    const entry = req.params.entry

    const url = `https://dictionary.cambridge.org/dictionary/english-chinese-simplified/${entry}`

    // request(url, async (error, response, html) => {
    //     res.status(200).json(cheerioLoad(html))
    // })
    superagent.get(url).disableTLSCerts().then(data=>{

        res.status(200).json(cheerioLoad(data.text))

    })
})

module.exports = app
