// GTL dashboard bridge v20 - load the fresh same-origin dashboard asset.
(()=>{
  const dash=document.getElementById('dashboard');
  if(dash) dash.innerHTML='<div class="panel"><h2>Business Dashboard</h2><p class="muted">Loading Build v20…</p></div>';
  const s=document.createElement('script');
  s.src='app-v20-dashboard.js?v=20';
  s.onerror=()=>{if(dash)dash.innerHTML='<div class="panel"><h2>Business Dashboard</h2><p class="muted">Build v20 could not load. Please refresh once.</p></div>';};
  document.body.appendChild(s);
})();
