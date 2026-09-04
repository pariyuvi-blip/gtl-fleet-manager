// GTL v10 expense tracking
(function(){
  const expenseState={own:[],commission:[]};
  const commonTypes=['Diesel','Toll','Driver Bata','Loading / Unloading','Repair / Maintenance','Parking','Food','Other'];
  const commonPaidBy=['Garuda','Parikshith Garuda','Sanjay Garuda','Parikshith','Sanjay'];

  function eesc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function emoney(n){return '₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function uniq(a){return [...new Set(a.map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));}
  function setList(id,values){let d=document.getElementById(id);if(!d){d=document.createElement('datalist');d.id=id;document.body.appendChild(d);}d.innerHTML=uniq(values).map(v=>`<option value="${eesc(v)}"></option>`).join('');}
  function mapExpense(r){return{id:r.id,date:r.expense_date,tripId:r.trip_id||'',type:r.expense_type||'',amount:+r.amount||0,paidBy:r.paid_by||'',remarks:r.remarks||'',updatedAt:r.updated_at||r.created_at||''};}

  async function loadExpenses(){
    if(!currentSession||!cloudReady)return;
    const [o,c]=await Promise.all([
      sb.from('own_expenses').select('*').order('expense_date',{ascending:false}).order('created_at',{ascending:false}),
      sb.from('commission_expenses').select('*').order('expense_date',{ascending:false}).order('created_at',{ascending:false})
    ]);
    if(o.error||c.error){console.error(o.error||c.error);return;}
    expenseState.own=o.data.map(mapExpense);expenseState.commission=c.data.map(mapExpense);
    renderExpenses();
  }

  function fillSuggestions(){
    setList('ownExpenseTripHistory',(db.ownTrips||[]).map(r=>r.id));
    setList('comExpenseTripHistory',(db.commissionTrips||[]).map(r=>r.id));
    setList('expenseTypeHistory',[...commonTypes,...expenseState.own.map(r=>r.type),...expenseState.commission.map(r=>r.type)]);
    setList('expensePaidByHistory',[...commonPaidBy,...expenseState.own.map(r=>r.paidBy),...expenseState.commission.map(r=>r.paidBy)]);
  }

  function resetExpense(kind){
    const p=kind==='own'?'ownExp':'comExp';
    document.getElementById(p+'EditId').value='';
    document.getElementById(p+'Date').value=today();
    document.getElementById(p+'TripId').value='';
    document.getElementById(p+'Type').value='';
    document.getElementById(p+'Amount').value='';
    document.getElementById(p+'PaidBy').value='';
    document.getElementById(p+'Remarks').value='';
  }

  function renderTable(kind){
    const rows=expenseState[kind];
    const table=document.getElementById(kind==='own'?'ownExpenseTable':'comExpenseTable');
    const search=document.getElementById(kind==='own'?'ownExpenseSearch':'comExpenseSearch')?.value.toLowerCase()||'';
    const filtered=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(search));
    table.innerHTML=`<thead><tr><th>Date</th><th>Trip ID</th><th>Expense</th><th>Amount</th><th>Paid By</th><th>Remarks</th><th></th></tr></thead><tbody>`+
      filtered.map(r=>`<tr><td>${r.date}</td><td>${eesc(r.tripId)}</td><td>${eesc(r.type)}</td><td>${emoney(r.amount)}</td><td>${eesc(r.paidBy)}</td><td>${eesc(r.remarks)}</td><td><button class="small secondary" onclick="editExpense('${kind}','${r.id}')">Edit</button> <button class="small danger" onclick="deleteExpense('${kind}','${r.id}')">Delete</button></td></tr>`).join('')+`</tbody>`;
    const total=filtered.reduce((s,r)=>s+r.amount,0);
    const totalEl=document.getElementById(kind==='own'?'ownExpenseTotal':'comExpenseTotal');if(totalEl)totalEl.textContent=emoney(total);
  }
  function renderExpenses(){fillSuggestions();renderTable('own');renderTable('commission');}

  async function saveExpense(kind){
    const p=kind==='own'?'ownExp':'comExp',table=kind==='own'?'own_expenses':'commission_expenses';
    const edit=document.getElementById(p+'EditId').value;
    const type=document.getElementById(p+'Type').value.trim();
    const amount=Number(document.getElementById(p+'Amount').value||0);
    if(!type){alert('Enter expense type.');return;}
    if(!(amount>0)){alert('Enter an expense amount greater than zero.');return;}
    const payload={expense_date:document.getElementById(p+'Date').value,trip_id:document.getElementById(p+'TripId').value.trim()||null,expense_type:type,amount,paid_by:document.getElementById(p+'PaidBy').value.trim()||null,remarks:document.getElementById(p+'Remarks').value.trim()||null,created_by:currentSession.user.id};
    const ok=await cloudWrite(async()=>{const q=edit?sb.from(table).update(payload).eq('id',edit):sb.from(table).insert(payload);must(await q);});
    if(ok){await loadExpenses();resetExpense(kind);}
  }

  window.editExpense=(kind,id)=>{const r=expenseState[kind].find(x=>x.id===id);if(!r)return;const p=kind==='own'?'ownExp':'comExp';document.getElementById(p+'EditId').value=r.id;document.getElementById(p+'Date').value=r.date;document.getElementById(p+'TripId').value=r.tripId;document.getElementById(p+'Type').value=r.type;document.getElementById(p+'Amount').value=r.amount||'';document.getElementById(p+'PaidBy').value=r.paidBy;document.getElementById(p+'Remarks').value=r.remarks;document.querySelector(`[data-page="${kind==='own'?'ownExpense':'commissionExpense'}"]`).click();scrollTo({top:0,behavior:'smooth'});};
  window.deleteExpense=async(kind,id)=>{if(!confirm('Delete this expense entry?'))return;const table=kind==='own'?'own_expenses':'commission_expenses';const ok=await cloudWrite(async()=>must(await sb.from(table).delete().eq('id',id)));if(ok)await loadExpenses();};

  document.getElementById('ownExpenseForm').addEventListener('submit',e=>{e.preventDefault();saveExpense('own');});
  document.getElementById('comExpenseForm').addEventListener('submit',e=>{e.preventDefault();saveExpense('commission');});
  document.getElementById('ownExpenseClear').onclick=()=>resetExpense('own');
  document.getElementById('comExpenseClear').onclick=()=>resetExpense('commission');
  document.getElementById('ownExpenseSearch').oninput=()=>renderTable('own');
  document.getElementById('comExpenseSearch').oninput=()=>renderTable('commission');

  document.querySelectorAll('[data-page="ownExpense"],[data-page="commissionExpense"]').forEach(b=>b.addEventListener('click',loadExpenses));
  sb.channel('gtl-expenses-v10')
    .on('postgres_changes',{event:'*',schema:'public',table:'own_expenses'},loadExpenses)
    .on('postgres_changes',{event:'*',schema:'public',table:'commission_expenses'},loadExpenses)
    .subscribe();
  resetExpense('own');resetExpense('commission');
  setTimeout(loadExpenses,500);
})();