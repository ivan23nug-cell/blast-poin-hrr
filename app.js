import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, collection, getDocs, addDoc, setDoc, updateDoc,
  deleteDoc, writeBatch, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzy2cwo5k47KcWevC9-_Nqejo4-fjoG9Y",
  authDomain: "blast-poin-hrr-253dc.firebaseapp.com",
  projectId: "blast-poin-hrr-253dc",
  storageBucket: "blast-poin-hrr-253dc.firebasestorage.app",
  messagingSenderId: "999695263332",
  appId: "1:999695263332:web:59241d6598e20d979ba171",
  measurementId: "G-XZ3HGP6C1J"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const SERVICES = [
  ["ac1","Pembersihan hingga 1 unit AC",99000],
  ["ac2","Pembersihan hingga 2 unit AC",160000],
  ["ac3","Pembersihan hingga 3 unit AC",240000],
  ["ac4","Pembersihan hingga 4 unit AC",320000],
  ["ac5","Pembersihan hingga 5 unit AC",400000],
  ["sofa1","Pembersihan sofa kain 1 seater",140000],
  ["sofa2","Pembersihan sofa kain 2 seater",280000],
  ["sofa3","Pembersihan sofa kain 3 seater",420000],
  ["bed","Pembersihan sofa bed kain 1 unit",280000],
  ["m120","Pembersihan kasur 90/100/120 × 200 cm",180000],
  ["m160","Pembersihan kasur 160 × 200 cm",220000],
  ["m180","Pembersihan kasur 180/200 × 200 cm",300000]
];

let user=null, profile=null, customers=[], current=null, selected=new Set(), page="home", mode="single";

const $ = id => document.getElementById(id);
const esc = s => String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const cleanName = n => String(n??"").replace(/MAIL$/i,"").replace(/-WA$/i,"").trim();
const rupiah = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n||0);
const phoneClean = p => String(p??"").replace(/\D/g,"");
const autoServices = points => {
  const v=(Number(points)||0)*2500;
  const ids=[];
  if(v>=99000){
    const units=v>=400000?5:v>=320000?4:v>=240000?3:v>=160000?2:1;
    ids.push("ac"+units);
  }
  if(v>=420000) ids.push("sofa3");
  else if(v>=280000) ids.push("sofa2");
  else if(v>=140000) ids.push("sofa1");
  if(v>=280000) ids.push("bed");
  if(v>=180000) ids.push("m120");
  if(v>=220000) ids.push("m160");
  if(v>=300000) ids.push("m180");
  return ids;
};
const selectedText = ids => ids.map(id=>SERVICES.find(x=>x[0]===id)?.[1]).filter(Boolean);

function messageFor(c, ids){
  const sender=profile?.senderName || "Ivan";
  const list=selectedText(ids);
  return `Selamat siang Kak ${cleanName(c.name)},\n\nPerkenalkan saya ${sender} dari Informa. Mau menawarkan untuk Poin yang Kakak punya bisa di gunakan untuk jasa pembersihan dari Informa. Berikut beberapa pilihan yang bisa digunakan:\n\n${list.map((x,i)=>`${i+1}. ${x}`).join("\n")}\n\nMau saya bantu jadwalkan, Kak? Layanannya free, cukup tukar poin member 🙏`;
}
function waUrl(c, msg){ return `https://wa.me/${phoneClean(c.phone)}?text=${encodeURIComponent(msg)}`; }

function shell(content){
  const name=profile?.senderName || profile?.username || user?.email?.split("@")[0] || "";
  return `<div class="top"><div class="row between"><div><h1>Blast Poin HRR</h1><small>${esc(name)}</small></div><button class="btn secondary" id="profileBtn">Profil</button></div></div><main class="wrap">${content}</main>`;
}

function login(){
  $("app").innerHTML=`<div class="login"><div class="loginbox">
    <div class="logo">Blast Poin HRR</div><p class="muted" style="text-align:center">Masuk untuk mengelola customer milik Anda.</p>
    <label>Username</label><input id="username" autocomplete="username" placeholder="Masukkan username">
    <label>NIP</label><input id="nip" type="password" autocomplete="current-password" placeholder="Masukkan NIP">
    <p class="muted" style="font-size:12px;margin-top:6px">Login menggunakan Username + NIP yang terdaftar sebagai password di Firebase.</p>
    <button class="btn primary" style="width:100%;margin-top:15px" id="loginBtn">Masuk</button>
    <div id="loginMsg" class="notice hidden"></div>
  </div></div>`;
  $("loginBtn").onclick=async()=>{
    const u=$("username").value.trim().toLowerCase(), p=$("nip").value;
    if(!u||!p) return showLogin("Username dan NIP wajib diisi.");
    try{
      await signInWithEmailAndPassword(auth,`${u}@blastpoinhrr.app`,p);
    }catch(e){
      console.error("Firebase login error:", e);
      const code=e?.code||"";
      if(code==="auth/invalid-credential" || code==="auth/wrong-password" || code==="auth/user-not-found")
        showLogin("Login gagal. Username benar, tetapi NIP/password Firebase tidak cocok. Periksa kembali NIP yang dimasukkan.");
      else if(code==="auth/user-disabled") showLogin("Akun ini sedang dinonaktifkan di Firebase.");
      else if(code==="auth/too-many-requests") showLogin("Terlalu banyak percobaan login. Tunggu beberapa saat lalu coba lagi.");
      else showLogin("Login gagal: "+(e?.message||"terjadi kesalahan Firebase."));
    }
  };
}
function showLogin(t){$("loginMsg").textContent=t;$("loginMsg").classList.remove("hidden")}

async function loadProfile(){
  const s=await getDoc(doc(db,"users",user.uid));
  profile=s.exists()?s.data():{username:user.email?.split("@")[0],senderName:"Ivan"};
}
async function loadCustomers(){
  const snap=await getDocs(collection(db,"users",user.uid,"customers"));
  customers=snap.docs.map(d=>({id:d.id,...d.data()}));
  customers.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
}
function bindTop(){
  $("profileBtn")?.addEventListener("click",profilePage);
}
function home(){
  $("app").innerHTML=shell(`<div class="grid">
    <button class="card menu" id="data"><div class="ico">👥</div><span>Datacustomer</span></button>
    <button class="card menu" id="add"><div class="ico">➕</div><span>+ Customer</span></button>
    <button class="card menu" id="blast"><div class="ico">💬</div><span>Blast Poin</span></button>
    <button class="card menu" id="follow"><div class="ico">🔁</div><span>Follow Up</span></button>
    <button class="card menu" id="retensi"><div class="ico">⭐</div><span>Blast Retensi</span></button>
  </div>
  <div class="card"><b>Data Anda terpisah dari pengguna lain.</b><p class="muted">Customer tersimpan di akun Firebase masing-masing.</p></div>`);
  bindTop(); $("data").onclick=()=>{page="data";dataPage()}; $("add").onclick=addMenu;
  $("blast").onclick=()=>{page="blast";blastPage()}; $("follow").onclick=followPage;
  $("retensi").onclick=retensiPage;
}
function back(){home()}
function dataPage(){
  const q=(window._q||"").toLowerCase();
  const list=customers.filter(c=>[c.name,c.member,c.phone].some(x=>String(x??"").toLowerCase().includes(q)));
  $("app").innerHTML=shell(`<div class="row between"><div class="title">Datacustomer</div><button class="btn ghost" id="back">Kembali</button></div>
  <input id="search" placeholder="Cari nama, member, nomor..." value="${esc(window._q||"")}">
  <div class="row wraprow" style="margin:10px 0"><span class="badge">Total ${customers.length}</span><button class="btn secondary" id="addOne">+ Customer</button><button class="btn secondary" id="import">Add Data Excel</button></div>
  <div>${list.map(c=>`<div class="customer"><div class="row between"><div><h3>${esc(cleanName(c.name))}</h3><p class="muted">${esc(c.member||"")} · ${esc(c.phone||"")}</p></div><span class="badge">${esc(c.points||0)} poin</span></div><button class="btn ghost" data-edit="${c.id}" style="margin-top:8px;width:100%">Detail / Edit</button></div>`).join("")||`<div class="card muted">Belum ada customer.</div>`}</div>`);
  bindTop();$("back").onclick=back;$("search").oninput=e=>{window._q=e.target.value;dataPage()};$("addOne").onclick=()=>addForm();$("import").onclick=importPage;
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editForm(customers.find(x=>x.id===b.dataset.edit)));
}
function addMenu(){ $("app").innerHTML=shell(`<div class="title">+ Customer</div><div class="card"><button class="btn primary" style="width:100%;margin-bottom:10px" id="a">Add Data</button><button class="btn secondary" style="width:100%" id="i">Add Data Excel</button></div><button class="btn ghost" id="back">Kembali</button>`);bindTop();$("back").onclick=back;$("a").onclick=()=>addForm();$("i").onclick=importPage; }
function addForm(c=null){
  const edit=!!c;
  $("app").innerHTML=shell(`<div class="row between"><div class="title">${edit?"Edit Customer":"Add Data"}</div><button class="btn ghost" id="back">Kembali</button></div>
  <div class="card">
  <label>Member</label><input id="member" value="${esc(c?.member||"")}">
  <label>Nama</label><input id="name" value="${esc(c?.name||"")}">
  <label>No HP</label><input id="phone" inputmode="tel" value="${esc(c?.phone||"")}">
  <label>Poin</label><input id="points" type="number" value="${esc(c?.points??"")}">
  <button class="btn primary" style="width:100%;margin-top:14px" id="save">${edit?"Simpan Perubahan":"Simpan Customer"}</button>
  ${edit?`<button class="btn danger" style="width:100%;margin-top:8px" id="del">Hapus Customer</button>`:""}
  </div>`);
  bindTop();$("back").onclick=()=>dataPage();
  $("save").onclick=async()=>{const obj={member:$("member").value.trim(),name:$("name").value.trim(),phone:phoneClean($("phone").value),points:Number($("points").value)||0,status:c?.status||"Belum Blast",blastCount:c?.blastCount||0,followUpDone:c?.followUpDone||false,updatedAt:serverTimestamp()}; if(!obj.name||!obj.phone)return alert("Nama dan nomor HP wajib diisi."); if(edit) await updateDoc(doc(db,"users",user.uid,"customers",c.id),obj); else await addDoc(collection(db,"users",user.uid,"customers"),{...obj,createdAt:serverTimestamp()}); await loadCustomers();dataPage();};
  if(edit)$("del").onclick=async()=>{if(confirm("Hapus customer ini?")){await deleteDoc(doc(db,"users",user.uid,"customers",c.id));await loadCustomers();dataPage();}};
}
function importPage(){
  $("app").innerHTML=shell(`<div class="row between"><div class="title">Add Data Excel</div><button class="btn ghost" id="back">Kembali</button></div>
  <div class="card"><p class="muted">Upload file .xlsx/.xls. Aplikasi membaca sheet <b>MASTER DATABASE</b> dan mengambil kolom MEMBER, NAMA, NO HP, POIN.</p><input id="file" type="file" accept=".xlsx,.xls"><button class="btn primary" style="width:100%;margin-top:12px" id="go">Import ke Firebase</button><div id="result" class="notice hidden"></div></div>`);
  bindTop();$("back").onclick=()=>dataPage();
  $("go").onclick=async()=>{const f=$("file").files[0];if(!f)return alert("Pilih file Excel dulu.");const buf=await f.arrayBuffer();const wb=XLSX.read(buf,{type:"array"});const ws=wb.Sheets["MASTER DATABASE"]||wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:""});let n=0,batch=writeBatch(db),count=0;
    for(const r of rows){const member=r.MEMBER??r.Member??r.member,name=r.NAMA??r.Nama??r.name,phone=phoneClean(r["NO HP"]??r["NOHP"]??r.phone),points=Number(r.POIN??r.Points??r.points)||0;if(!name&&!phone)continue;const ref=doc(collection(db,"users",user.uid,"customers"));batch.set(ref,{member:String(member||""),name:String(name||""),phone,points,status:"Belum Blast",blastCount:0,followUpDone:false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});n++;count++;if(count===450){await batch.commit();batch=writeBatch(db);count=0;}}
    if(count)await batch.commit();await loadCustomers();$("result").textContent=`Berhasil mengimpor ${n} customer.`;$("result").classList.remove("hidden");};
}
function blastPage(){
  const q=(window._bq||"").toLowerCase();const list=customers.filter(c=>[c.name,c.member,c.phone].some(x=>String(x??"").toLowerCase().includes(q)));
  const belum=customers.filter(c=>!c.blastCount).length,sudah=customers.filter(c=>c.blastCount).length;
  $("app").innerHTML=shell(`<div class="row between"><div class="title">Blast Poin</div><button class="btn ghost" id="back">Kembali</button></div>
  <div class="grid"><div class="stat"><b>${customers.length}</b><span>Total Customer</span></div><div class="stat"><b>${belum}</b><span>Belum Blast</span></div><div class="stat"><b>${sudah}</b><span>Sudah Blast</span></div><div class="stat"><b>${customers.filter(c=>c.status==="Pending").length}</b><span>Pending</span></div></div>
  <div class="row" style="margin:12px 0"><input id="searchB" placeholder="Cari customer..." value="${esc(window._bq||"")}"><button class="btn secondary" id="multi">Kirim Beberapa</button></div>
  <div id="blastList">${list.map(c=>`<div class="customer"><div class="row between"><div><h3>${esc(cleanName(c.name))}</h3><p class="muted">${esc(c.phone)} · ${c.points||0} poin · ${rupiah((c.points||0)*2500)}</p></div><span class="badge ${c.blastCount?'':'red'}">${c.blastCount?'Sudah Blast':'Belum Blast'}</span></div><button class="btn primary" data-b="${c.id}" style="width:100%;margin-top:8px">${c.blastCount?'Buka Blast':'Blast Poin'}</button></div>`).join("")}</div>`);
  bindTop();$("back").onclick=back;$("searchB").oninput=e=>{window._bq=e.target.value;blastPage()};$("multi").onclick=()=>multiBlast(list);
  document.querySelectorAll("[data-b]").forEach(b=>b.onclick=()=>blastDetail(customers.find(x=>x.id===b.dataset.b)));
}
function blastDetail(c){
  current=c;selected=new Set(autoServices(c.points));mode="single";
  renderBlastDetail();
}
function renderBlastDetail(){
  const c=current;
  $("app").innerHTML=shell(`<div class="row between"><div class="title">Blast Poin</div><button class="btn ghost" id="back">Kembali</button></div>
  <div class="card"><h3 style="margin-top:0">${esc(cleanName(c.name))}</h3><p class="muted">${esc(c.member||"")} · ${esc(c.phone)}</p><p><b>${c.points||0} poin</b> · ${rupiah((c.points||0)*2500)}</p></div>
  <div class="row wraprow"><button class="btn secondary" id="auto">Pilih Otomatis</button><button class="btn ghost" id="clear">Hapus Pilihan</button></div>
  <div class="card"><b>Pilih layanan</b>${SERVICES.map(s=>`<label class="service"><input type="checkbox" data-s="${s[0]}" ${selected.has(s[0])?"checked":""}><span>${esc(s[1])}<br><small class="muted">${rupiah(s[2])}</small></span></label>`).join("")}</div>
  <div class="card"><b>Preview Pesan</b><textarea id="msg">${esc(messageFor(c,[...selected]))}</textarea><div class="row" style="margin-top:8px"><button class="btn secondary" id="copy">Copy Message</button><a class="wa" style="flex:1" id="wa" href="${waUrl(c,messageFor(c,[...selected]))}" target="_blank" rel="noopener">Buka WhatsApp</a></div></div>`);
  bindTop();$("back").onclick=blastPage;$("auto").onclick=()=>{selected=new Set(autoServices(c.points));renderBlastDetail()};$("clear").onclick=()=>{selected.clear();renderBlastDetail()};
  document.querySelectorAll("[data-s]").forEach(x=>x.onchange=()=>{if(x.checked)selected.add(x.dataset.s);else selected.delete(x.dataset.s);refreshMsg()});
  $("copy").onclick=()=>navigator.clipboard.writeText($("msg").value).then(()=>alert("Pesan disalin."));
  $("wa").onclick=()=>setTimeout(async()=>{if(confirm("Sudah mengirim pesan di WhatsApp?")){await updateDoc(doc(db,"users",user.uid,"customers",c.id),{status:"Sudah Blast",blastCount:(c.blastCount||0)+1,lastBlastAt:serverTimestamp(),followUpDone:false});await loadCustomers();}},800);
}
function refreshMsg(){const m=messageFor(current,[...selected]);$("msg").value=m;$("wa").href=waUrl(current,m)}
async function multiBlast(list){
  const chosen=list.filter(c=>!c.blastCount);
  if(!chosen.length)return alert("Tidak ada customer yang belum blast.");
  let i=0;
  const next=async()=>{if(i>=chosen.length){await loadCustomers();return blastPage();}
    current=chosen[i];selected=new Set(autoServices(current.points));mode="multi";renderMulti();
  };
  const renderMulti=()=>{$("app").innerHTML=shell(`<div class="row between"><div class="title">Kirim Beberapa</div><button class="btn ghost" id="cancel">Batal</button></div><div class="card"><b>${i+1} / ${chosen.length}</b><p>${esc(cleanName(current.name))}</p><textarea id="msg">${esc(messageFor(current,[...selected]))}</textarea><a class="wa" id="wa" href="${waUrl(current,messageFor(current,[...selected]))}" target="_blank">Buka WhatsApp</a><button class="btn primary" id="sent" style="width:100%;margin-top:8px">Terkirim — Lanjut</button></div>`);bindTop();$("cancel").onclick=blastPage;$("sent").onclick=async()=>{await updateDoc(doc(db,"users",user.uid,"customers",current.id),{status:"Sudah Blast",blastCount:(current.blastCount||0)+1,lastBlastAt:serverTimestamp(),followUpDone:false});i++;next()};};
  next();
}
function followPage(){
  const list=customers.filter(c=>c.blastCount && !c.followUpDone);
  $("app").innerHTML=shell(`<div class="row between"><div class="title">Follow Up</div><button class="btn ghost" id="back">Kembali</button></div><div class="grid"><div class="stat"><b>${list.length}</b><span>Perlu Follow Up</span></div><div class="stat"><b>${customers.filter(c=>c.followUpDone).length}</b><span>Selesai</span></div></div><div class="card"><p class="muted">Follow Up saat ini bersifat manual: buka WhatsApp, kirim pesan, lalu tandai selesai.</p></div>${list.map(c=>`<div class="customer"><h3>${esc(cleanName(c.name))}</h3><p class="muted">${esc(c.phone)}</p><button class="btn primary" style="width:100%" data-f="${c.id}">Follow Up</button></div>`).join("")||`<div class="card">Belum ada customer yang perlu di-follow up.</div>`}`);
  bindTop();$("back").onclick=back;document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>followDetail(customers.find(x=>x.id===b.dataset.f)));
}
function followDetail(c){
  const sender=profile?.senderName||"Ivan";
  const msg=`Selamat siang Kak ${cleanName(c.name)},\n\nSaya ${sender} dari Informa.\n\nIzin mengingatkan kembali terkait penawaran jasa pembersihan dari Informa yang sebelumnya saya sampaikan.\n\nJika Kakak masih berminat menggunakan layanannya, saya siap bantu proses dan jadwalkan ya Kak 🙏`;
  $("app").innerHTML=shell(`<div class="row between"><div class="title">Follow Up</div><button class="btn ghost" id="back">Kembali</button></div><div class="card"><h3>${esc(cleanName(c.name))}</h3><p class="muted">${esc(c.phone)}</p><textarea id="msg">${esc(msg)}</textarea><a class="wa" href="${waUrl(c,msg)}" target="_blank">Buka WhatsApp</a><button class="btn primary" id="done" style="width:100%;margin-top:8px">Tandai Selesai</button></div>`);
  bindTop();$("back").onclick=followPage;$("done").onclick=async()=>{await updateDoc(doc(db,"users",user.uid,"customers",c.id),{followUpDone:true,lastFollowUpAt:serverTimestamp()});await loadCustomers();followPage()};
}
function retensiPage(){
  $("app").innerHTML=shell(`<div class="row between"><div class="title">Blast Retensi</div><button class="btn ghost" id="back">Kembali</button></div><div class="card"><button class="btn primary" style="width:100%;margin-bottom:10px" id="own">⭐ Customer Retensi<br><small>(Transaksi dengan Saya)</small></button><button class="btn secondary" style="width:100%" id="other">👥 Customer Retensi<br><small>(Transaksi Bukan Saya)</small></button></div><div class="notice">Database retensi dipisahkan. Sumber transaksi belum diubah otomatis dari database poin.</div>`);
  bindTop();$("back").onclick=back;$("own").onclick=()=>retensiList("own");$("other").onclick=()=>retensiList("other");
}
function retensiList(type){
  $("app").innerHTML=shell(`<div class="row between"><div class="title">${type==="own"?"Transaksi dengan Saya":"Transaksi Bukan Saya"}</div><button class="btn ghost" id="back">Kembali</button></div><div class="card"><p class="muted">Database transaksi retensi ini sudah disiapkan terpisah. Tambahkan/import data transaksi pada tahap berikutnya.</p><button class="btn secondary" id="add" style="width:100%">+ Tambah Transaksi</button></div>`);
  bindTop();$("back").onclick=retensiPage;$("add").onclick=()=>alert("Struktur database retensi sudah dipisahkan. Tahap berikutnya kita tentukan sumber data transaksi dan format importnya.");
}
function profilePage(){
  $("app").innerHTML=shell(`<div class="row between"><div class="title">Profil Saya</div><button class="btn ghost" id="back">Kembali</button></div><div class="card"><label>Username</label><input value="${esc(profile?.username||"")}" disabled><label>Nama Pengirim</label><input id="sender" value="${esc(profile?.senderName||"Ivan")}"><p class="muted">Nama ini dipakai otomatis di pesan Blast Poin dan Follow Up.</p><button class="btn primary" id="save" style="width:100%">Simpan</button></div>`);
  bindTop();$("back").onclick=home;$("save").onclick=async()=>{await updateDoc(doc(db,"users",user.uid),{senderName:$("sender").value.trim()||"Ivan"});await loadProfile();alert("Profil disimpan.");home()};
}

onAuthStateChanged(auth,async u=>{user=u;if(!u){login();return;}try{await loadProfile();await loadCustomers();home()}catch(e){console.error(e);$("app").innerHTML=`<div class="login"><div class="loginbox"><b>Gagal memuat data Firebase.</b><p class="muted">${esc(e.message)}</p><button class="btn primary" onclick="location.reload()">Coba Lagi</button></div></div>`}});
