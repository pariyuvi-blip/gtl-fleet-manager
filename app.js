const STORAGE_KEY='gtl_fleet_manager_v1';
const DEFAULT_DATA={
  counters:{own:1,commission:1},
  customers:[
    {id:'cust-sunvik',name:'SUNVIK STEELS Private Limited',address:'Jodidevarahalli, Kallambella hobli, Sira Taluk, Tumkur',gstin:'29AAHCS6286N1ZE',state:'KARNATAKA',stateCode:'29'},
    {id:'cust-vahini',name:'VAHINI POLYTECH INDUSTRIES PVT LTD',address:'Tumkur',gstin:'29AABCV2840F1ZE',state:'KARNATAKA',stateCode:'29'}
  ], ownTrips:[], commissionTrips:[]
};
const GTL={gstin:'29NAQPK5772A1Z1',name:'Garuda Transports and Logistics (GTL)',proprietor:'ARCHANA G K',address:'Krishna kuteera, Ane Thota road, Near J P school, Nirvani layout, Sharada Devi Nagara, Tumku-572103',mobile:'9036930501',email:'garudatransportsandlogitics@gamil.com',hsn:'996511',bank:'KARNATAKA BANK',account:'0757202600002701',ifsc:'KARB0000757',branch:'TUMKUR'};

const SUPABASE_URL='https://lmxrblpznecrsxmwjlng.supabase.co';
const SUPABASE_KEY='sb_publishable_eryH9fM_2Q_Gp4WCesCUHQ_NFeG6eME';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let db=loadLocal(); let previewSelection=[]; let currentSession=null; let cloudReady=false; let saveQueue=Promise.resolve();
function clone(x){return JSON.parse(JSON.stringify(x))}
function loadLocal(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));return x&&x.customers?x:clone(DEFAULT_DATA)}catch{return clone(DEFAULT_DATA)}}
function setCloudStatus(text,state=''){if(!window.cloudStatus)return;cloudStatus.textContent=text;cloudStatus.className='cloud-status '+state}
async function persistCloud(){
  if(!currentSession||!cloudReady)return;
  setCloudStatus('Saving…','syncing');
  const {error}=await sb.from('app_state').update({data:clone(db),updated_at:new Date().toISOString(),updated_by:currentSession.user.id}).eq('id','main');
  if(error){setCloudStatus('Save failed','error');console.error(error);alert('Cloud save failed. Please check your internet connection and try again.');throw error}
  setCloudStatus('Saved','ok');
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(db));renderAll();if(currentSession&&cloudReady)saveQueue=saveQueue.then(persistCloud).catch(()=>{})}
async function loadCloud(){
  setCloudStatus('Loading…','syncing');
  const {data:approval,error:approvalError}=await sb.from('approved_users').select('email,role').maybeSingle();
  if(approvalError||!approval){await sb.auth.signOut();throw new Error('This email is not approved for GTL Fleet Manager.')}
  const {data,error}=await sb.from('app_state').select('data').eq('id','main').single();
  if(error)throw error;
  if(data?.data?.customers)db=data.data;
  localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
  cloudReady=true;setCloudStatus('Saved','ok');
}
function showLogin(message=''){document.body.classList.add('auth-locked');appShell.hidden=true;loginScreen.classList.remove('hidden');logoutBtn.classList.add('hidden');signedInUser.textContent='';loginMessage.textContent=message||''}
async function showApp(session){
  currentSession=session; cloudReady=false;
  try{await loadCloud();document.body.classList.remove('auth-locked');loginScreen.classList.add('hidden');appShell.hidden=false;logoutBtn.classList.remove('hidden');signedInUser.textContent=session.user.email||'';resetOwn();resetCom();renderAll()}
  catch(err){showLogin(err.message||'Unable to load GTL cloud data.');}
}
async function passwordSignIn(){
  const email=loginEmail.value.trim().toLowerCase(),password=loginPassword.value;
  if(!email||!password){loginMessage.textContent='Enter the password.';return}
  passwordLoginBtn.disabled=true;loginMessage.textContent='Signing in…';
  const {data,error}=await sb.auth.signInWithPassword({email,password});
  passwordLoginBtn.disabled=false;
  if(error){
    if(/invalid login credentials/i.test(error.message||'')) loginMessage.textContent='Login failed. Check the password and make sure the email account has been confirmed.';
    else loginMessage.textContent=error.message;
    return;
  }
  loginMessage.textContent='';
  if(data?.session)await showApp(data.session);
}
async function initAuth(){
  passwordLoginBtn.onclick=passwordSignIn;
  loginPassword.addEventListener('keydown',e=>{if(e.key==='Enter')passwordSignIn()});
  logoutBtn.onclick=async()=>{await sb.auth.signOut();currentSession=null;cloudReady=false;showLogin('Signed out.');};
  const {data:{session}}=await sb.auth.getSession();if(session)await showApp(session);else showLogin();
  sb.auth.onAuthStateChange(async(event,session)=>{if(event==='SIGNED_IN'&&session&&session.access_token!==currentSession?.access_token)await showApp(session);if(event==='SIGNED_OUT'){currentSession=null;cloudReady=false;showLogin();}});
}
function today(){return new Date().toISOString().slice(0,10)}
function money(n){return '₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function customerName(id,otherName=''){return id==='other'?(otherName||'Other'):(db.customers.find(c=>c.id===id)?.name||'')}
function nextId(type){const key=type==='own'?'own':'commission'; const prefix=type==='own'?'GTL-OWN-':'GTL-COM-'; return prefix+String(db.counters[key]).padStart(4,'0')}
function useId(type){const id=nextId(type);db.counters[type==='own'?'own':'commission']++;return id}

// Navigation
[...document.querySelectorAll('.tabs button')].forEach(b=>b.onclick=()=>{document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===b.dataset.page));if(b.dataset.page==='invoices')renderInvoicePicker()});

function fillCustomerSelects(){['ownCustomer','comCustomer','invoiceCustomer'].forEach(id=>{const el=document.getElementById(id);const old=el.value;const other=id==='invoiceCustomer'?'':'<option value="other">Other</option>';el.innerHTML='<option value="">Select customer</option>'+db.customers.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')+other;if([...el.options].some(o=>o.value===old))el.value=old;});toggleOtherCustomer('own');toggleOtherCustomer('com');}
function toggleOtherCustomer(prefix){const sel=document.getElementById(prefix+'Customer'),wrap=document.getElementById(prefix+'OtherCustomerWrap'),input=document.getElementById(prefix+'OtherCustomer');if(!sel||!wrap)return;const show=sel.value==='other';wrap.classList.toggle('hidden',!show);if(input)input.required=show;}
ownCustomer.addEventListener('change',()=>toggleOtherCustomer('own'));comCustomer.addEventListener('change',()=>toggleOtherCustomer('com'));
function syncInvoiceStatus(prefix){const a=document.getElementById(prefix+'InvoiceApplicable'),g=document.getElementById(prefix+'InvoiceGenerated');if(a.value==='NO'&&g.value==='NO')g.value='NA';if(a.value==='YES'&&g.value==='NA')g.value='NO'}
['own','com'].forEach(p=>document.getElementById(p+'InvoiceApplicable').addEventListener('change',()=>syncInvoiceStatus(p)));

function resetOwn(){document.getElementById('ownForm').reset();ownEditId.value='';ownDate.value=today();ownTripId.value=nextId('own');ownInvoiceApplicable.value='YES';ownInvoiceGenerated.value='NO';toggleOtherCustomer('own')}
function resetCom(){document.getElementById('commissionForm').reset();comEditId.value='';comDate.value=today();comTripId.value=nextId('commission');['comPaying','comPaid','comWoGst','comWGst'].forEach(id=>document.getElementById(id).value='0');comInvoiceApplicable.value='YES';comInvoiceGenerated.value='NO';toggleOtherCustomer('com');calcCommission()}
ownClear.onclick=resetOwn;comClear.onclick=resetCom;

ownForm.onsubmit=e=>{e.preventDefault();const edit=ownEditId.value;const r={id:edit||useId('own'),date:ownDate.value,truck:'KA07AD0725',from:ownFrom.value.trim(),to:ownTo.value.trim(),customerId:ownCustomer.value,otherCustomerName:ownCustomer.value==='other'?ownOtherCustomer.value.trim():'',freight:+ownFreight.value||0,paymentReceivedBy:ownPaymentBy.value.trim(),pod:ownPod.value,invoiceApplicable:ownInvoiceApplicable.value,invoiceGenerated:ownInvoiceGenerated.value,invoiceNumber:ownInvoiceNumber.value.trim(),remarks:ownRemarks.value.trim(),updatedAt:new Date().toISOString()};if(edit){db.ownTrips[db.ownTrips.findIndex(x=>x.id===edit)]=r}else db.ownTrips.push(r);save();resetOwn()};

function calcCommission(){const paying=+comPaying.value||0,paid=+comPaid.value||0,wo=+comWoGst.value||0;const pending=paying-paid;const commission=.10*(wo-paying);const net=wo-paying-commission;comPending.value=pending.toFixed(2);comCommission.value=commission.toFixed(2);comNet.value=net.toFixed(2)}
document.querySelectorAll('.calc').forEach(x=>x.addEventListener('input',calcCommission));
commissionForm.onsubmit=e=>{e.preventDefault();calcCommission();const edit=comEditId.value,paying=+comPaying.value||0,paid=+comPaid.value||0,wo=+comWoGst.value||0,commission=.10*(wo-paying);const r={id:edit||useId('commission'),date:comDate.value,tripNo:comTripNo.value.trim(),truck:comTruck.value.trim().toUpperCase(),driver:comDriver.value.trim(),from:comFrom.value.trim(),to:comTo.value.trim(),customerId:comCustomer.value,otherCustomerName:comCustomer.value==='other'?comOtherCustomer.value.trim():'',payingToDriver:paying,paidSoFar:paid,pending:paying-paid,customerWoGst:wo,customerWGst:+comWGst.value||0,commission,netIncome:wo-paying-commission,pod:comPod.value,invoiceApplicable:comInvoiceApplicable.value,invoiceGenerated:comInvoiceGenerated.value,invoiceNumber:comInvoiceNumber.value.trim(),remarks:comRemarks.value.trim(),updatedAt:new Date().toISOString()};if(edit){db.commissionTrips[db.commissionTrips.findIndex(x=>x.id===edit)]=r}else db.commissionTrips.push(r);save();resetCom()};

function renderOwn(q=''){const rows=db.ownTrips.filter(r=>JSON.stringify(r).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date));ownTable.innerHTML=`<thead><tr><th>Trip ID</th><th>Date</th><th>Truck</th><th>From</th><th>To</th><th>Customer</th><th>Freight</th><th>Payment By</th><th>POD</th><th>Invoice?</th><th>Generated</th><th>Invoice No.</th><th>Remarks</th><th></th></tr></thead><tbody>`+rows.map(r=>`<tr><td>${r.id}</td><td>${r.date}</td><td>${r.truck}</td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td>${esc(customerName(r.customerId,r.otherCustomerName))}</td><td>${money(r.freight)}</td><td>${esc(r.paymentReceivedBy)}</td><td>${r.pod}</td><td>${r.invoiceApplicable}</td><td>${r.invoiceGenerated}</td><td>${esc(r.invoiceNumber)}</td><td>${esc(r.remarks)}</td><td><button class="small secondary" onclick="editOwn('${r.id}')">Edit</button></td></tr>`).join('')+'</tbody>'}
ownSearch.oninput=()=>renderOwn(ownSearch.value);
window.editOwn=id=>{const r=db.ownTrips.find(x=>x.id===id);if(!r)return;ownEditId.value=r.id;ownTripId.value=r.id;ownDate.value=r.date;ownFrom.value=r.from;ownTo.value=r.to;ownCustomer.value=r.customerId;ownOtherCustomer.value=r.otherCustomerName||'';toggleOtherCustomer('own');ownFreight.value=r.freight;ownPaymentBy.value=r.paymentReceivedBy;ownPod.value=r.pod;ownInvoiceApplicable.value=r.invoiceApplicable;ownInvoiceGenerated.value=r.invoiceGenerated;ownInvoiceNumber.value=r.invoiceNumber;ownRemarks.value=r.remarks;document.querySelector('[data-page="own"]').click();scrollTo({top:0,behavior:'smooth'})};

function renderCom(q=''){const rows=db.commissionTrips.filter(r=>JSON.stringify(r).toLowerCase().includes(q.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date));comTable.innerHTML=`<thead><tr><th>Trip ID</th><th>Date</th><th>Trip No.</th><th>Truck</th><th>Driver</th><th>From</th><th>To</th><th>Customer</th><th>Paying Driver</th><th>Paid</th><th>Pending</th><th>WO GST</th><th>W GST</th><th>Commission</th><th>Net Income</th><th>POD</th><th>Invoice?</th><th>Generated</th><th>Invoice No.</th><th>Remarks</th><th></th></tr></thead><tbody>`+rows.map(r=>`<tr><td>${r.id}</td><td>${r.date}</td><td>${esc(r.tripNo)}</td><td>${esc(r.truck)}</td><td>${esc(r.driver)}</td><td>${esc(r.from)}</td><td>${esc(r.to)}</td><td>${esc(customerName(r.customerId,r.otherCustomerName))}</td><td>${money(r.payingToDriver)}</td><td>${money(r.paidSoFar)}</td><td>${money(r.pending)}</td><td>${money(r.customerWoGst)}</td><td>${money(r.customerWGst)}</td><td>${money(r.commission)}</td><td>${money(r.netIncome)}</td><td>${r.pod}</td><td>${r.invoiceApplicable}</td><td>${r.invoiceGenerated}</td><td>${esc(r.invoiceNumber)}</td><td>${esc(r.remarks)}</td><td><button class="small secondary" onclick="editCom('${r.id}')">Edit</button></td></tr>`).join('')+'</tbody>'}
comSearch.oninput=()=>renderCom(comSearch.value);
window.editCom=id=>{const r=db.commissionTrips.find(x=>x.id===id);if(!r)return;comEditId.value=r.id;comTripId.value=r.id;comDate.value=r.date;comTripNo.value=r.tripNo;comTruck.value=r.truck;comDriver.value=r.driver;comFrom.value=r.from;comTo.value=r.to;comCustomer.value=r.customerId;comOtherCustomer.value=r.otherCustomerName||'';toggleOtherCustomer('com');comPaying.value=r.payingToDriver;comPaid.value=r.paidSoFar;comWoGst.value=r.customerWoGst;comWGst.value=r.customerWGst;comPod.value=r.pod;comInvoiceApplicable.value=r.invoiceApplicable;comInvoiceGenerated.value=r.invoiceGenerated;comInvoiceNumber.value=r.invoiceNumber;comRemarks.value=r.remarks;calcCommission();document.querySelector('[data-page="commission"]').click();scrollTo({top:0,behavior:'smooth'})};

function eligibleTrips(){const c=invoiceCustomer.value;if(!c)return[];return [...db.ownTrips.map(r=>({...r,type:'Own',amount:r.freight,destination:r.to,vehicle:r.truck})),...db.commissionTrips.map(r=>({...r,type:'Commission',amount:r.customerWoGst,destination:r.to,vehicle:r.truck}))].filter(r=>r.customerId===c&&r.invoiceApplicable==='YES')}
function renderInvoicePicker(){const trips=eligibleTrips();invoiceTripPicker.innerHTML=trips.length?trips.map(r=>`<label class="pick-row"><input type="checkbox" class="invPick" value="${r.type}|${r.id}" ${r.invoiceGenerated==='YES'?'':'checked'}><span>${r.date}</span><span>${esc(r.id)} • ${esc(r.destination||'')}</span><span class="hide-mobile">${esc(r.vehicle||'')}</span><span class="hide-mobile">${r.invoiceGenerated}</span><b>${money(r.amount)}</b></label>`).join(''):'<div class="list-empty" style="padding:14px">No eligible trips for this customer.</div>'}
invoiceCustomer.onchange=renderInvoicePicker;invoiceDate.value=today();
previewInvoice.onclick=()=>{const c=db.customers.find(x=>x.id===invoiceCustomer.value);const selected=[...document.querySelectorAll('.invPick:checked')].map(x=>x.value);if(!c||!selected.length){alert('Select a customer and at least one trip.');return}previewSelection=selected;const trips=eligibleTrips().filter(r=>selected.includes(r.type+'|'+r.id));const subtotal=trips.reduce((s,r)=>s+(+r.amount||0),0),taxType=invoiceTaxType.value;const cgst=taxType==='CGST_SGST'?subtotal*.09:0,sgst=cgst,igst=taxType==='IGST'?subtotal*.18:0,total=subtotal+cgst+sgst+igst;invoicePreview.innerHTML=`<div class="inv-top"><div><b>GSTIN: ${GTL.gstin}</b></div><div>Original TAX INVOICE</div><h1>${GTL.name}</h1><p>Proprietor: ${GTL.proprietor}</p><p>${GTL.address}</p><p>Mobile: ${GTL.mobile} &nbsp; E-mail: ${GTL.email}</p></div><div class="inv-meta"><div><b>Invoice no:</b> ${esc(invoiceNumber.value)}<br><b>Date of invoice:</b> ${invoiceDate.value}<br><b>State:</b> KARNATAKA<br><b>State Code:</b> 29</div><div><b>Details of receiver (billed to):</b><br>${esc(c.name)}<br>Address: ${esc(c.address)}<br>GSTIN: ${esc(c.gstin)}<br>State: ${esc(c.state)} &nbsp; Code: ${esc(c.stateCode)}</div></div><p><b>HSN/SAC Code: ${GTL.hsn}</b></p><table><thead><tr><th>Sl.no</th><th>Date</th><th>Destination</th><th>Vehicle No</th><th>Trip / Ref No</th><th>Amount</th></tr></thead><tbody>${trips.map((r,i)=>`<tr><td>${i+1}</td><td>${r.date}</td><td>${esc(r.destination||'')}</td><td>${esc(r.vehicle||'')}</td><td>${esc(r.tripNo||r.id)}</td><td>${money(r.amount)}</td></tr>`).join('')}</tbody></table><div class="totals"><div><span>Total taxable amount</span><b>${money(subtotal)}</b></div>${cgst?`<div><span>ADD: CGST @ 9%</span><b>${money(cgst)}</b></div><div><span>ADD: SGST @ 9%</span><b>${money(sgst)}</b></div>`:''}${igst?`<div><span>ADD: IGST @ 18%</span><b>${money(igst)}</b></div>`:''}<div class="grand"><span>Total invoice amount</span><b>${money(total)}</b></div></div><div class="bank"><b>BANK NAME:</b> ${GTL.bank}<br><b>Account No:</b> ${GTL.account}<br><b>IFSC:</b> ${GTL.ifsc}<br><b>Branch:</b> ${GTL.branch}<br><br><b>TERMS & CONDITIONS:</b> &nbsp; FOR GTL</div>`;invoicePreview.classList.remove('hidden');invoicePreviewActions.classList.remove('hidden')};
printInvoice.onclick=()=>window.print();
markInvoice.onclick=()=>{if(!previewSelection.length)return;for(const key of previewSelection){const [type,id]=key.split('|');const arr=type==='Own'?db.ownTrips:db.commissionTrips;const r=arr.find(x=>x.id===id);if(r){r.invoiceGenerated='YES';r.invoiceNumber=invoiceNumber.value.trim()}}save();renderInvoicePicker();alert('Selected trips marked as invoice generated.');};

function renderCustomers(){customerCards.innerHTML=db.customers.map(c=>`<div class="customer-card"><h3>${esc(c.name)}</h3><p>${esc(c.address)}</p><p><b>GSTIN:</b> ${esc(c.gstin)}</p><p><b>State:</b> ${esc(c.state)} (${esc(c.stateCode)})</p><button class="small secondary" onclick="editCustomer('${c.id}')">Edit</button></div>`).join('')}
addCustomerBtn.onclick=()=>{customerForm.reset();customerEditId.value='';customerState.value='KARNATAKA';customerStateCode.value='29';customerForm.classList.remove('hidden')};customerCancel.onclick=()=>customerForm.classList.add('hidden');
window.editCustomer=id=>{const c=db.customers.find(x=>x.id===id);customerEditId.value=c.id;customerName.value=c.name;customerGstin.value=c.gstin;customerState.value=c.state;customerStateCode.value=c.stateCode;customerAddress.value=c.address;customerForm.classList.remove('hidden')};
customerForm.onsubmit=e=>{e.preventDefault();const id=customerEditId.value||'cust-'+Date.now();const c={id,name:customerName.value.trim(),gstin:customerGstin.value.trim().toUpperCase(),state:customerState.value.trim().toUpperCase(),stateCode:customerStateCode.value.trim(),address:customerAddress.value.trim()};const i=db.customers.findIndex(x=>x.id===id);if(i>=0)db.customers[i]=c;else db.customers.push(c);save();customerForm.classList.add('hidden')};

function renderDashboard(){statOwn.textContent=db.ownTrips.length;statCommission.textContent=db.commissionTrips.length;statPending.textContent=money(db.commissionTrips.reduce((s,r)=>s+(+r.pending||0),0));statNet.textContent=money(db.commissionTrips.reduce((s,r)=>s+(+r.netIncome||0),0));statInvoices.textContent=[...db.ownTrips,...db.commissionTrips].filter(r=>r.invoiceGenerated==='YES').length;const recent=[...db.ownTrips.map(r=>({...r,kind:'Own'})),...db.commissionTrips.map(r=>({...r,kind:'Commission'}))].sort((a,b)=>(b.updatedAt||b.date).localeCompare(a.updatedAt||a.date)).slice(0,8);recentTrips.innerHTML=recent.length?recent.map(r=>`<div class="recent-item"><div><b>${esc(r.id)}</b> • ${esc(r.from||'')} → ${esc(r.to||'')}<br><span class="muted">${r.date} • ${esc(customerName(r.customerId,r.otherCustomerName))}</span></div><span class="badge">${r.kind}</span></div>`).join(''):'No trips yet.'}
function renderAll(){fillCustomerSelects();renderOwn(ownSearch?.value||'');renderCom(comSearch?.value||'');renderCustomers();renderDashboard();if(document.getElementById('invoices').classList.contains('active'))renderInvoicePicker()}

exportBtn.onclick=()=>{const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='gtl-backup-'+today()+'.json';a.click();URL.revokeObjectURL(a.href)};
importInput.onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=JSON.parse(await f.text());if(!x.customers||!Array.isArray(x.ownTrips)||!Array.isArray(x.commissionTrips))throw Error();db=x;save();resetOwn();resetCom();alert('Backup restored.')}catch{alert('Invalid GTL backup file.')}e.target.value=''};
clearAllBtn.onclick=()=>{if(confirm('Delete all trips and reset the app?')){db=clone(DEFAULT_DATA);save();resetOwn();resetCom()}};

let deferredPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove('hidden')});installBtn.onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add('hidden')};
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
initAuth();
