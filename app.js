// RTO Dashboard - client-side Firebase Realtime DB listener
// 1) Create a Firebase project and Realtime Database.
// 2) Replace firebaseConfig below with your project's config.
// 3) Ensure your hardware posts JSON to /alerts in realtime db.

const firebaseConfig = {
  // <-- REPLACE with your Firebase config; example keys:
  apiKey: "AIzaSyCcEihNH482BG4orb3DF-1ggXckNe3JCUo",
  authDomain: "soberdrivedb.firebaseapp.com",
  databaseURL: "https://soberdrivedb-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "soberdrivedb",
  storageBucket: "soberdrivedb.firebasestorage.app",
  messagingSenderId: "1053897711515",
  appId: "1:1053897711515:web:2baa410ad6b459a9930b3e"

};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const alertsRef = db.ref('/');

const alertsBody = document.getElementById('alertsBody');
const totalAlertsEl = document.getElementById('totalAlerts');
const ackEl = document.getElementById('acknowledged');
const unackEl = document.getElementById('unack');
const searchInput = document.getElementById('search');
const exportBtn = document.getElementById('exportCsv');
const clearBtn = document.getElementById('clearAll');

let alertsCache = {}; // {key: data}

function humanTime(ts){
  try{
    const d = new Date(ts);
    if (isNaN(d)) return ts;
    return d.toLocaleString();
  }catch(e){ return ts; }
}

function renderTable(filterText=''){
  const rows = [];
  const keys = Object.keys(alertsCache).sort((a,b)=> (alertsCache[b].timestamp || 0) - (alertsCache[a].timestamp || 0));
  keys.forEach(k=>{
    const a = alertsCache[k];
    const txt = JSON.stringify(a).toLowerCase();
    if (filterText && !txt.includes(filterText.toLowerCase())) return;
    rows.push(`
      <tr data-key="${k}">
        <td>${humanTime(a.timestamp || a.time || '')}</td>
        <td>${a.driver_name || '-'}</td>
        <td>${a.licence || '-'}</td>
        <td>${a.vehicle_no || '-'}</td>
        <td>${a.alcohol_level != null ? a.alcohol_level : '-'}</td>
        <td>${a.threshold != null ? a.threshold : '-'}</td>
        <td>${a.location || '-'}</td>
        <td>${a.ack ? '<span class="badge">ACK</span>' : '<span class="badge">NEW</span>'}</td>
        <td>
          <button class="small" onclick="ackAlert('${k}')">Acknowledge</button>
          <button class="small" onclick="viewDetails('${k}')">View</button>
          <button class="small" onclick="deleteAlert('${k}')">Del</button>
        </td>
      </tr>
    `);
  });
  alertsBody.innerHTML = rows.join('\n') || '<tr><td colspan="9" style="color:var(--muted)">No alerts</td></tr>';
  totalAlertsEl.textContent = keys.length;
  const ackCount = keys.filter(k=>alertsCache[k].ack).length;
  ackEl.textContent = ackCount;
  unackEl.textContent = keys.length - ackCount;
}

window.viewDetails = function(key){
  const panel = document.getElementById('detailsPanel');
  const pre = document.getElementById('detailsJson');
  panel.hidden = false;
  pre.textContent = JSON.stringify(alertsCache[key], null, 2);
  window.currentKey = key;
};
document.getElementById('closeDetails').addEventListener('click', ()=>{
  document.getElementById('detailsPanel').hidden = true;
});

window.ackAlert = function(key){
  alertsRef.child(key).update({ack:true, acknowledged_at: Date.now()});
};
window.deleteAlert = function(key){
  if (!confirm('Delete alert '+key+' ?')) return;
  alertsRef.child(key).remove();
};

searchInput.addEventListener('input', ()=> renderTable(searchInput.value));
exportBtn.addEventListener('click', exportCsv);
clearBtn.addEventListener('click', ()=>{
  if (!confirm('Delete all alerts? (dev only)')) return;
  alertsRef.remove();
});

function exportCsv(){
  const keys = Object.keys(alertsCache);
  if (!keys.length) { alert('no data'); return; }
  const header = ['key','time','driver_name','licence','vehicle_no','alcohol_level','threshold','location','ack'];
  const lines = [header.join(',')];
  keys.forEach(k=>{
    const a = alertsCache[k];
    const row = [
      k,
      (a.timestamp||''),
      (a.driver_name||''),
      (a.licence||''),
      (a.vehicle_no||''),
      (a.alcohol_level!=null?a.alcohol_level:''),
      (a.threshold!=null?a.threshold:''),
      (a.location||''),
      (a.ack? '1':'0')
    ].map(s=>('"'+String(s).replace(/"/g,'""')+'"'));
    lines.push(row.join(','));
  });
  const blob = new Blob([lines.join('\n')], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rto_alerts.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// realtime listeners
alertsRef.on('value', snapshot=>{
  const v = snapshot.val() || {};
  alertsCache = v;
  renderTable(searchInput.value);
});

// child_added for toast (simple)
alertsRef.on('child_added', snap=>{
  const a = snap.val();
  if (!a.ack) {
    // quick visual indication
    console.log('New alert', a);
  }
});

/* Example: hardware POST payload (JSON) to /alerts with push():
{
  "driver_name": "Rahul Kumar",
  "licence": "DL-01-20240012345",
  "vehicle_no": "DL1AB1234",
  "alcohol_level": 0.45,
  "threshold": 0.25,
  "location": "New Delhi, Ring Road",
  "timestamp": 1690000000000,
  "device_id": "ARDUINO-01"
}
Hardware should send to: https://<PROJECT>.firebaseio.com/alerts.json using HTTP POST with JSON body
or use Firebase Admin SDK to push securely from server side.
*/
