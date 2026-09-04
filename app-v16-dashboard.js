// GTL dashboard loader v17
(()=>{
 const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.body.appendChild(s)});
 load('https://cdn.jsdelivr.net/gh/pariyuvi-blip/gtl-fleet-manager@bf6aeae92ce4868af6296ef2ce8ddcd3f41006ee/app-v16-dashboard.js').then(()=>load('app-v17-person-summary.js?v=17')).catch(e=>console.error('Dashboard loader failed',e));
})();