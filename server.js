const express = require('express')

const generate = require('./generate')

const app = express()
//For parsing json bodies
app.use(express.json())
//Serve home page 
app.use(express.static('home-page'))

const web_server_port = 3000
const net_square_url = `http://localhost:${web_server_port}`
 
//Generate maps on demand
app.post('/', async function (req, res) {
  console.log(req.body)
  let response;
  if(req?.body?.link){
    if(req?.body?.link == net_square_url){
      response = {status:"ok",area_id:"default",area_path:"areas/default.tmx",fresh:false,assets:[]}
    }else{
      let {area_id,area_path,assets} = await generate(req?.body?.link)
      response = {status:"ok",area_id,area_path,fresh:true,assets}
    }
  }else{
    response = {status:"error"}
  }

  res.status(200)
  res.send(JSON.stringify(response))
})

app.listen(web_server_port)

async function main(){
  await generate(net_square_url,true)
}

main()