// GTL v26 Safari dashboard reliability bridge
(()=>{
  let running=false;
  async function ensureDashboard(){
    if(running||!window.gtlAppReady||typeof window.renderGtlDashboard!=='function')return;
    const dash=document.getElementById('dashboard');
    if(!dash)return;
    running=true;
    try{
      await window.renderGtlDashboard();
    }catch(err){
      console.error('v26 dashboard bridge failed',err);
      const body=document.getElementById('v16DashboardBody');
      if(body)body.innerHTML='<div class="panel"><h3>Dashboard could not load</h3><p class="muted">Please refresh once. If this remains, report this screen.</p></div>';
    }finally{
      running=false;
    }
  }
  window.addEventListener('gtl-app-ready',ensureDashboard);
  window.addEventListener('pageshow',()=>setTimeout(ensureDashboard,50));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(ensureDashboard,50)});
  const tab=document.querySelector('[data-page="dashboard"]');
  if(tab)tab.addEventListener('click',()=>setTimeout(ensureDashboard,0));
  setTimeout(ensureDashboard,250);
  setTimeout(ensureDashboard,1000);
  setTimeout(ensureDashboard,2500);
})();
