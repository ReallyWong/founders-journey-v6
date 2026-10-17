// Securities fixes against the checked v2.2 baseline; never edit generated assets.
module.exports = function repairSecurities(input) {
  let code = input;
  function once(before, after) {
    if (code.split(before).length !== 2) throw Error('Securities anchor changed: ' + before);
    code = code.replace(before, after);
  }
  once('disabled:D.shares-D.locked<=.01', 'disabled:D.shares-D.locked<=1e-9||!P');
  once('D.mkt==="cn"?"🇨🇳":"🇺🇸"', 'D.mkt==="cn"?"🇨🇳":D.mkt==="hk"?"🇭🇰":"🇺🇸"');
  once('function k9(n){return n==="cn"?{currency:"¥"}:{currency:"$"}}', 'function k9(n){return{currency:n==="cn"?"¥":n==="hk"?"HK$":"US$"}}');
  once('children:"行情沙盒已走到尽头（2005–2024），可持有/卖出，不可开新仓"', 'children:fjQuoteStatus(r,m,C)');
  once('onClick:()=>{H(D=>a8(D,r,m,parseFloat(f)||0)),d("")}', 'disabled:!U||lh(b,r,m)!==null,onClick:()=>{H(D=>a8(D,r,m,parseFloat(f)||0)),d("")}');
  once('onClick:()=>{H(D=>c8(D,r,m,parseFloat(f)||0)),d("")}', 'disabled:!U||lh(b,r,m)!==null,onClick:()=>{H(D=>c8(D,r,m,parseFloat(f)||0)),d("")}');
  once('H(D=>um(D,"us")),u("us")', 'H(D=>um(D,"us")),u("us"),p("QQQ")');
  once('记住：这里是 T+1，今天买明天才能卖；', '本游戏按月结算：A股本月买入，下月解锁卖出；');
  once('历史行情沙盒 · 教育模拟，非投资建议', '历史回测练习 · 独立于公司年份，非投资建议');
  code += '\n' + fjQuoteStatus.toString() + '\n';
  return code;
};
function fjQuoteStatus(market, ticker, ym) {
  const bars = Va(market, ticker);
  if (!bars.length) return '此标的暂无历史行情，请切换其他标的或市场。';
  const first = bars[0].m, last = bars[bars.length - 1].m;
  if (ym < first) return `当前历史月份 ${ym}；此标的行情从 ${first} 开始。可先切换A股或港股已有行情的指数，或推进月份后再交易。`;
  if (ym > last) return `此标的行情截至 ${last}；当前月份无报价，暂不能买卖。请切换有行情的标的。`;
  return `此标的缺少 ${ym} 的行情，暂不能买卖。请切换有行情的标的。`;
}
