// Reproducible repair layer for the exact public v2.2 release.
// No historical source is substituted for the current game.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const baseline = path.join(root, 'baseline');
const output = path.join(root, 'preview');
const asset = 'assets/index-DWOGtMQ4.js';
module.exports=function repairEngine(input){
let code=input;
const expected = '171277cd39d01b9e0072cc011b8f09da7f4ee3bda994d1ac96c0826e12dc6f31';
if (crypto.createHash('sha256').update(code).digest('hex') !== expected) {
  throw Error('Baseline changed. Review every patch before updating the hash.');
}
const applied = [];
function replaceOnce(before, after, description) {
  if (code.split(before).length !== 2) throw Error('Non-unique patch: ' + description);
  code = code.replace(before, after);
  applied.push(description);
}
function replaceFunction(name, nextName, source) {
  const start = code.indexOf(`function ${name}(`);
  const end = code.indexOf(`function ${nextName}(`, start);
  if (start < 0 || end < start) throw Error('Missing function: ' + name);
  code = code.slice(0, start) + source + '\n' + code.slice(end);
  applied.push('Replace ' + name);
}

replaceFunction('L2', 'y8', `function L2(state) {
  if (!state.alive) return state;
  if (state.health <= 0) return Wt(state, "burnout");
  if (state.morale <= 0 && state.cash < 5 && !state.pendingDecision)
    return Wt(state, "shutdown");
  const debt = state.debt + (state.loan ?? 0);
  // Debt is a company crisis, never evidence that the player chose to flee.
  if (debt > 120) return Wt(state, "bankrupt");
  if (!state.pendingDecision && debt > 60 && state.cash <= 0 &&
      state.mrr < state.industry.baseBurn) return Wt(state, "bankrupt");
  if (state.month > 96 && !state.tags.includes("milestone-eight-years")) {
    return J({...state, tags: [...state.tags, "milestone-eight-years"]},
      "🎂 公司走过八年。你可以继续经营；是否退出，由你决定。", "good");
  }
  return state;
}`);

// Monthly choices must survive until their effects have actually been applied.
replaceOnce('a.founderAction=a.speed>=2?a.founderAction??null:null,a.month+=1',
  'a.founderAction=a.founderAction??null,a.month+=1', 'Preserve chosen monthly action');
replaceOnce('a=L2(a),a}function e8',
  'a=L2(a),a.speed<2&&(a={...a,founderAction:null}),a}function e8',
  'Clear manual action after settlement, retain accelerated action');
replaceOnce('a=e8(a);{const z=', 'a=a.pendingDecision?a:e8(a);{const z=',
  'Do not overwrite an unpaid-cash decision with stage progression');
replaceOnce('z>0&&a.team<z&&a.month%3===0&&a.cash>C*2&&a.mrr>3&&',
  '!a.pendingDecision&&z>0&&a.team<z&&a.month%3===0&&a.cash>C*2&&a.mrr>3&&',
  'Recruitment cannot overwrite funding or IPO decisions');

const debtStart = code.indexOf('if(a.cash+=a.mrr-C,a.cash<0){');
const debtEnd = code.indexOf('if((a.loan??0)>0)', debtStart);
if (debtStart < 0 || debtEnd < debtStart) throw Error('Missing automatic debt block');
code = code.slice(0, debtStart) + `if(a.cash+=a.mrr-C,a.cash<0){
  const shortfall=Math.ceil(-a.cash*100)/100;
  const friendly=Math.round(Math.min(shortfall,Math.max(0,20-a.debt))*100)/100;
  const emergency=Math.round((shortfall-friendly)*100)/100;
  const canBorrow=a.debt+(a.loan??0)+shortfall<=120;
  const choices=[];
  if(canBorrow)choices.push({id:"approve-bridge",text:emergency>0?
    "确认借款补足本月缺口（含月息 2.5% 的紧急贷款）":"确认向亲友借款补足本月缺口（免息）",
    effects:{debt:friendly,loan:emergency},
    resultText:"你确认借款支付本月未付开支。下月仍需面对经营支出与已有贷款利息。",
    lessonTitle:"借款先看还款来源",lesson:"借款只是时间，不是收入。确认本月缺口、下月支出和可验证的还款来源，再决定是否继续。"});
  choices.push({id:"decline-bridge",text:"不再借款，停止经营并进入清算",
    effects:{debt:shortfall,endingId:"bankrupt"},
    resultText:"你没有继续借款。本月未付开支列入待清偿债务，公司停止经营。"});
  a.cash=0;
  a.pendingDecision={kind:"event",eventId:"liquidity-crisis",title:"现金不足：是否借款继续？",
    scene:"本月开支尚缺 "+a.region.currency+shortfall.toFixed(2)+" 万。亲友借款 "+a.region.currency+friendly.toFixed(2)+
    " 万，紧急贷款 "+a.region.currency+emergency.toFixed(2)+" 万（月息 2.5%，按月复利，年化约 34.5%）。"+
    (canBorrow?"借款仅用于支付这笔缺口，不会额外增加可用现金。":"继续借款将超过当前债务上限。"),choices};
  a=J(a,"⚠️ 本月存在未付开支，等待你决定；系统尚未替你借款。","bad");
}` + code.slice(debtEnd);
applied.push('Explicit borrowing consent, with decline and cost disclosure');
replaceOnce('return m.delta=_o(r,c),c=Xt(c,m),c=L2(c),c}function xe',
  'if(n.pendingDecision?.eventId==="liquidity-crisis"&&a.id==="approve-bridge"){c.pendingDecision=null;c=e8(c)}return m.delta=_o(r,c),c=Xt(c,m),c=L2(c),c}function xe',
  'Resume deferred stage decision after the player approves a bridge');
replaceOnce('超过 120 将触发「欠债跑路」结局。距离崩盘还有',
  '超过 120 将触发公司清算。距离债务上限还有', 'Debt warning describes company outcome');
replaceOnce('距离跑路线只剩', '距离债务上限只剩', 'Remove automatic moral judgement');

// Store recruitment identity separately from the bounded postmortem log.
replaceOnce('function xs(n){const a=Mo(rs);let c=Mo(rs);for(;c.name===a.name;)c=Mo(rs);',
  `function xs(n){
    const seen=new Set(n.recruitmentHistory??[]);
    const pool=rs.filter(candidate=>!seen.has(candidate.name));
    // Once the original cast is exhausted, explicitly offer NEW applicants,
    // rather than claiming an existing employee is joining a second time.
    let serial=1;
    while(pool.length<2){
      const base=rs[(n.month+serial)%rs.length];
      pool.push({...base,name:base.role+"候选人·"+(n.month+1)+"-"+serial,
        quirk:"新一轮招聘候选人："+base.quirk});
      serial++;
    }
    const a=Mo(pool);let c=Mo(pool);for(;c.name===a.name;)c=Mo(pool);`,
  'Do not re-offer previously recruited characters');
replaceOnce('const u=a==="h1"?c[0]:c[1];return r.team+=1',
  'const u=a==="h1"?c[0]:c[1];r.recruitmentHistory=[...n.recruitmentHistory??[],u.name];return r.team+=1',
  'Remember successful and failed recruitment attempts');

// Financial/game-model text must not masquerade as real deposit rates.
replaceOnce('💰 活期理财利息 +', '💰 模拟现金收益 +', 'Label game-only cash return');
replaceOnce('躺赚月息 ${(z*100).toFixed(1)}%）——现金躺着也有心跳，但跑不赢通胀，更跑不赢 all-in 增长的对手。',
  '按游戏月度收益参数 ${(z*100).toFixed(1)}% 计算，单月封顶 10 万）——这是模拟规则，不是现实存款利率。',
  'Disclose simulated return and cap');
replaceOnce('把 30% 现金投入已验证的增长引擎',
  '投入 60 万到已验证的增长引擎', 'Match fixed cash cost to choice text');
replaceOnce('钱只够马上招一个，另一个岗位靠现有团队硬扛。',
  '本轮最多选择一个岗位，其他岗位暂由现有团队承担。', 'Hiring limit is a game rule, not false cash shortage');
replaceOnce('children:"💡 下一局的三个锦囊"',
  'children:"💡 下一局的改进建议"', 'Advice title matches variable count');
replaceOnce('title:"产品永远停在 80%"', 'title:"产品进度不足"', 'Postmortem title matches actual metric');
replaceOnce('完美主义是初创公司的奢侈品——市场只奖励「够用且快」的版本迭代。',
  '本局结束时尚未达到成熟阶段；单凭进度不能判断原因，需要结合研发投入、行业周期和事件查看。',
  'Do not infer perfectionism from low progress');
replaceOnce('先做能卖的最小版本（MVP），让真实用户的抱怨来排优先级。',
  '先验证核心需求，再按行业要求推进产品；医疗、金融等行业不能跳过安全与合规要求。',
  'Industry-aware postmortem advice');

// The old selector hid most neutral scenario decisions. Show the latest history,
// including the final choice, without inventing causal verdicts.
replaceFunction('z7', 'D7', `function z7(decisions, limit=8) {
  return (decisions??[]).slice(-limit).map(d=>({
    month:d.month,kind:d.kind,title:d.title,choice:d.choice,note:d.note,
    verdict:j7(d)
  }));
}`);
replaceOnce('下面是从账本里挖出来的死因链——每一条都有据可查。',
  '下面列出本局的风险信号；它们不一定是结局的唯一原因。', 'Avoid false certainty in failure explanations');
replaceOnce('死因链（按致命程度）', '本局风险信号', 'Describe observations, not proven causality');
replaceOnce('败局复盘：不是运气不好，是因果到账', '败局复盘：回看选择与风险', 'Neutral failure heading');
replaceOnce('问题多半不是执行，而是一开始就没有足够多的人想要这个东西——需求验证被跳过了。',
  '目前的用户与收入规模有限，需要结合访谈、留存和行业周期继续验证需求，不能仅凭这一项判断跳过了验证。',
  'Do not falsely claim the player skipped validation');
replaceOnce('两年：从身家见底到订单爆炸', '从身家见底到订单爆炸', 'Remove hard-coded mask duration');
replaceOnce('——五年，你亲身走完了一个完整的资本周期。',
  '——这段旅程里，你亲身走完了一个完整的资本周期。', 'Remove hard-coded dotcom duration');
replaceOnce('给 22 个人里的每个人都加了薪', '给团队成员都加了薪', 'Remove hard-coded employee count');
replaceOnce('三年没回家过年了。电话这头的妈妈很平静。你看着刚融到的钱和排满的发布计划。',
  '你已经有段时间没回家了。电话这头的妈妈很平静。你看着手头的工作计划。', 'Family event matches pre-funding states');
replaceOnce('上市敲钟那天，记者问你「网红转型企业家最大的心得」',
  '自有品牌发布那天，记者问你「网红转型企业家最大的心得」', 'Brand success does not imply an IPO');
replaceOnce('招股书的优势栏写着复购率 47%。',
  '你向记者展示了团队持续改善复购的努力。', 'Do not fabricate an IPO document or untracked metric');

return {code,applied,baselineSha256:expected};
};
