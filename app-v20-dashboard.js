// GTL v20 dashboard - fresh entry asset.
// Load the last known-good standalone renderer by immutable GitHub commit.
(()=>{
  const dash=document.getElementById('dashboard');
  if(dash) dash.innerHTML='<div class="panel"><h2>Business Dashboard</h2><p class="muted">Loading Build v20…</p></div>';
  const s=document.createElement('script');
  s.src='https://raw.githubusercontent.com/pariyuvi-blip/gtl-fleet-manager/ee4925a595a685a8c66e12935365b6ea9d80c11e/app-v16-dashboard.js';
  s.onload=()=>{
    setTimeout(()=>{
      const marks=[...document.querySelectorAll('#dashboard .muted')];
      const mark=marks.find(x=>/^Build v19$/.test((x.textContent||'').trim()));
      if(mark) mark.textContent='Build v20';
      if(typeof window.renderGtlDashboard==='function') window.renderGtlDashboard();
    },0);
  };
  s.onerror=()=>{if(dash)dash.innerHTML='<div class="panel"><h2>Business Dashboard</h2><p class="muted">Build v20 could not load. Please refresh once.</p></div>';};
  document.body.appendChild(s);
})();
