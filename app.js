const SEED_DATA = [["IR02656065", "RINI WIDIASTUTI", "6282120403560", 140], ["IR02642663", "ANI HANDAYANI", "6282216368080", 76], ["IR02640689", "JOHN EDWARD", "6281910647111", 61], ["IR02639163", "STELLA", "6282120269375", 74], ["IR02631520", "DADAN HAERI GURATMAN", "6282119166226", 79], ["IR02581127", "DINAN", "6282110210214", 139], ["IR02578964", "JEJEN", "6281386266251", 97], ["IR02578412", "RIKA KARTIKA", "628156433533", 101], ["IR02561097", "ANITA WIDYA SUYOTO", "6282125668203", 118], ["IR02561097", "deri", 6285772220807, 118], ["IR03330481", "MELISSA AGATHAMAIL", 6282218794794, 130], ["IR03332201", "MARCELLUS KOROMPISMAIL", 6285174077514, 49], ["IR01921541", "LUTHFI RAHMANMAIL", 6287722501890, 85], ["IR01929449", "LUTHFI NURAZIZMAIL", 6285624014949, 75], ["IR03322385", "LISA GUNAWANMAIL", 6285770349038, 217], ["IR02148827", "LINDA PURBAMAIL", 6282262599388, 48], ["IR02213870", "KINANTI AMBARINI SETIAWANMAIL", 6287718052019, 65], ["IR00810225", "KHANIFATUL NURJANAHMAIL", 6285292070079, 182], ["IR03313729", "KAREL CAHYADIMAIL", 6287824022078, 36], ["IR03321923", "JULAEKAHMAIL", 6285871614312, 46]];
const PRICE = {ac1:99000,ac2:160000,acExtra:80000,sofa1:140000,sofa2:280000,sofa3:420000,sofabed:280000,mattress1:180000,mattress2:220000,mattress3:300000};
const STORAGE_KEY='blast_poin_hrr_v1';
let customers=[], activeFilter='Semua', currentId=null, selected=new Set();

function load(){
  try{customers=JSON.parse(localStorage.getItem(STORAGE_KEY))||[]}catch(e){customers=[]}
  if(!customers.length) customers=SEED_DATA.map(x=>({member:String(x[0]),name:String(x[1]),phone:String(x[2]),points:Number(x[3]),status:'Belum Blast'}));
  save();
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(customers))}
function cleanName(n){return String(n).replace(/MAIL/g,'').replace(/-WA/g,'').trim()}
function rupiah(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n)}
function pointValue(c){return c.points*2500}
function acCount(v){if(v>=400000)return 5;if(v>=320000)return 4;if(v>=240000)return 3;if(v>=160000)return 2;return 1}
function eligible(c){
 const v=pointValue(c), a=[];
 if(v>=PRICE.ac1)a.push({id:'ac',label:`Pembersihan hingga ${acCount(v)} unit AC`,price: acCount(v)==1?PRICE.ac1:PRICE.ac2+(acCount(v)-2)*PRICE.acExtra});
 if(v>=PRICE.sofa1)a.push({id:'sofa',label:v>=PRICE.sofa3?'Pembersihan sofa kain 3 seater':v>=PRICE.sofa2?'Pembersihan sofa kain 2 seater':'Pembersihan sofa kain 1 seater',price:v>=PRICE.sofa3?PRICE.sofa3:v>=PRICE.sofa2?PRICE.sofa2:PRICE.sofa1});
 if(v>=PRICE.sofabed)a.push({id:'sofabed',label:'Pembersihan sofa bed kain 1 unit',price:PRICE.sofabed});
 if(v>=PRICE.mattress1)a.push({id:'m1',label:'Pembersihan kasur ukuran 90/100/120 x 200 cm',price:PRICE.mattress1});
 if(v>=PRICE.mattress2)a.push({id:'m2',label:'Pembersihan kasur ukuran 160 x 200 cm',price:PRICE.mattress2});
 if(v>=PRICE.mattress3)a.push({id:'m3',label:'Pembersihan kasur ukuran 180/200 x 200 cm',price:PRICE.mattress3});
 return a;
}
function message(c){
 const name=cleanName(c.name), choices=eligible(c).filter(s=>selected.has(s.id));
 let lines=choices.map((s,i)=>`${i+1}. ${s.label}`);
 if(!lines.length) lines=eligible(c).map((s,i)=>`${i+1}. ${s.label}`);
 return `Selamat siang Kak ${name},\\n\\nPerkenalkan saya Ivan dari Informa. Mau menawarkan untuk Poin yang Kakak punya bisa di gunakan untuk jasa pembersihan dari Informa. Berikut beberapa pilihan yang bisa digunakan:\\n\\n${lines.join('\\n')}\\n\\nMau saya bantu jadwalkan, Kak? Layanannya free, cukup tukar poin member 🙏`;
}
function statusClass(s){return s==='Sudah Blast'?'sudah':s==='Pending'?'pending':s==='Transaksi'?'transaksi':'belum'}
function renderList(){
 const q=document.getElementById('search').value.toLowerCase().trim();
 const list=customers.filter(c=>(activeFilter==='Semua'||c.status===activeFilter)&&(!q||[c.name,c.phone,c.member].some(v=>String(v).toLowerCase().includes(q))));
 document.getElementById('countText').textContent=`${list.length} customer`;
 document.getElementById('customerList').innerHTML=list.length?list.map(c=>`<article class="customer" data-id="${c.member}"><div><div class="name">👤 ${cleanName(c.name)}</div><div class="meta">${c.phone}</div><div class="points">${c.points} poin · ${rupiah(pointValue(c))}</div></div><span class="badge ${statusClass(c.status)}">${c.status}</span></article>`).join(''):'<div class="empty">Tidak ada customer yang sesuai.</div>';
 document.querySelectorAll('.customer').forEach(el=>el.onclick=()=>openDetail(el.dataset.id));
}
function openDetail(id){
 currentId=id; const c=customers.find(x=>x.member===id); selected=new Set(eligible(c).map(s=>s.id));
 document.getElementById('homeView').classList.add('hidden');document.getElementById('detailView').classList.remove('hidden');renderDetail();
}
function renderDetail(){
 const c=customers.find(x=>x.member===currentId); if(!c)return;
 const opts=eligible(c);
 document.getElementById('detail').innerHTML=`<section class="detail-card">
 <div class="detail-name">👤 ${cleanName(c.name)}</div><div class="detail-phone">${c.phone}</div>
 <div class="stats"><div class="stat"><b>${c.points}</b><span>POIN</span></div><div class="stat"><b>${rupiah(pointValue(c)).replace('Rp','Rp ')}</b><span>NILAI POIN</span></div></div>
 <div class="section-title">PILIHAN LAYANAN</div>
 <div class="services">${opts.map(s=>`<label class="service"><input type="checkbox" data-service="${s.id}" ${selected.has(s.id)?'checked':''}><div><strong>${s.label}</strong><small>${rupiah(s.price)}</small></div></label>`).join('')||'<div class="empty">Belum ada layanan yang memenuhi nilai poin.</div>'}</div>
 <div class="action-row"><button class="btn dark" id="autoBtn">PILIH OTOMATIS</button><button class="btn light" id="clearBtn">HAPUS PILIHAN</button></div>
 <div class="section-title">PESAN WHATSAPP</div><div class="message" id="messageBox">${message(c)}</div>
 <div class="msg-actions"><button class="btn copy" id="copyBtn">SALIN PESAN</button><button class="btn wa" id="waBtn">💬 KIRIM WHATSAPP</button></div>
 <div class="status-row"><button data-status="Belum Blast">Belum Blast</button><button data-status="Pending">Pending</button><button data-status="Sudah Blast">Sudah Blast</button><button data-status="Transaksi">Transaksi</button></div>
 </section>`;
 document.querySelectorAll('[data-service]').forEach(el=>el.onchange=()=>{el.checked?selected.add(el.dataset.service):selected.delete(el.dataset.service);document.getElementById('messageBox').textContent=message(c)});
 document.getElementById('autoBtn').onclick=()=>{selected=new Set(opts.map(s=>s.id));renderDetail()};
 document.getElementById('clearBtn').onclick=()=>{selected.clear();renderDetail()};
 document.getElementById('copyBtn').onclick=async()=>{await navigator.clipboard.writeText(message(c));toast('Pesan berhasil disalin')};
 document.getElementById('waBtn').onclick=()=>{c.status='Sudah Blast';save();window.open('https://wa.me/'+String(c.phone).replace(/[^0-9]/g,'')+'?text='+encodeURIComponent(message(c)),'_blank');renderDetail();};
 document.querySelectorAll('[data-status]').forEach(b=>b.onclick=()=>{c.status=b.dataset.status;save();toast('Status diperbarui');renderDetail();});
}
function closeDetail(){currentId=null;document.getElementById('detailView').classList.add('hidden');document.getElementById('homeView').classList.remove('hidden');renderList()}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>el.classList.remove('show'),1800)}
function addCustomer(){
 const modal=document.createElement('div');modal.className='modal';modal.innerHTML=`<div class="modal-card"><h3>Tambah Customer</h3>
 <div class="field"><label>MEMBER</label><input id="m_member" placeholder="IR..."></div>
 <div class="field"><label>NAMA</label><input id="m_name" placeholder="Nama customer"></div>
 <div class="field"><label>NO HP</label><input id="m_phone" inputmode="numeric" placeholder="628xxxxxxxxxx"></div>
 <div class="field"><label>POIN</label><input id="m_points" inputmode="numeric" placeholder="Jumlah poin"></div>
 <div class="modal-actions"><button class="btn light" id="cancel">Batal</button><button class="btn dark" id="saveCustomer">Simpan</button></div></div>`;
 document.body.appendChild(modal);modal.querySelector('#cancel').onclick=()=>modal.remove();
 modal.querySelector('#saveCustomer').onclick=()=>{const member=modal.querySelector('#m_member').value.trim(),name=modal.querySelector('#m_name').value.trim(),phone=modal.querySelector('#m_phone').value.trim(),points=Number(modal.querySelector('#m_points').value);if(!member||!name||!phone||!points){toast('Lengkapi data customer');return}customers.unshift({member,name,phone,points,status:'Belum Blast'});save();modal.remove();renderList();toast('Customer ditambahkan')};
}
document.getElementById('search').oninput=renderList;
document.getElementById('filters').onclick=e=>{if(e.target.tagName!=='BUTTON')return;activeFilter=e.target.dataset.filter;document.querySelectorAll('#filters button').forEach(b=>b.classList.toggle('active',b===e.target));renderList()};
document.getElementById('backBtn').onclick=closeDetail;
document.getElementById('addBtn').onclick=addCustomer;
document.getElementById('refreshBtn').onclick=()=>{renderList();toast('Data dimuat ulang')};
load();renderList();
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
