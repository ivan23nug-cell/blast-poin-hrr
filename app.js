const SEED_DATA = [
  {member:'IR02656065',name:'RINI WIDIASTUTI',phone:'6282120403560',points:140},
  {member:'IR02642663',name:'ANI HANDAYANI',phone:'6282216368080',points:76},
  {member:'IR02640689',name:'JOHN EDWARD',phone:'6281910647111',points:61},
  {member:'IR02639163',name:'STELLA',phone:'6282120269375',points:74},
  {member:'IR02631520',name:'DADAN HAERI GURATMAN',phone:'6282119166226',points:79},
  {member:'IR02581127',name:'DINAN',phone:'6282110210214',points:139},
  {member:'IR02578964',name:'JEJEN',phone:'6281386266251',points:97},
  {member:'IR02578412',name:'RIKA KARTIKA',phone:'628156433533',points:101},
  {member:'IR02561097',name:'ANITA WIDYA SUYOTO',phone:'6282125668203',points:118},
  {member:'IR02561097',name:'deri',phone:'6285772220807',points:118},
  {member:'IR03330481',name:'MELISSA AGATHAMAIL',phone:'6282218794794',points:130},
  {member:'IR03332201',name:'MARCELLUS KOROMPISMAIL',phone:'6285174077514',points:49},
  {member:'IR01921541',name:'LUTHFI RAHMANMAIL',phone:'6287722501890',points:85},
  {member:'IR01929449',name:'LUTHFI NURAZIZMAIL',phone:'6285624014949',points:75},
  {member:'IR03322385',name:'LISA GUNAWANMAIL',phone:'6285770349038',points:217},
  {member:'IR02148827',name:'LINDA PURBAMAIL',phone:'6282262599388',points:48},
  {member:'IR02213870',name:'KINANTI AMBARINI SETIAWANMAIL',phone:'6287718052019',points:65},
  {member:'IR00810225',name:'KHANIFATUL NURJANAHMAIL',phone:'6285292070079',points:182},
  {member:'IR03313729',name:'KAREL CAHYADIMAIL',phone:'6287824022078',points:36},
  {member:'IR03321923',name:'JULAEKAHMAIL',phone:'6285871614312',points:46}
];

const KEY='blast_poin_hrr_v2';
const stored=localStorage.getItem(KEY);
let data=stored?JSON.parse(stored):SEED_DATA.map(x=>({...x,status:'Belum Blast'}));
let activeFilter='Semua', activeCustomer=null, selected=[];
const $=id=>document.getElementById(id);
const cleanName=n=>String(n||'').replace(/MAIL/g,'').replace(/-WA/g,'').trim();
const pointValue=c=>Number(c.points||0)*2500;
const rupiah=n=>'Rp'+Number(n||0).toLocaleString('id-ID');
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));

function serviceOptions(c){
  const v=pointValue(c);
  const ac=v>=99000 ? (v>=400000?5:v>=320000?4:v>=240000?3:v>=160000?2:1) : 0;
  const arr=[];
  if(ac) arr.push({id:'ac',label:`Pembersihan hingga ${ac} unit AC`,price:ac===1?99000:ac===2?160000:160000+(ac-2)*80000});
  if(v>=140000) arr.push({id:'sofa',label:`Pembersihan sofa kain ${v>=420000?3:v>=280000?2:1} seater`,price:v>=420000?420000:v>=280000?280000:140000});
  if(v>=280000) arr.push({id:'sofabed',label:'Pembersihan sofa bed kain 1 unit',price:280000});
  if(v>=180000) arr.push({id:'m90',label:'Pembersihan kasur ukuran 90/100/120 x 200 cm',price:180000});
  if(v>=220000) arr.push({id:'m160',label:'Pembersihan kasur ukuran 160 x 200 cm',price:220000});
  if(v>=300000) arr.push({id:'m180',label:'Pembersihan kasur ukuran 180/200 x 200 cm',price:300000});
  return arr;
}

function buildMessage(c, opts=serviceOptions(c)){
  const name=cleanName(c.name);
  let lines=opts.map((x,i)=>`${i+1}. ${x.label}`).join('\n');
  return `Selamat siang Kak ${name},\n\nPerkenalkan saya Ivan dari Informa. Mau menawarkan untuk Poin yang Kakak punya bisa di gunakan untuk jasa pembersihan dari Informa. Berikut beberapa pilihan yang bisa digunakan:\n\n${lines}\n\nMau saya bantu jadwalkan, Kak? Layanannya free, cukup tukar poin member 🙏`;
}

function renderList(){
  const q=$('search').value.trim().toLowerCase();
  const list=data.filter(c=>{
    const match=!q||[c.name,c.phone,c.member].some(v=>String(v).toLowerCase().includes(q));
    const fm=activeFilter==='Semua'||(c.status||'Belum Blast')===activeFilter;
    return match&&fm;
  });
  $('countText').textContent=`${list.length} customer`;
  $('customerList').innerHTML=list.map(c=>`<button class="customer" data-id="${esc(c.member+'|'+c.phone)}"><div class="avatar">${cleanName(c.name).slice(0,1).toUpperCase()}</div><div class="cmain"><b>${esc(cleanName(c.name))}</b><span>${esc(c.phone)}</span><span>${c.points} poin</span></div><span class="status ${slug(c.status)}">${esc(c.status||'Belum Blast')}</span></button>`).join('') || '<div class="empty">Tidak ada customer.</div>';
  document.querySelectorAll('.customer').forEach(b=>b.onclick=()=>openDetail(b.dataset.id));
}
function esc(s){return String(s).replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]));}
function slug(s){return String(s).toLowerCase().replace(/\s/g,'-');}
function find(id){return data.find(c=>c.member+'|'+c.phone===id);}

function openDetail(id){
  activeCustomer=find(id); if(!activeCustomer)return;
  selected=serviceOptions(activeCustomer).map(x=>x.id);
  $('homeView').classList.add('hidden'); $('detailView').classList.remove('hidden');
  renderDetail();
}
function renderDetail(){
  const c=activeCustomer, opts=serviceOptions(c);
  $('detail').innerHTML=`<div class="detail-head"><div class="avatar big">${esc(cleanName(c.name).slice(0,1))}</div><div><h2>${esc(cleanName(c.name))}</h2><div>${esc(c.phone)}</div></div></div><div class="stats"><div><strong>${c.points}</strong><small>POIN</small></div><div><strong>${rupiah(pointValue(c))}</strong><small>NILAI POIN</small></div></div><h3>PILIHAN LAYANAN</h3><div class="services">${opts.map(o=>`<label><input type="checkbox" data-service="${o.id}" ${selected.includes(o.id)?'checked':''}><span>${esc(o.label)}</span></label>`).join('')}</div><div class="actions"><button id="autoBtn" class="primary">PILIH OTOMATIS</button><button id="clearBtn" class="secondary">HAPUS PILIHAN</button></div><div class="message-box"><div class="mb-title">💬 PESAN WHATSAPP</div><pre id="message">${esc(buildMessage(c,opts.filter(o=>selected.includes(o.id))))}</pre></div><div class="actions"><button id="copyBtn" class="secondary">SALIN PESAN</button><button id="waBtn" class="wa">💬 KIRIM WHATSAPP</button></div>`;
  document.querySelectorAll('[data-service]').forEach(x=>x.onchange=()=>{selected=[...document.querySelectorAll('[data-service]:checked')].map(e=>e.dataset.service); updateMessage();});
  $('autoBtn').onclick=()=>{selected=opts.map(o=>o.id); renderDetail();};
  $('clearBtn').onclick=()=>{selected=[]; renderDetail();};
  $('copyBtn').onclick=async()=>{await navigator.clipboard.writeText(buildMessage(c,opts.filter(o=>selected.includes(o.id)))); toast('Pesan berhasil disalin');};
  $('waBtn').onclick=()=>{c.status='Sudah Blast'; save(); const text=buildMessage(c,opts.filter(o=>selected.includes(o.id))); window.open(`https://wa.me/${String(c.phone).replace(/[^0-9]/g,'')}?text=${encodeURIComponent(text)}`,'_blank');};
}
function updateMessage(){const opts=serviceOptions(activeCustomer); $('message').textContent=buildMessage(activeCustomer,opts.filter(o=>selected.includes(o.id)));}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),1800);}

$('search').oninput=renderList;
document.querySelectorAll('#filters button').forEach(b=>b.onclick=()=>{activeFilter=b.dataset.filter;document.querySelectorAll('#filters button').forEach(x=>x.classList.toggle('active',x===b));renderList();});
$('backBtn').onclick=()=>{$('detailView').classList.add('hidden');$('homeView').classList.remove('hidden');renderList();};
$('refreshBtn').onclick=()=>{renderList();toast('Data dimuat ulang');};
$('addBtn').onclick=()=>{const name=prompt('Nama customer:');if(!name)return;const phone=prompt('No HP (628...):');if(!phone)return;const points=Number(prompt('Jumlah poin:','100'));if(!points)return;data.push({member:'MANUAL-'+Date.now(),name,phone,points,status:'Belum Blast'});save();renderList();toast('Customer ditambahkan');};
renderList();
