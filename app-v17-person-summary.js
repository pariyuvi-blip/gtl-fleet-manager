// GTL v17 - Sanjay / Parikshith person-wise cash position
(()=>{
const n=v=>Number(v||0), inRange=(d,f,t)=>(!f||d>=f)&&(!t||d<=t);
const who=r=>String(r.paid_by==='Other'?(r.paid_by_other||'Other'):(r.paid_by||'')).trim().toLowerCase();
const recWho=v=>{const x=String(v||'').trim().toLowerCase();if(x==='sanjay')return'sanjay';if(x==='parikshith')return'parikshith';return''};
async function renderPersonSummary(){
 const body=document.getElementById('v16DashboardBody'); if(!body||!currentSession)return;
 const f=document.getElementById('v16From')?.value||'',t=document.getElementById('v16To')?.value||'';
 const [oe,ce,ot,ct,sd]=await Promise.all([
  sb.from('own_expenses').select('expense_date,paid_by,paid_by_other,gross_amount'),
  sb.from('commission_expenses').select('expense_date,paid_by,paid_by_other,gross_amount'),
  sb.from('own_trips').select('trip_date,freight,payment_received_by'),
  sb.from('commission_trips').select('trip_date,customer_pays_wo_gst,payment_received_by'),
  sb.from('salary_drawn').select('drawn_date,amount,drawn_by')]);
 if([oe,ce,ot,ct,sd].some(x=>x.error))return;
 const people=['parikshith','sanjay'], names={parikshith:'Parikshith',sanjay:'Sanjay'};
 const exp=[...(oe.data||[]).filter(r=>inRange(r.expense_date,f,t)),...(ce.data||[]).filter(r=>inRange(r.expense_date,f,t))];
 const own=(ot.data||[]).filter(r=>inRange(r.trip_date,f,t)),com=(ct.data||[]).filter(r=>inRange(r.trip_date,f,t)),sal=(sd.data||[]).filter(r=>inRange(r.drawn_date,f,t));
 const rows=people.map(p=>{const expense=exp.filter(r=>who(r)===p).reduce((s,r)=>s+n(r.gross_amount),0);const received=own.filter(r=>recWho(r.payment_received_by)===p).reduce((s,r)=>s+n(r.freight),0)+com.filter(r=>recWho(r.payment_received_by)===p).reduce((s,r)=>s+n(r.customer_pays_wo_gst),0);const drawn=sal.filter(r=>String(r.drawn_by||'').trim().toLowerCase()===p).reduce((s,r)=>s+n(r.amount),0);return{name:names[p],expense,received,drawn,net:drawn+received-expense};});
 let panel=document.getElementById('personCashSummary');if(!panel){panel=document.createElement('div');panel.id='personCashSummary';panel.className='panel';body.appendChild(panel);}
 panel.innerHTML=`<h2>Partner / Person-wise Summary</h2><p class="muted">Net = Salary Drawn + Amount Received − Expense Paid</p><div class="table-wrap"><table><thead><tr><th>Person</th><th>Expense Paid</th><th>Amount Received</th><th>Salary Drawn</th><th>Net</th></tr></thead><tbody>${rows.map(r=>`<tr><td><b>${r.name}</b></td><td>${money(r.expense)}</td><td>${money(r.received)}</td><td>${money(r.drawn)}</td><td><b>${money(r.net)}</b></td></tr>`).join('')}</tbody></table></div>`;
}
window.renderPersonSummary=renderPersonSummary;
const obs=new MutationObserver(()=>{if(document.getElementById('v16DashboardBody')&&!document.getElementById('personCashSummary'))setTimeout(renderPersonSummary,50)});obs.observe(document.getElementById('dashboard'),{childList:true,subtree:true});
['v16Apply','v16All'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>setTimeout(renderPersonSummary,300)));document.getElementById('v16Quick')?.addEventListener('change',()=>setTimeout(renderPersonSummary,300));document.querySelector('[data-page="dashboard"]')?.addEventListener('click',()=>setTimeout(renderPersonSummary,300));setTimeout(renderPersonSummary,1800);
})();