// GTL v21 dashboard - self-contained renderer
(()=>{
const dash=document.getElementById('dashboard');
if(!dash)return;
const money=v=>'₹'+Number(v||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const n=v=>Number(v||0), sum=(rows,key)=>rows.reduce((a,r)=>a+n(typeof key==='function'?key(r):r[key]),0);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const card=(label,value,count=false)=>`<article class="card"><span>${esc(label)}</span><strong>${count?Number(value||0).toLocaleString('en-IN'):money(value)}</strong></article>`;
const table=(title,map)=>`<div class="panel"><h3>${esc(title)}</h3><div class="table-wrap"><table><thead><tr><th>By</th><th>Total</th></tr></thead><tbody>${Object.keys(map).length?Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<tr><td>${esc(k)}</td><td>${money(v)}</td></tr>`).join(''):'<tr><td colspan="2">No data in selected period</td></tr>'}</tbody></table></div></div>`;
const group=(rows,key,amount)=>{const o={};rows.forEach(r=>{const k=key(r)||'Unspecified';o[k]=(o[k]||0)+n(amount(r));});return o;};
const paidBy=r=>r.paid_by==='Other'?(r.paid_by_other||'Other'):(r.paid_by||'Unspecified');
const receivedBy=v=>{const x=String(v||'').trim().toLowerCase();if(x==='parikshith')return'Parikshith';if(x==='sanjay')return'Sanjay';if(['garuda','parikshith garuda','sanjay garuda'].includes(x))return'GARUDA';return v||'Unspecified';};
dash.innerHTML=`<div class="panel"><div class="section-head"><div><h2>Business Dashboard</h2><div class="muted" style="margin-top:4px">Build v21</div></div><span id="v21Period" class="muted">All time</span></div><div class="form-grid"><label>From Date<input id="v21From" type="date"></label><label>To Date<input id="v21To" type="date"></label><label>Quick Period<select id="v21Quick"><option value="all">All Time</option><option value="month">This Month</option><option value="lastmonth">Last Month</option><option value="fy">This Financial Year</option></select></label><div class="actions"><button type="button" id="v21Apply">Apply</button><button type="button" class="secondary" id="v21All">All Time</button></div></div></div><div id="v21Body"><div class="panel"><p class="muted">Loading dashboard…</p></div></div>`;
const from=document.getElementById('v21From'),to=document.getElementById('v21To'),quick=document.getElementById('v21Quick'),body=document.getElementById('v21Body'),period=document.getElementById('v21Period');
const inRange=d=>(!from.value||d>=from.value)&&(!to.value||d<=to.value);
function personSummary(expRows,own,com,salary){const people=['Parikshith','Sanjay'];return `<div class="panel"><h2>Partner / Person-wise Summary</h2><p class="muted">Net = Salary Drawn + Amount Received − Expense Paid</p><div class="table-wrap"><table><thead><tr><th>Person</th><th>Expense Paid</th><th>Amount Received</th><th>Salary Drawn</th><th>Net</th></tr></thead><tbody>${people.map(name=>{const key=name.toLowerCase();const exp=sum(expRows.filter(r=>String(paidBy(r)).toLowerCase()===key),'gross_amount');const rec=sum(own.filter(r=>String(r.payment_received_by||'').toLowerCase()===key),'freight')+sum(com.filter(r=>String(r.payment_received_by||'').toLowerCase()===key),'customer_pays_wo_gst');const sal=sum(salary.filter(r=>String(r.drawn_by||'').toLowerCase()===key),'amount');const net=sal+rec-exp;return `<tr><td><b>${name}</b></td><td>${money(exp)}</td><td>${money(rec)}</td><td>${money(sal)}</td><td><b>${money(net)}</b></td></tr>`}).join('')}</tbody></table></div></div>`;}
async function render(){
 if(!currentSession){body.innerHTML='<div class="panel"><p class="muted">Sign in to view dashboard.</p></div>';return;}
 body.innerHTML='<div class="panel"><p class="muted">Loading dashboard…</p></div>';
 try{
  const [ot,ct,oe,ce,sd,fa]=await Promise.all([
   sb.from('own_trips').select('trip_date,freight,payment_received_by,pod_received,invoice_applicable,invoice_generated'),
   sb.from('commission_trips').select('trip_date,customer_pays_wo_gst,customer_pays_w_gst,paying_to_driver,paid_so_far,pending,commission,net_income,historical_commission,historical_net_income,payment_received_by,pod_received,invoice_applicable,invoice_generated'),
   sb.from('own_expenses').select('expense_date,paid_by,paid_by_other,category,gross_amount'),
   sb.from('commission_expenses').select('expense_date,paid_by,paid_by_other,gross_amount'),
   sb.from('salary_drawn').select('drawn_date,amount,drawn_by'),
   sb.from('financial_adjustments').select('adjustment_date,adjustment_type,amount')
  ]);
  const bad=[ot,ct,oe,ce,sd,fa].find(x=>x.error);if(bad)throw bad.error;
  const own=(ot.data||[]).filter(r=>inRange(r.trip_date)),com=(ct.data||[]).filter(r=>inRange(r.trip_date));
  const ownExpRows=(oe.data||[]).filter(r=>inRange(r.expense_date)),comExpRows=(ce.data||[]).filter(r=>inRange(r.expense_date));
  const salary=(sd.data||[]).filter(r=>inRange(r.drawn_date)),adj=(fa.data||[]).filter(r=>inRange(r.adjustment_date));
  const ownFreight=sum(own,'freight'),ownExp=sum(ownExpRows,'gross_amount'),ownNet=ownFreight-ownExp;
  const wo=sum(com,'customer_pays_wo_gst'),wg=sum(com,'customer_pays_w_gst'),pay=sum(com,'paying_to_driver'),paid=sum(com,'paid_so_far');
  const pending=sum(com,'pending'),commission=sum(com,r=>r.historical_commission??r.commission),tripNet=sum(com,r=>r.historical_net_income??r.net_income),comExp=sum(comExpRows,'gross_amount');
  const comFinal=tripNet,combinedNet=ownNet+comFinal,gstInput=sum(adj,r=>String(r.adjustment_type||'').toLowerCase()==='gst input benefit'?r.amount:0),finalNet=combinedNet+gstInput;
  const ownPod=own.filter(r=>r.pod_received==='NO').length,ownInv=own.filter(r=>r.invoice_applicable==='YES'&&r.invoice_generated!=='YES').length,ownGen=own.filter(r=>r.invoice_generated==='YES').length;
  const comPod=com.filter(r=>r.pod_received==='NO').length,comInv=com.filter(r=>r.invoice_applicable==='YES'&&r.invoice_generated!=='YES').length;
  const ownPaid=group(ownExpRows,paidBy,r=>r.gross_amount),comPaid=group(comExpRows,paidBy,r=>r.gross_amount),allPaid=group([...ownExpRows,...comExpRows],paidBy,r=>r.gross_amount);
  const rec={};own.forEach(r=>{const k=receivedBy(r.payment_received_by);rec[k]=(rec[k]||0)+n(r.freight)});com.forEach(r=>{const k=receivedBy(r.payment_received_by);rec[k]=(rec[k]||0)+n(r.customer_pays_wo_gst)});
  const sal=group(salary,r=>r.drawn_by||'Unspecified',r=>r.amount);
  period.textContent=!from.value&&!to.value?'All time':from.value&&to.value?`${from.value} to ${to.value}`:from.value?`From ${from.value}`:`Up to ${to.value}`;
  body.innerHTML=`<div class="panel"><h2>Own Vehicle Summary</h2><div class="cards">${card('Own Trips',own.length,true)}${card('Freight Revenue',ownFreight)}${card('Own Expenses',ownExp)}${card('Own Net After Expenses',ownNet)}${card('POD Pending',ownPod,true)}${card('Invoice Pending',ownInv,true)}${card('Invoices Generated',ownGen,true)}</div></div>${table('Own Expense — Paid By',ownPaid)}<div class="panel"><h2>Commission Business Summary</h2><div class="cards">${card('Commission Trips',com.length,true)}${card('Customer WO GST',wo)}${card('Customer W GST',wg)}${card('Paying to Drivers',pay)}${card('Paid So Far',paid)}${card('Driver Pending',pending)}${card('Commission',commission)}${card('Trip Net Income',tripNet)}${card('Commission Expenses (Reference)',comExp)}${card('Final Commission Net',comFinal)}${card('POD Pending',comPod,true)}${card('Invoice Pending',comInv,true)}</div><p class="muted" style="margin-top:10px">Commission Expenses are already included in Paying to Drivers and are not deducted again from profit.</p></div>${table('Commission Expense — Paid By',comPaid)}<div class="panel"><h2>Consolidated Business Summary</h2><div class="cards">${card('Total Trips',own.length+com.length,true)}${card('Gross Business Inflow',ownFreight+wo)}${card('Own Freight Revenue',ownFreight)}${card('Commission Trip Net',tripNet)}${card('Expenses Deducted in Profit',ownExp)}${card('Combined Net Income',combinedNet)}${card('GST Input Benefit',gstInput)}${card('Final Net Profit',finalNet)}${card('Driver Pending',pending)}${card('Total POD Pending',ownPod+comPod,true)}${card('Total Invoice Pending',ownInv+comInv,true)}</div></div>${table('Combined Expenses — Paid By',allPaid)}${table('Total Amount Received — By Person',rec)}${table('Salary Drawn — By Person',sal)}${personSummary([...ownExpRows,...comExpRows],own,com,salary)}`;
 }catch(e){console.error('v21 dashboard failed',e);body.innerHTML=`<div class="panel"><h2>Business Dashboard</h2><p class="muted">Dashboard could not load: ${esc(e?.message||'Unknown error')}</p></div>`;}
}
window.renderGtlDashboard=render;
try{renderDashboard=()=>render();}catch(e){}
function setQuick(v){const d=new Date(),y=d.getFullYear(),m=d.getMonth();if(v==='all'){from.value='';to.value=''}else if(v==='month'){from.value=new Date(y,m,1).toISOString().slice(0,10);to.value=new Date(y,m+1,0).toISOString().slice(0,10)}else if(v==='lastmonth'){from.value=new Date(y,m-1,1).toISOString().slice(0,10);to.value=new Date(y,m,0).toISOString().slice(0,10)}else{const sy=m>=3?y:y-1;from.value=`${sy}-04-01`;to.value=`${sy+1}-03-31`}render();}
quick.onchange=()=>setQuick(quick.value);document.getElementById('v21Apply').onclick=render;document.getElementById('v21All').onclick=()=>{quick.value='all';setQuick('all')};from.onchange=()=>quick.value='all';to.onchange=()=>quick.value='all';document.querySelector('[data-page="dashboard"]')?.addEventListener('click',()=>setTimeout(render,0));setTimeout(render,400);setTimeout(render,1400);
})();