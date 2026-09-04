// GTL dashboard bridge v21 - one-way load to the self-contained renderer.
(()=>{
  const dash=document.getElementById('dashboard');
  if(dash) dash.innerHTML='<div class="panel"><h2>Business Dashboard</h2><p class="muted">Loading Build v21…</p></div>';
  const s=document.createElement('script');
  s.src='app-v20-dashboard.js?v=21';
  s.onerror=()=>{if(dash)dash.innerHTML='<div class="panel"><h2>Business Dashboard</h2><p class="muted">Build v21 could not load. Please refresh once.</p></div>';};
  document.body.appendChild(s);
})();
