const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'dist/assets/index-office.js'),'utf8');
const ctx={};vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('const g6='),source.indexOf('const Ol=')),ctx);
vm.runInContext(source.slice(source.indexOf('function A9('),source.indexOf('function k9(')),ctx);
vm.runInContext(source.slice(source.indexOf('function k9('),source.indexOf('const La=')),ctx);
vm.runInContext(source.slice(source.lastIndexOf('function fjQuoteStatus(')),ctx);
Object.assign(ctx,{mt:'card',St:'header',Tt:'title',ht:'body',Ye:'button',E9:'chart',Am:{},hn:n=>n.ym,g:{jsx:(type,props)=>({type,...props}),jsxs:(type,props)=>({type,...props}),Fragment:'fragment'}});
function render(brokerage,market,ticker,ym){let i=0;const values=[market,ticker,'',''];ctx.S={useState:()=>[values[i++],()=>{}],useMemo:f=>f()};return ctx.A9({state:{brokerage,ym},setState:()=>{},onClose:()=>{}})}
function buttons(tree){const out=[];function visit(n){if(Array.isArray(n)){n.forEach(visit);return;}if(!n||typeof n!=='object')return;if(n.type==='button')out.push(n);for(const c of [n.children].flat())visit(c)}visit(tree);return out;}
function clear(b,market,ticker,ym){return buttons(render(b,market,ticker,ym)).find(n=>n.children==='清仓')}
let cases=0;
for(const [market,ticker,ym,amount] of [['hk','HSI','2005-08',10],['us','QQQ','2011-04',.1],['cn','CSI300','2005-07',1]]){
  const b=ctx.E6(50,ym);assert.equal(ctx.k6(b,market,ticker,ym,amount),null);assert(b.positions[0].shares<.01);
  assert.equal(Boolean(clear(b,market,ticker,ym).disabled),market==='cn');
  if(market==='cn'){ctx.R6(b,ym,ym);assert.equal(Boolean(clear(b,market,ticker,ym).disabled),false)}
  assert.equal(ctx.N6(b,market,ticker,ym,b.positions[0].shares),null);assert.equal(b.positions.length,0);cases++;
}
const b=ctx.E6(50,'2005-08');
assert.equal(buttons(render(b,'us','QQQ','2005-08')).find(n=>n.children==='买入').disabled,true);
assert.equal(buttons(render(b,'us','QQQ','2011-04')).find(n=>n.children==='买入').disabled,false);
assert.equal(buttons(render(b,'us','AAPL','2007-03')).find(n=>n.children==='买入').disabled,true);
assert(ctx.fjQuoteStatus('us','QQQ','2005-08').includes('2011-04'));
assert(ctx.fjQuoteStatus('us','QQQ','2025-01').includes('截至'));
assert.equal(ctx.k9('hk').currency,'HK$');
assert.equal(ctx.k9('us').currency,'US$');
const unavailable=ctx.E6(0,'2011-04');unavailable.positions=[{ticker:'QQQ',mkt:'us',shares:.001,locked:0,cost:1}];assert.equal(Boolean(clear(unavailable,'us','QQQ','2005-08').disabled),true);
console.log('PASS securities: '+cases+' small-position round trips, A-share lock, real panel controls, unavailable quotes, locked stocks and currencies');
