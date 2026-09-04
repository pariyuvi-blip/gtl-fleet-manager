// GTL v31 - Safari-safe dashboard startup independent of the legacy gtlAppReady timing.
(()=>{
  let starting=false;
  async function startDashboard(){
    if(starting)return;
    starting=true;
    try{
      const result=await sb.auth.getSession();
      const session=result&&result.data?result.data.session:null;
      if(!session)return;
      currentSession=session;
      window.gtlAppReady=true;
      if(typeof window.renderGtlDashboard==='function')await window.renderGtlDashboard();
    }catch(e){
      console.error('dashboard v31 startup failed',e);
    }finally{
      starting=false;
    }
  }
  window.addEventListener('load',startDashboard,{once:true});
  window.addEventListener('pageshow',startDashboard);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')startDashboard();});
  setTimeout(startDashboard,150);
  setTimeout(startDashboard,900);
})();
