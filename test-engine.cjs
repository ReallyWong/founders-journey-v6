const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'dist/assets/index-office.js'),'utf8');
function extract(name,next){const start=code.indexOf('function '+name+'(');const end=code.indexOf('function '+next+'(',start);assert(start>=0&&end>start);return code.slice(start,end);}
const tests=[];
function test(name,fn){fn();tests.push(name);console.log('PASS '+name);}
const context={
  xe:(n,min,max)=>Math.min(max,Math.max(min,n)),
  Wt:(state,id)=>({...state,alive:false,ending:{id},pendingDecision:null}),
  J:(s,text,type)=>({...s,log:[...s.log,{month:s.month,text,type}]}),
  Xa:()=>{},n8:s=>s,Ct:()=>0.9,mn:()=>100,me:(_,v)=>v.toFixed(2)+'万',
  ih:Array(12).fill(''),Do:2024,xh:()=>0,
  Ml:(_,round)=>({kind:'pitch',round}),
  xs:()=>({kind:'hire'}),
  t8:()=>({kind:'interview'}),
  ph:()=>({kind:'ipo'}),
  fh:{idea:1,validate:2,mvp:3,seed:3,growth:4,seriesA:5,scale:5,endgame:6},
  T2:[],v8:s=>s,
  Xt:(s,d)=>({...s,decisions:[...(s.decisions??[]),d]}),
  _o:(before,after)=>({cash:after.cash-before.cash}),
  I6:s=>s,J6:new Set(),j7:()=> 'neutral',
};
vm.createContext(context);
vm.runInContext(extract('L2','y8')+extract('F6','xe')+extract('gs','e8')+extract('e8','t8')+extract('z7','D7'),context);
function state(extra={}){return {alive:true,month:2,year:2024,season:'',speed:0,stage:'growth',
  cash:1000,debt:0,loan:0,health:90,morale:80,product:50,users:100,mrr:10,valuation:1000,
  tags:[],log:[],decisions:[],raised:[],team:1,awareness:30,accessibility:20,
  eventCooldown:10,winterWindows:[],pendingDecision:null,
  region:{modifiers:{},currency:'¥'},
  industry:{id:'ai',baseBurn:3,baseUsers:10,revenuePerUser:.01,productDifficulty:1},
  budget:{rd:40,marketing:30,sales:30},...extra};}
test('Healthy company survives month 97; milestone only appears once',()=>{
  const result=context.L2(state({month:97}));assert(result.alive);assert.equal(result.log.length,1);
  assert.equal(context.L2(result).log.length,1);
});
test('Excess company debt does not invent a runaway choice',()=>{
  assert.equal(context.L2(state({debt:121})).ending.id,'bankrupt');
});
test('A-round decision survives a simultaneous recruitment opportunity',()=>{
  const result=context.gs(state({month:8,mrr:40,users:2000}));
  assert.equal(result.stage,'seriesA');assert.equal(result.pendingDecision.kind,'pitch');
  assert.equal(result.pendingDecision.round,'A');
});
test('Manual code action adds four progress points, then resets',()=>{
  const base=state({stage:'mvp',product:30,month:2});
  const plain=context.gs(base);const chosen=context.gs({...base,founderAction:'code'});
  assert.equal(chosen.product-plain.product,4);assert.equal(chosen.founderAction,null);
});
test('Accelerated play retains the chosen ongoing action',()=>{
  const result=context.gs(state({stage:'mvp',product:20,speed:2,founderAction:'code'}));
  assert.equal(result.founderAction,'code');
});
test('Shortfall pauses borrowing; no debt is created before consent',()=>{
  const result=context.gs(state({cash:0,mrr:0,users:0,stage:'mvp',product:20}));
  assert(result.alive);assert.equal(result.debt,0);assert.equal(result.loan,0);
  assert.equal(result.pendingDecision.eventId,'liquidity-crisis');
  assert.equal(result.pendingDecision.choices.length,2);
});
test('Approved bridge covers the gap without giving free spendable cash',()=>{
  const result=context.gs(state({cash:0,mrr:0,users:0,stage:'mvp',product:20}));
  const choice=result.pendingDecision.choices[0];
  const approved=context.F6(result,choice);assert(approved.debt>0);
  assert.equal(approved.cash,0);assert(approved.alive);
});
test('Approving a bridge resumes a ready seed pitch without another month',()=>{
  const result=context.gs(state({cash:0,mrr:0,users:0,stage:'mvp',product:44}));
  assert.equal(result.pendingDecision.eventId,'liquidity-crisis');
  const approved=context.F6(result,result.pendingDecision.choices[0]);
  assert.equal(approved.stage,'seed');assert.equal(approved.pendingDecision.kind,'pitch');
  assert.equal(approved.month,result.month);
});
test('Declining a bridge ends the company without adding an emergency loan',()=>{
  const result=context.gs(state({cash:0,mrr:0,users:0,stage:'mvp',product:20}));
  const declined=context.F6(result,result.pendingDecision.choices[1]);
  assert.equal(declined.ending.id,'bankrupt');assert.equal(declined.loan,0);
});
test('A loan beyond the debt limit is not offered',()=>{
  const result=context.gs(state({cash:0,debt:119,mrr:0,users:0,stage:'mvp',product:20}));
  assert.equal(result.pendingDecision.choices.length,1);
  assert.equal(result.pendingDecision.choices[0].id,'decline-bridge');
});
test('Postmortem retains neutral scenario decisions and the final exit',()=>{
  const decisions=Array.from({length:10},(_,i)=>({month:i,title:'scenario-'+i,kind:'event',choice:'choice-'+i}));
  const result=context.z7(decisions);assert.equal(result.length,8);
  assert.equal(result.at(-1).choice,'choice-9');
});
test('Previously recruited characters are excluded, including after pool exhaustion',()=>{
  let index=0;
  context.rs=[{name:'A',role:'工程师'},{name:'B',role:'商务'}];
  context.Mo=arr=>arr[(index++)%arr.length];
  vm.runInContext(code.slice(code.indexOf('function xs('),code.indexOf('function p8(')),context);
  const result=context.xs(state({recruitmentHistory:['A','B']}));
  assert.notEqual(result.candidates[0].name,result.candidates[1].name);
  assert(result.candidates.every(c=>!['A','B'].includes(c.name)));
});
fs.writeFileSync(path.join(__dirname,'dist/regression-results.json'),JSON.stringify({passed:tests.length,tests},null,2));
