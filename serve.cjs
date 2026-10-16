const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
  let file;
  try{file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}
  catch{res.writeHead(400);return res.end();}
  if(file===root)file=path.join(root,'index.html');
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(error,body)=>{
    if(error){res.writeHead(404);return res.end('Not found');}
    res.setHeader('Content-Type',types[path.extname(file)]??'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(body);
  });
});
server.listen(0,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+server.address().port));


