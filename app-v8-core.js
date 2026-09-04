const STORAGE_KEY='gtl_fleet_manager_v1';
const DEFAULT_DATA={customers:[],ownTrips:[],commissionTrips:[]};
const GTL={gstin:'29NAQPK5772A1Z1',name:'Garuda Transports and Logistics (GTL)',proprietor:'ARCHANA G K',address:'Krishna kuteera, Ane Thota road, Near J P school, Nirvani layout, Sharada Devi Nagara, Tumku-572103',mobile:'9036930501',email:'garudatransportsandlogitics@gamil.com',hsn:'996511',bank:'KARNATAKA BANK',account:'0757202600002701',ifsc:'KARB0000757',branch:'TUMKUR'};

const SUPABASE_URL='https://lmxrblpznecrsxmwjlng.supabase.co';
const SUPABASE_KEY='sb_publishable_eryH9fM_2Q_Gp4WCesCUHQ_NFeG6eME';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let db=loadLocal(),previewSelection=[],currentSession=null,cloudReady=false,realtimeChannel=null,refreshTimer=null;
window.gtlAppReady=false;
function clone(x){return JSON.parse(JSON.stringify(x))}
function loadLocal(){try{const x=JSON.parse(localStorage.getItem(STORAGE_KEY));return x&&x.customers?x:clone(DEFAULT_DATA)}catch{return clone(DEFAULT_DATA)}}
function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(db));renderAll()}
function setCloudStatus(text,state=''){if(!window.cloudStatus)return;cloudStatus.textContent=text;cloudStatus.className='cloud-status '+state}
function must(result){if(result.error)throw result.error;return result.data}
function mapCustomer(c){return{id:c.id,name:c.name||'',address:c.address||'',gstin:c.gstin||'',state:c.state||'',stateCode:c.state_code||''}}
function mapOwn(r){return{_dbid:r.id,id:r.trip_id,date:r.trip_date,truck:r.truck_number||'KA07AD0725',from:r.from_location||'',to:r.to_location||'',customerId:r.customer_id||'other',otherCustomerName:r.customer_id?'':(r.customer_name||''),freight:+r.freight||0,paymentReceivedBy:r.payment_received_by||'',pod:r.pod_received||'NO',invoiceApplicable:r.invoice_applicable||'NO',invoiceGenerated:r.invoice_generated||'NO',invoiceNumber:r.invoice_number||'',remarks:r.remarks||'',updatedAt:r.updated_at||r.created_at||''}}
function mapCom(r){return{_dbid:r.id,id:r.trip_id,date:r.trip_date,truck:r.truck_number||'',driver:r.driver_name||'',from:r.from_location||'',to:r.to_location||'',customerId:r.customer_id||'other',otherCustomerName:r.customer_id?'':(r.customer_name||''),payingToDriver:+r.paying_to_driver||0,paidSoFar:+r.paid_so_far||0,pending:+r.pending||0,customerWoGst:+r.customer_pays_wo_gst||0,customerWGst:+r.customer_pays_w_gst||0,commission:+r.commission||0,netIncome:+r.net_income||0,pod:r.pod_received||'NO',invoiceApplicable:r.invoice_applicable||'NO',invoiceGenerated:r.invoice_generated||'NO',invoiceNumber:r.invoice_number||'',remarks:r.remarks||'',updatedAt:r.updated_at||r.created_at||''}}
async function refreshNormalized(){
  const [c,o,m]=await Promise.all([
    sb.from('customers').select('id,name,address,gstin,state,state_code').order('name'),
    sb.from('own_trips').select('*').order('trip_date',{ascending:false}).order('created_at',{ascending:false}),
    sb.from('commission_trips').select('*').order('trip_date',{ascending:false}).order('created_at',{ascending:false})
  ]);
  db={customers:must(c).map(mapCustomer),ownTrips:must(o).map(mapOwn),commissionTrips:must(m).map(mapCom)};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(db));
}
async function loadCloud(){
  setCloudStatus('Loading…','syncing');
  const {data:approval,error:approvalError}=await sb.from('approved_users').select('email,role').maybeSingle();
  if(approvalError||!approval){await sb.auth.signOut();throw new Error('This email is not approved for GTL Fleet Manager.')}
  await refreshNormalized();cloudReady=true;setCloudStatus('Saved','ok');
}
async function cloudWrite(action,successMessage=''){
  if(!currentSession||!cloudReady){alert('Cloud is not ready. Please sign in again.');return false}
  setCloudStatus('Saving…','syncing');
  try{await action();await refreshNormalized();setCloudStatus('Saved','ok');renderAll();if(successMessage)alert(successMessage);return true}
  catch(err){console.error(err);setCloudStatus('Save failed','error');alert('Cloud save failed. Your change was not committed. Please check the connection and try again.');return false}
}
function queueRealtimeRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(async()=>{if(!currentSession||!cloudReady)return;try{await refreshNormalized();renderAll();setCloudStatus('Saved','ok')}catch(e){console.error(e)}},350)}
function startRealtime(){
  if(realtimeChannel)return;
  realtimeChannel=sb.channel('gtl-normalized-v8')
    .on('postgres_changes',{event:'*',schema:'public',table:'customers'},queueRealtimeRefresh)
    .on('postgres_changes',{event:'*',schema:'public',table:'own_trips'},queueRealtimeRefresh)
    .on('postgres_changes',{event:'*',schema:'public',table:'commission_trips'},queueRealtimeRefresh)
    .subscribe();
}
async function stopRealtime(){if(realtimeChannel){await sb.removeChannel(realtimeChannel);realtimeChannel=null}}
function showLogin(message=''){window.gtlAppReady=false;document.body.classList.add('auth-locked');appShell.hidden=true;loginScreen.classList.remove('hidden');logoutBtn.classList.add('hidden');signedInUser.textContent='';loginMessage.textContent=message||''}
async function showApp(session){currentSession=session;cloudReady=false;window.gtlAppReady=false;try{await loadCloud();startRealtime();document.body.classList.remove('auth-locked');loginScreen.classList.add('hidden');appShell.hidden=false;logoutBtn.classList.remove('hidden');signedInUser.textContent=session.user.email||'';resetOwn();resetCom();window.gtlAppReady=true;renderAll();window.dispatchEvent(new Event('gtl-app-ready'))}catch(err){window.gtlAppReady=false;showLogin(err.message||'Unable to load GTL cloud data.')}}
async function passwordSignIn(){const email=loginEmail.value.trim().toLowerCase(),password=loginPassword.value;if(!email||!password){loginMessage.textContent='Enter the password.';return}passwordLoginBtn.disabled=true;loginMessage.textContent='Signing in…';const {data,error}=await sb.auth.signInWithPassword({email,password});passwordLoginBtn.disabled=false;if(error){loginMessage.textContent=/invalid login credentials/i.test(error.message||'')?'Login failed. Check the password and make sure the email account has been confirmed.':error.message;return}loginMessage.textContent='';if(data?.session)await showApp(data.session)}
async function initAuth(){passwordLoginBtn.onclick=passwordSignIn;loginPassword.addEventListener('keydown',e=>{if(e.key==='Enter')passwordSignIn()});logoutBtn.onclick=async()=>{await stopRealtime();await sb.auth.signOut();currentSession=null;cloudReady=false;window.gtlAppReady=false;showLogin('Signed out.')};const {data:{session}}=await sb.auth.getSession();if(session)await showApp(session);else showLogin();sb.auth.onAuthStateChange(async(event,session)=>{if(event==='SIGNED_IN'&&session&&session.access_token!==currentSession?.access_token)await showApp(session);if(event==='SIGNED_OUT'){await stopRealtime();currentSession=null;cloudReady=false;window.gtlAppReady=false;showLogin()}})}
function today(){return new Date().toISOString().slice(0,10)}
function money(n){return '₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function customerName(id,otherName=''){return id==='other'?(otherName||'Other'):(db.customers.find(c=>c.id===id)?.name||'')}
function isVahini(id){return (db.customers.find(c=>c.id===id)?.name||'').toUpperCase().startsWith('VAHINI POLYTECH INDUSTRIES PVT LTD')}
