// GTL v20 dashboard - fresh asset to avoid stale cached dashboard filename
// The v19 renderer is loaded from a same-origin versioned asset, not a CDN.
(()=>{
  const s=document.createElement('script');
  s.src='app-v16-dashboard.js?v=20';
  s.onload=()=>{
    const mark=document.querySelector('#dashboard .muted');
    if(mark && /^Build v19$/.test(mark.textContent.trim())) mark.textContent='Build v20';
    if(typeof window.renderGtlDashboard==='function') window.renderGtlDashboard();
  };
  s.onerror=()=>{
    const dash=document.getElementById('dashboard');
    if(dash) dash.innerHTML='<div class="panel"><h2>Business Dashboard</h2><p class="muted">Dashboard asset could not load. Please refresh once.</p></div>';
  };
  document.body.appendChild(s);
})();
