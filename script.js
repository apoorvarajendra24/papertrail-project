/* ============================================
   script.js — Extended final with extras
   - progress rings, profile, export/import, goals
   - local summary generator
   ============================================ */

const APP_VERSION = "rj_v3";
const STORAGE_KEY = `reading_journal_${APP_VERSION}`;
const PROFILE_KEY = "rj_profile_v1";

/* ---------- default books (10) ---------- */
const DEFAULT_BOOKS = [
  { id:"b1", title:"The Alchemist", author:"Paulo Coelho", cover:"https://upload.wikimedia.org/wikipedia/en/c/c4/Coelho-TheAlchemist.jpg", pages:208, progress:100, status:"read", dateFinished:"2025-11-01", mood:["inspirational"], short:"A life-changing fable about following your dreams.", understood:"Your personal legend is unique.", lessons:["Trust yourself"], quotes:[{text:"And, when you want something, all the universe conspires in helping you to achieve it.", loc:45}] },
  { id:"b2", title:"To Kill a Mockingbird", author:"Harper Lee", cover:"https://upload.wikimedia.org/wikipedia/en/7/79/To_Kill_a_Mockingbird.JPG", pages:281, progress:100, status:"read", dateFinished:"2025-09-15", mood:["serious"], short:"A classic about justice.", understood:"Empathy challenges prejudice.", lessons:["Stand up for justice"], quotes:[{text:"You never really understand a person until you consider things from his point of view …", loc:102}] },
  { id:"b3", title:"The Girl with the Dragon Tattoo", author:"Stieg Larsson", cover:"https://upload.wikimedia.org/wikipedia/en/5/5b/The_Girl_with_the_Dragon_Tattoo_%28English_version%29.jpg", pages:465, progress:100, status:"read", dateFinished:"2025-10-20", mood:["thriller"], short:"Dark thriller.", understood:"Truth can be messy.", lessons:[], quotes:[{text:"What she had done was just a drop in the ocean — but that didn’t make the ocean any less important.", loc:248}] },
  { id:"b4", title:"The Silent Patient", author:"Alex Michaelides", cover:"https://upload.wikimedia.org/wikipedia/en/5/53/The_Silent_Patient.jpg", pages:325, progress:100, status:"read", dateFinished:"2025-11-05", mood:["psychological"], short:"A psychological thriller.", understood:"Silence hides pain.", lessons:[], quotes:[{text:"They say a picture is worth a thousand words—but some secrets remain unsaid, even in silence.", loc:198}] },
  { id:"b5", title:"The Shining", author:"Stephen King", cover:"https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1353277730i/11588.jpg", pages:447, progress:100, status:"read", dateFinished:"2025-06-30", mood:["horror"], short:"Isolation & madness.", understood:"Fear amplifies shadow.", lessons:[], quotes:[{text:"Monsters are real. Ghosts are real too. They live inside us.", loc:329}] },
  { id:"b6", title:"The Hobbit", author:"J.R.R. Tolkien", cover:"https://upload.wikimedia.org/wikipedia/en/4/4a/TheHobbit_FirstEdition.jpg", pages:310, progress:0, status:"want", mood:["fantasy"], short:"A classic fantasy adventure.", understood:"", lessons:[], quotes:[] },
  { id:"b7", title:"The Da Vinci Code", author:"Dan Brown", cover:"https://upload.wikimedia.org/wikipedia/en/6/6b/DaVinciCode.jpg", pages:480, progress:20, status:"reading", mood:["suspense"], short:"A fast-paced conspiracy thriller.", understood:"", lessons:[], quotes:[] },
  { id:"b8", title:"The Road", author:"Cormac McCarthy", cover:"https://upload.wikimedia.org/wikipedia/en/5/5a/The_Road_%28McCarthy_novel%29.jpg", pages:287, progress:0, status:"want", mood:["somber"], short:"A bleak tale of survival.", understood:"", lessons:[], quotes:[] },
  { id:"b9", title:"The Kite Runner", author:"Khaled Hosseini", cover:"https://upload.wikimedia.org/wikipedia/en/8/84/The_Kite_Runner.jpg", pages:372, progress:100, status:"read", dateFinished:"2025-04-18", mood:["emotional"], short:"Friendship and guilt.", understood:"Guilt needs honesty.", lessons:[], quotes:[{text:"For you, a thousand times over.", loc:309}] },
  { id:"b10", title:"The Martian", author:"Andy Weir", cover:"https://upload.wikimedia.org/wikipedia/en/c/c3/The_Martian_2014_Novel.jpg", pages:369, progress:0, status:"want", mood:["sci-fi"], short:"Witty survival on Mars.", understood:"", lessons:[], quotes:[] }
];

/* ---------- storage ---------- */
function loadBooks() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
    return [...DEFAULT_BOOKS];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
      return [...DEFAULT_BOOKS];
    }
    return parsed;
  } catch (e) {
    console.warn("Bad storage, resetting to defaults", e);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BOOKS));
    return [...DEFAULT_BOOKS];
  }
}
function saveBooks(arr){ localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)); }

let books = loadBooks();

/* ---------- profile ---------- */
function loadProfile(){
  try{
    const raw = localStorage.getItem(PROFILE_KEY);
    if(!raw) return { name: "You", avatar: "https://i.imgur.com/O7pZ4Gq.jpeg" };
    return JSON.parse(raw);
  }catch(e){
    return { name: "You", avatar: "https://i.imgur.com/O7pZ4Gq.jpeg" };
  }
}
function saveProfile(p){ localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }
let profile = loadProfile();

/* ---------- DOM helpers ---------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* ---------- renderers ---------- */
function renderStats(){
  const stats = $("#stats");
  const total = books.length;
  const pages = books.reduce((a,b)=>a+(Number(b.pages)||0),0);
  const vibes = new Set(books.flatMap(b=>b.mood||[])).size;
  stats.innerHTML = `
    <div class="stat-box">Books: <strong>${total}</strong></div>
    <div class="stat-box">Pages: <strong>${pages}</strong></div>
    <div class="stat-box">Vibes: <strong>${vibes}</strong></div>
  `;
  $("#totalBooks").textContent = `${total} books`;
  $("#pagesRead").textContent = `• ${pages} pages`;
  $("#moodsSeen").textContent = `• ${vibes} vibes`;
}

function renderShelf(list = books){
  const shelf = $("#shelf");
  shelf.innerHTML = "";
  (list || []).forEach(b => {
    const card = document.createElement("div");
    card.className = "book-card fade";
    card.innerHTML = `
      <img src="${b.cover}" class="cover" data-id="${b.id}" alt="${escape(b.title)}">
      <div class="title">${escape(b.title)}</div>
      <div class="progress-wrap"><svg class="ring" viewBox="0 0 36 36"></svg></div>
    `;
    shelf.appendChild(card);
    renderRing(card.querySelector(".ring"), Number(b.progress) || 0);
  });

  // bind clicks
  $$(".cover").forEach(img => img.onclick = () => openModal(img.dataset.id));
}

function renderPosts(list = books){
  const posts = $("#posts");
  posts.innerHTML = "";
  const order = {reading:0, read:1, want:2};
  (list||[]).slice().sort((a,b)=> (order[a.status]||3)-(order[b.status]||3)).forEach(b=>{
    const div = document.createElement("div");
    div.className = "post-card fade";
    div.innerHTML = `
      <img src="${b.cover}" style="width:100%;max-width:180px;border-radius:12px;object-fit:cover">
      <div class="title">${escape(b.title)}</div>
      <div class="meta-row">${escape(b.author||"")} • ${b.pages || ""} pages • ${b.status}</div>
      <div style="color:var(--muted);margin-top:8px">${escape(b.short||"")}</div>
    `;
    div.onclick = () => openModal(b.id);
    posts.appendChild(div);
  });
}

function renderTimeline(list = books){
  const timeline = $("#timeline");
  timeline.innerHTML = "";
  const items = (list||[]).filter(b=>b.status==="read" && b.dateFinished).sort((a,b)=> new Date(b.dateFinished)-new Date(a.dateFinished));
  if(items.length===0){ timeline.innerHTML = `<div style="color:var(--muted)">No finished books yet.</div>`; return; }
  items.forEach(b=>{
    const it = document.createElement("div");
    it.className = "timeline-item fade";
    it.innerHTML = `<div class="dot"></div><div><div style="font-weight:600">${escape(b.title)}</div><div style="color:var(--muted);font-size:13px">${b.dateFinished}</div></div>`;
    it.onclick = () => openModal(b.id);
    timeline.appendChild(it);
  });
}

function renderGoals(){
  const monthlyInput = $("#goalMonthly");
  const yearlyInput = $("#goalYearly");
  const monthly = Number(localStorage.getItem("rj_goal_monthly") || 0);
  const yearly = Number(localStorage.getItem("rj_goal_yearly") || 0);
  monthlyInput.value = monthly || "";
  yearlyInput.value = yearly || "";
  updateGoalProgress();
}

function updateGoalProgress(){
  const monthly = Number($("#goalMonthly").value) || 0;
  const yearly = Number($("#goalYearly").value) || 0;
  localStorage.setItem("rj_goal_monthly", monthly);
  localStorage.setItem("rj_goal_yearly", yearly);

  // simple calc: books finished this month/year
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const finishedThisMonth = books.filter(b => b.status==="read" && b.dateFinished && b.dateFinished.startsWith(monthStr)).length;
  const finishedThisYear = books.filter(b => b.status==="read" && b.dateFinished && b.dateFinished.startsWith(String(now.getFullYear()))).length;

  $("#goalMonthlyProgress").textContent = monthly ? `${Math.round((finishedThisMonth/monthly)*100)}% (${finishedThisMonth}/${monthly})` : "—";
  $("#goalYearlyProgress").textContent = yearly ? `${Math.round((finishedThisYear/yearly)*100)}% (${finishedThisYear}/${yearly})` : "—";
}

/* ---------- rings ---------- */
function renderRing(svgEl, pct){
  // draws circular progress in svg 36x36 viewBox
  const clamped = Math.max(0, Math.min(100, Number(pct)||0));
  svgEl.innerHTML = `
    <circle r="16" cx="18" cy="18" fill="transparent" stroke="rgba(0,0,0,0.06)" stroke-width="4"></circle>
    <circle r="16" cx="18" cy="18" fill="transparent" stroke="${getComputedStyle(document.documentElement).getPropertyValue('--accent')}" stroke-width="4" stroke-dasharray="${(clamped/100)*100} 100" stroke-linecap="round" transform="rotate(-90 18 18)"></circle>
    <text x="18" y="20" text-anchor="middle" font-size="6" fill="${getComputedStyle(document.documentElement).getPropertyValue('--text')||'#000'}">${clamped}%</text>
  `;
}

/* ---------- modal ---------- */
function openModal(id){
  const b = books.find(x=>x.id===id);
  if(!b) return;
  const modal = $("#bookModal");
  const body = $("#modalBody");
  // summary generator button
  body.innerHTML = `
    <div class="book-detail">
      <img class="book-cover" src="${b.cover}" alt="${escape(b.title)}">
      <div>
        <h2 class="book-title">${escape(b.title)}</h2>
        <div style="color:var(--muted)">${escape(b.author||"")} • ${b.pages||"—"} pages</div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
          ${(b.mood||[]).map(m=>`<span class="mood">${escape(m)}</span>`).join("")}
          <span class="mood">${escape(b.status)}</span>
        </div>

        <h4 style="margin-top:14px">Short take</h4>
        <div>${escape(b.short||"<i>No summary</i>")}</div>

        <h4 style="margin-top:12px">What I understood</h4>
        <div>${escape(b.understood||"<i>No notes</i>")}</div>

        <h4 style="margin-top:12px">Lessons</h4>
        <ul>${(b.lessons||[]).length ? b.lessons.map(l=>`<li>${escape(l)}</li>`).join("") : "<li><i>No lessons</i></li>"}</ul>

        <h4 style="margin-top:12px">Quotes</h4>
        <div>${(b.quotes||[]).length ? b.quotes.map(q=>`<div class="quote">${escape(q.text)}<div style="color:var(--muted);font-size:12px;margin-top:6px">loc: ${escape(q.loc||"n/a")}</div></div>`).join("") : "<div><i>No quotes</i></div>"}</div>

        <div style="display:flex;gap:8px;margin-top:12px">
          <button id="genSummary" class="pill">Generate summary</button>
          <button id="downloadQuotePNG" class="pill">Download quote image</button>
          <button id="tweetBook" class="pill secondary">Tweet</button>
        </div>

        <div id="generatedSummary" style="margin-top:12px"></div>
      </div>
    </div>
  `;

  modal.setAttribute("aria-hidden","false");

  $("#closeModal").onclick = closeModal;
  modal.onclick = (e)=>{ if(e.target===modal) closeModal(); };

  $("#genSummary").onclick = () => {
    const s = generateSummary(b);
    $("#generatedSummary").innerHTML = `<h4>Auto summary</h4><div style="color:var(--muted)">${escape(s)}</div>`;
  };

  $("#downloadQuotePNG").onclick = () => {
    if(!(b.quotes && b.quotes.length)) return alert("No quotes to export");
    downloadQuoteCard(b.quotes[0].text, b.title);
  };

  $("#tweetBook").onclick = () => {
    const text = encodeURIComponent(`${b.title} — ${b.author || ""}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };
}

function closeModal(){ $("#bookModal").setAttribute("aria-hidden","true"); }

/* ---------- summary generator (local heuristic) ---------- */
function generateSummary(book){
  // pick available content: short -> understood -> quotes
  const parts = [];
  if(book.short) parts.push(book.short);
  if(book.understood) parts.push(book.understood);
  if(book.quotes && book.quotes.length){
    parts.push(book.quotes.slice(0,2).map(q=>`"${q.text}"`).join(" — "));
  }
  let text = parts.join(" ");
  // short heuristic: if too long, take first 2 sentences
  const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
  if(sentences.length > 2) return sentences.slice(0,2).join(" ").trim();
  return text.trim();
}

/* ---------- quote card (canvas) ---------- */
function downloadQuoteCard(text, title){
  const w=1200,h=630;
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d");
  const isCyber = document.documentElement.getAttribute("data-theme")==="cyber";
  if(isCyber){ const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#1b0738"); g.addColorStop(1,"#002238"); ctx.fillStyle=g; } else { const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#ffd6e0"); g.addColorStop(1,"#c8f7f1"); ctx.fillStyle=g; }
  ctx.fillRect(0,0,w,h);
  const pad=80;
  ctx.fillStyle = isCyber ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.94)";
  roundRect(ctx,pad,pad,w-2*pad,h-2*pad,28); ctx.fill();
  ctx.fillStyle = isCyber ? "#cfeeff" : "#07121a";
  ctx.font = "bold 44px Poppins, sans-serif";
  wrapText(ctx, `"${text}"`, pad+40, pad+120, w-2*(pad+40), 54);
  ctx.font = "26px Poppins, sans-serif";
  ctx.fillStyle = isCyber ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)";
  ctx.fillText(`— ${title}`, pad+40, h-pad-40);
  const url = c.toDataURL("image/png");
  const a = document.createElement("a"); a.href=url; a.download=`${slugify(title)}-quote.png`; document.body.appendChild(a); a.click(); a.remove();
}

/* ---------- helpers ---------- */
function escape(s){ if(!s) return ""; return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); }
function wrapText(ctx,text,x,y,maxWidth,lineHeight){ const words=text.split(" "); let line=""; for(let n=0;n<words.length;n++){ const test=line+words[n]+" "; const m=ctx.measureText(test); if(m.width>maxWidth && n>0){ ctx.fillText(line,x,y); line=words[n]+" "; y+=lineHeight; } else { line=test; } } ctx.fillText(line,x,y); }
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

/* ---------- search/filter ---------- */
function applyFilters(){
  const q = ($("#searchInput").value || "").trim().toLowerCase();
  const status = $("#statusFilter").value;
  let list = books.slice();
  if(status) list = list.filter(b=>b.status===status);
  if(q) list = list.filter(b => (b.title+" "+(b.author||"")+" "+(b.mood||[]).join(" ")).toLowerCase().includes(q));
  renderShelf(list); renderPosts(list); renderTimeline(list);
}

/* ---------- admin ---------- */
function openAdmin(){ const m=$("#adminModal"); m.style.display="flex"; m.setAttribute("aria-hidden","false"); }
function closeAdmin(){ const m=$("#adminModal"); m.style.display="none"; m.setAttribute("aria-hidden","true"); }
function setupAdmin(){
  $("#addBookBtn").onclick = openAdmin;
  $("#fabAdd").onclick = openAdmin;
  $$(".admin-close").forEach(btn => btn.onclick = closeAdmin);
  $("#adminModal").onclick = (e)=>{ if(e.target=== $("#adminModal")) closeAdmin(); };

  $("#adm_save").onclick = ()=>{
    const title = $("#adm_title").value.trim();
    const cover = $("#adm_cover").value.trim();
    if(!title || !cover) return alert("Title and cover URL required");
    const newB = {
      id: "b"+Date.now(),
      title, author: $("#adm_author").value.trim(),
      cover, pages: Number($("#adm_pages").value) || 0,
      progress: Number($("#adm_progress").value) || 0,
      status: $("#adm_status").value, dateFinished: $("#adm_date").value || null,
      mood: ($("#adm_mood").value||"").split(",").map(s=>s.trim()).filter(Boolean),
      short: $("#adm_short").value.trim(), understood: $("#adm_understood").value.trim(),
      lessons: ($("#adm_lessons").value||"").split("\n").map(s=>s.trim()).filter(Boolean),
      quotes: ($("#adm_quotes").value||"").split("\n").map(s=>({text:s.trim(), loc:""})).filter(q=>q.text),
      score: {vibe:0, insight:0, enjoyment:0}
    };
    books.unshift(newB);
    saveBooks(books);
    renderStats(); applyFilters();
    closeAdmin(); clearAdminForm();
  };
}

function clearAdminForm(){
  ["#adm_title","#adm_author","#adm_cover","#adm_pages","#adm_progress","#adm_date","#adm_mood","#adm_short","#adm_understood","#adm_lessons","#adm_quotes"].forEach(id=>{
    const el=$(id); if(el) el.value="";
  });
}

/* ---------- profile UI ---------- */
function setupProfile(){
  $("#profileBtn").onclick = openProfile;
  $("#fabAdd").title = "Add book";
  $$(".profile-close").forEach(btn=>btn.onclick = closeProfile);
  $("#profileModal").onclick = (e)=>{ if(e.target=== $("#profileModal")) closeProfile(); };
  $("#saveProfile").onclick = ()=> {
    const name = $("#profileNameInput").value.trim() || "You";
    const avatar = $("#profileAvatarInput").value.trim() || "https://i.imgur.com/O7pZ4Gq.jpeg";
    profile = { name, avatar };
    saveProfile(profile);
    $("#profileName").textContent = name;
    $("#profileAvatar").src = avatar;
    closeProfile();
  };
  $("#clearProfile").onclick = ()=> {
    profile = { name: "You", avatar: "https://i.imgur.com/O7pZ4Gq.jpeg" };
    saveProfile(profile);
    $("#profileName").textContent = profile.name;
    $("#profileAvatar").src = profile.avatar;
    closeProfile();
  };
}

function openProfile(){
  const m = $("#profileModal");
  m.style.display = "flex"; m.setAttribute("aria-hidden","false");
  $("#profilePreview").src = profile.avatar;
  $("#profileNameInput").value = profile.name;
  $("#profileAvatarInput").value = profile.avatar;
}

function closeProfile(){ const m=$("#profileModal"); m.style.display="none"; m.setAttribute("aria-hidden","true"); }

/* ---------- export / import / csv / reset ---------- */
function setupExportImport(){
  $("#exportBtn").onclick = ()=> {
    const data = { books, profile, version: APP_VERSION, savedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "reading_journal_export.json"; document.body.appendChild(a); a.click(); a.remove();
  };

  $("#importFile").onchange = (e) => {
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if(!data.books || !Array.isArray(data.books)) return alert("Invalid import file");
        // merge: keep existing and add new non-duplicate by title+author
        const existingKeys = new Set(books.map(b=> (b.title+"|"+(b.author||"")).toLowerCase()));
        const toAdd = data.books.filter(nb => !existingKeys.has((nb.title+"|"+(nb.author||"")).toLowerCase()));
        if(toAdd.length) books = toAdd.concat(books);
        saveBooks(books);
        renderStats(); applyFilters();
        alert(`Imported ${toAdd.length} new books (skipped duplicates).`);
      } catch (err) {
        alert("Could not import file (invalid JSON)");
      }
    };
    reader.readAsText(f);
    // clear input
    e.target.value = "";
  };

  $("#exportCSV").onclick = () => {
    const rows = [["title","author","pages","status","progress","dateFinished","mood"].join(",")];
    books.forEach(b=> rows.push([escapeCSV(b.title), escapeCSV(b.author||""), b.pages||"", b.status||"", b.progress||0, b.dateFinished||"", (b.mood||[]).join("|")].join(",")));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "reading_journal.csv"; document.body.appendChild(a); a.click(); a.remove();
  };

  $("#resetData").onclick = () => {
    if(!confirm("Factory reset will erase your saved books and restore defaults. Continue?")) return;
    localStorage.removeItem(STORAGE_KEY);
    books = loadBooks();
    saveBooks(books);
    renderStats(); applyFilters(); renderGoals();
  };
}

function escapeCSV(s){ if(!s) return ""; return `"${String(s).replace(/"/g,'""')}"`; }

/* ---------- sidebar, tabs, theme ---------- */
function setupSidebar(){
  const sidebar = $("#sidebar");
  const collapse = $("#collapseSidebar");
  const mobileBtn = $("#mobileMenuBtn");

  collapse.onclick = () => {
    const collapsed = sidebar.classList.toggle("collapsed");
    collapse.textContent = collapsed ? "➡" : "⬅";
  };
  mobileBtn.onclick = () => sidebar.classList.toggle("open");

  // close sidebar on content click for small screens
  $("#mainContent").onclick = () => {
    if(window.innerWidth < 980) sidebar.classList.remove("open");
  };
}

function setupTabs(){
  const buttons = $$(".nav-btn");
  buttons.forEach(btn => {
    btn.onclick = () => {
      buttons.forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.target;
      $$(".page-section").forEach(s=> s.classList.remove("active"));
      $("#" + target).classList.add("active");
      // small animation: add fade
      $("#" + target).classList.add("fade");
      setTimeout(()=> $("#" + target).classList.remove("fade"), 350);
    };
  });
}

function setupTheme(){
  const saved = localStorage.getItem("rj_theme");
  if(saved) document.documentElement.setAttribute("data-theme", saved);
  $("#themeToggle").onclick = () => {
    const cur = document.documentElement.getAttribute("data-theme") || "pastel";
    const next = cur === "pastel" ? "cyber" : "pastel";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("rj_theme", next);
    // update rings colors re-render
    document.querySelectorAll(".ring").forEach((el, i)=> {
      const card = el.closest(".book-card");
      const id = card && card.querySelector(".cover") && card.querySelector(".cover").dataset.id;
      const b = books.find(x=>x.id===id);
      renderRing(el, (b && b.progress) || 0);
    });
  };
}

/* ---------- init ---------- */
function init(){
  // populate profile UI
  $("#profileAvatar").src = profile.avatar;
  $("#profileName").textContent = profile.name;

  renderStats();
  renderShelf();
  renderPosts();
  renderTimeline();
  renderGoals();

  setupSidebar();
  setupTabs();
  setupTheme();
  setupAdmin();
  setupProfile();
  setupExportImport();

  $("#searchBtn").onclick = applyFilters;
  $("#searchInput").addEventListener("keypress", e => { if (e.key === "Enter") applyFilters(); });
  $("#statusFilter").onchange = applyFilters;

  $("#goalMonthly").onchange = updateGoalProgress;
  $("#goalYearly").onchange = updateGoalProgress;
}

/* ---------- start ---------- */
window.addEventListener("DOMContentLoaded", init);
