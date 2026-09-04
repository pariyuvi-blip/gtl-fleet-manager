// GTL v33 - keep the dashboard summary body mounted and let the dashboard own its render lifecycle.
(()=>{
  const dash=document.getElementById('dashboard');
  if(!dash)return;

  function ensureBody(){
    let body=document.getElementById('v16DashboardBody');
    if(!body){
      body=document.createElement('div');
      body.id='v16DashboardBody';
      body.innerHTML='<div class="panel"><p class="muted">Preparing dashboard…</p></div>';
      dash.appendChild(body);
    }
    return body;
  }

  let scheduled=false;
  function requestRender(){
    if(scheduled)return;
    scheduled=true;
    setTimeout(()=>{
      scheduled=false;
      ensureBody();
      if(typeof window.renderGtlDashboard==='function')window.renderGtlDashboard();
    },0);
  }

  ensureBody();
  const observer=new MutationObserver(()=>{
    const body=ensureBody();
    if(!body.innerHTML.trim())requestRender();
  });
  observer.observe(dash,{childList:true,subtree:true});

  const tab=document.querySelector('[data-page="dashboard"]');
  if(tab)tab.addEventListener('click',requestRender);
  window.addEventListener('pageshow',requestRender);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')requestRender();});
  requestRender();
})();
