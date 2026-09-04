// GTL v29 - preserve the last successful dashboard summary while Safari refreshes cloud data.
(()=>{
  const KEY='gtl-dashboard-summary-v29';
  const getBody=()=>document.getElementById('v16DashboardBody');
  const read=()=>{try{return localStorage.getItem(KEY)||''}catch(e){return''}};
  const save=html=>{try{localStorage.setItem(KEY,html)}catch(e){}};
  const isSummary=html=>html.includes('Own Vehicle Summary')&&html.includes('Consolidated Business Summary');
  const isTransient=html=>html.includes('Loading dashboard data')||html.includes('Waiting for signed-in data')||html.includes('Waiting for dashboard data');
  function protect(){
    const body=getBody();
    if(!body)return;
    const cached=read();
    if(cached&&isTransient(body.innerHTML))body.innerHTML=cached;
    const observer=new MutationObserver(()=>{
      const html=body.innerHTML;
      if(isSummary(html)){save(html);return;}
      const last=read();
      if(last&&isTransient(html))body.innerHTML=last;
    });
    observer.observe(body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',protect,{once:true});else protect();
})();
