// GTL v15 dashboard recovery: explicit DOM bindings and reliable rendering
(()=>{
  function bindDashboard(){
    const dashboard=document.getElementById('dashboard');
    if(!dashboard)return;
    window.dashFrom=document.getElementById('dashFrom');
    window.dashTo=document.getElementById('dashTo');
    window.dashQuick=document.getElementById('dashQuick');
    window.dashApply=document.getElementById('dashApply');
    window.dashClear=document.getElementById('dashClear');
    window.dashPeriodLabel=document.getElementById('dashPeriodLabel');
    window.dashContent=document.getElementById('dashContent');
    if(!dashFrom||!dashTo||!dashQuick||!dashApply||!dashClear||!dashContent)return;

    const safeRender=async()=>{
      try{
        if(typeof window.renderAdvancedDashboard==='function') await window.renderAdvancedDashboard();
      }catch(err){
        console.error('Dashboard render failed',err);
        dashContent.innerHTML='<div class="panel"><h3>Dashboard could not load</h3><p class="muted">Please refresh the page. If this continues, check the browser console.</p></div>';
      }
    };
    function quick(v){
      const d=new Date(),y=d.getFullYear(),m=d.getMonth();let f='',t='';
      if(v==='month'){f=new Date(y,m,1).toISOString().slice(0,10);t=new Date(y,m+1,0).toISOString().slice(0,10)}
      else if(v==='lastmonth'){f=new Date(y,m-1,1).toISOString().slice(0,10);t=new Date(y,m,0).toISOString().slice(0,10)}
      else if(v==='fy'){const sy=m>=3?y:y-1;f=`${sy}-04-01`;t=`${sy+1}-03-31`}
      dashFrom.value=f;dashTo.value=t;safeRender();
    }
    dashQuick.onchange=()=>quick(dashQuick.value);
    dashApply.onclick=safeRender;
    dashClear.onclick=()=>{dashQuick.value='all';dashFrom.value='';dashTo.value='';safeRender()};
    dashFrom.onchange=()=>{dashQuick.value='all'};
    dashTo.onchange=()=>{dashQuick.value='all'};
    const btn=document.querySelector('[data-page="dashboard"]');
    if(btn)btn.addEventListener('click',safeRender);
    setTimeout(safeRender,300);
    setTimeout(safeRender,1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindDashboard);else bindDashboard();
})();