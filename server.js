const express = require('express')

const generate = require('./generate')
const { asyncSleep } = require('./helpers')
const { unlink } = require('fs/promises')
const { resolve } = require('path')
const process = require('process')

const app = express()
//For parsing json bodies
app.use(express.json())
//Serve home page
app.use(express.static('home-page'))

const web_server_port = parseInt(process.argv[2]) || 3000
const net_square_url = `http://localhost:${web_server_port}`//`http://localhost:${web_server_port}`
const default_area_path = `areas/default.tmx`

function timeoutPromise(promise, milliseconds) {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${milliseconds}ms`)), milliseconds);
        })
    ]);
}

//Generate maps on demand
app.post('/', async function (req, res) {
    console.log(req.body)
    let response
    res.status(200)
    if (req?.body?.link) {
        if (req?.body?.link == net_square_url) {
            response = { status: 'ok', area_id: 'default', area_path: 'areas/default.tmx', fresh: false, assets: [] }
        } else {
            try {
                let generate_promise = generate(req?.body?.link)
                let { area_id, area_path, assets, fresh } = await timeoutPromise(generate_promise,60000)
                response = { status: 'ok', area_id, area_path, fresh, assets }
            } catch (e) {
                console.error(e)
                response = { status: 'error' }
            }
        }
    } else {
        response = { status: 'error' }
    }
    res.send(JSON.stringify(response))
})

app.listen(web_server_port)
console.log(`generation server listening on ${web_server_port}`)

async function test() {
    await asyncSleep(1000)
    try {
        await unlink(resolve('onb-server/' + default_area_path))
    } catch (e) {
        console.log('cant unlink ', resolve('onb-server/' + default_area_path))
    }
    await generate(net_square_url, true)
}

test()
