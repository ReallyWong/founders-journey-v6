const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname),out=path.join(root,'dist'),code=fs.readFileSync(path.join(out,'assets/index-office.js'),'utf8');
const html=fs.readFileSync(path.join(out,'index.html'),'utf8'),cfg=JSON.parse(fs.readFileSync(path.join(out,'release-manifest.json'),'utf8'));
assert(html.includes('./assets/index-office.js'));assert(html.indexOf('release-config.js')<html.indexOf('type="module"'));assert(code.includes('OfficeRoom'));assert(code.includes('onNewGame:u'));assert.equal(cfg.analytics,cfg.environment==='production');
if(cfg.analytics)assert(html.includes('https://tejyzdubrbiigouznaeh.supabase.co'));else assert(html.includes("connect-src 'self'\""));
const start=code.indexOf('function U6('),end=code.indexOf('const rm=',start),functions=code.slice(start,end);
function context(analytics){const calls=[];const ctx={globalThis:{FJ_RELEASE:{analytics}},fetch:(...args)=>{calls.push(args);return Promise.resolve({json:async()=>[{id:'test-id'}]})},navigator:{},y2:'https://example.test',C2:'test-public-key',B6:'https://notify.example.test',im:cfg.version,Date,JSON,encodeURIComponent};vm.createContext(ctx);vm.runInContext(functions,ctx);return{ctx,calls}}
const blocked=context(false);blocked.ctx.U6({});blocked.ctx.L6('test','preview',{});assert.equal(blocked.calls.length,0);
const enabled=context(true);enabled.ctx.U6({endingId:'test',grade:'A'});assert.equal(enabled.calls.length,2);assert.equal(JSON.parse(enabled.calls[0][1].body).version,cfg.version);
for(const file of ['assets/office-scene.js','office-theme.css','board.html','ops.html'])assert(fs.existsSync(path.join(out,file)));
console.log('PASS release assets, config order, preview write isolation, production reporting wiring (mocked, no requests sent)');
