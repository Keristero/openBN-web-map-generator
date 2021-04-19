const express = require('express')

const generate = require('./generate')

const app = express()
app.use(express.json())
 
//Generate maps on demand
app.post('/', async function (req, res) {
  console.log(req.body)
  let response;
  if(req?.body?.link){
    let {area_id,area_path} = await generate(req?.body?.link)
    response = {status:"ok",area_id,area_path}
  }else{
    response = {status:"error"}
  }

  res.status(200)
  res.send(JSON.stringify(response))
})

//Serve home page 
app.static('home-page')
app.listen(3000)

async function main(){

}

main()