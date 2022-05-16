const express = require('express');
const request = require('request');
const { spawn } = require('child_process');


const num_servers = 4
const servers = []

for(let i = 0; i < num_servers; i++){
    let server_info = spawn_new_server_process(i)
    servers.push(server_info)
}

function spawn_new_server_process(i){
    //spawn a process with a unique port
    let port = 4000+i
    let process = spawn('node',["server.js",port]);
    console.log(`Generation Server ${process.pid} is running`);
    process.on('close', ()=>{
        handle_dying_process(i)
    })
    return {process:process,port:port}
}

function handle_dying_process(i){
    //replace dying process with a new one
    console.log(`Generation Server ${servers[i].process.pid} is died, spawning replacement`);
    let server_info = spawn_new_server_process(i)
    servers[i] = server_info
}

let current_server_index = 0;

const handler = (req, res) => {
  // Pipe the vanilla node HTTP request (a readable stream) into `request`
  // to the next server URL. Then, since `res` implements the writable stream
  // interface, you can just `pipe()` into `res`.
  let server_info = servers[current_server_index]
  let new_url = `http://localhost:${server_info.port}${req.url}`
  req.pipe(request(new_url)).pipe(res);
  current_server_index = (current_server_index + 1) % servers.length;
};
const server = express().get('*', handler).post('*', handler);

server.listen(3000);