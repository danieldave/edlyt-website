/* app.js
   Full client-side app:
   - categories & keywords (localStorage)
   - parse items (many formats)
   - categorize
   - three views (detailed/simple/accounting)
   - export PNG, share WhatsApp (Web Share fallback), download HTML/CSV, print
   - theme switcher
   - PWA install prompt handling
*/

(() => {
  // DOM
  const catForm = document.getElementById('catForm');
  const catName = document.getElementById('catName');
  const catKeywords = document.getElementById('catKeywords');
  const categoriesList = document.getElementById('categoriesList');
  const resetCats = document.getElementById('resetCats');

  const itemsInput = document.getElementById('itemsInput');
  const generateBtn = document.getElementById('generateBtn');
  const viewMode = document.getElementById('viewMode');

  const reportArea = document.getElementById('reportArea');
  const summaryInfo = document.getElementById('summaryInfo');
  const invalidLinesEl = document.getElementById('invalidLines');

  const saveImgBtn = document.getElementById('saveImgBtn');
  const shareBtn = document.getElementById('shareBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const downloadCSV = document.getElementById('downloadCSV');
  const copyHTML = document.getElementById('copyHTML');
  const printBtn = document.getElementById('printBtn');
  const sampleBtn = document.getElementById('sampleBtn');
  const clearInput = document.getElementById('clearInput');

  const themeSelect = document.getElementById('themeSelect');
  const installBtn = document.getElementById('installBtn');

  // storage keys
  const KEY_CATS = 'sr_categories_v1';
  const KEY_INPUT = 'sr_last_input_v1';
  const KEY_THEME = 'sr_theme_v1';

  // default cats
  const DEFAULT_CATEGORIES = [
    { name: 'Groceries', keywords: ['rice','beans','soap','sugar','salt','oil'] },
    { name: 'Stationery', keywords: ['pen','pencil','book','notebook','marker','eraser'] },
    { name: 'Transport', keywords: ['transport','fuel','bus','taxi','uber','train'] },
    { name: 'Others', keywords: ['*'] }
  ];

  // app state
  let categories = loadJSON(KEY_CATS) || DEFAULT_CATEGORIES.slice();
  let deferredPrompt = null; // for install prompt

  // ----- helpers -----
  function loadJSON(k){
    try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; }
  }
  function saveJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)); }

  function setTheme(theme){
    document.body.setAttribute('data-theme', theme);
    saveJSON(KEY_THEME, theme);
    // update theme-color meta for PWA
    const meta = document.getElementById('meta-theme-color');
    if(meta) {
      const map = { classic: '#f7fbff', lavender: '#f2ecff', seafoam: '#e9faf6' };
      meta.setAttribute('content', map[theme] || '#f7fbff');
    }
  }

  // ----- category UI -----
  function renderCategories(){
    categoriesList.innerHTML = '';
    categories.forEach((c, idx) =>{
      const el = document.createElement('div');
      el.className = 'category-item';
      el.innerHTML = `
        <div>
          <div style="font-weight:700">${escapeHtml(c.name)}</div>
          <div class="cat-keywords">${escapeHtml((c.keywords||[]).join(', '))}</div>
        </div>
        <div class="row">
          <button data-edit="${idx}" class="btn ghost small">Edit</button>
          <button data-delete="${idx}" class="btn ghost small">Delete</button>
        </div>
      `;
      categoriesList.appendChild(el);
    });

    // wire buttons
    categoriesList.querySelectorAll('[data-edit]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const i = Number(e.currentTarget.dataset.edit);
        editCategory(i);
      });
    });
    categoriesList.querySelectorAll('[data-delete]').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const i = Number(e.currentTarget.dataset.delete);
        if(!confirm('Delete this category?')) return;
        categories.splice(i,1);
        saveJSON(KEY_CATS, categories);
        renderCategories();
      });
    });
  }

  function editCategory(i){
    const c = categories[i];
    const newName = prompt('Category name', c.name);
    if(newName === null) return;
    const newKw = prompt('Keywords (comma-separated)', (c.keywords||[]).join(', '));
    if(newKw === null) return;
    categories[i] = { name: newName.trim(), keywords: newKw.split(',').map(s=>s.trim()).filter(Boolean) };
    saveJSON(KEY_CATS, categories);
    renderCategories();
  }

  catForm.addEventListener('submit', e=>{
    e.preventDefault();
    const name = (catName.value||'').trim();
    const kw = (catKeywords.value||'').split(',').map(s=>s.trim()).filter(Boolean);
    if(!name) return alert('Category needs a name');
    categories.push({ name, keywords: kw });
    saveJSON(KEY_CATS, categories);
    catName.value = ''; catKeywords.value = '';
    renderCategories();
  });

  resetCats.addEventListener('click', ()=>{
    if(!confirm('Reset categories to defaults?')) return;
    categories = DEFAULT_CATEGORIES.slice();
    saveJSON(KEY_CATS, categories);
    renderCategories();
  });

  // ----- parsing -----
  function parsePrice(raw){
    if(raw === undefined || raw === null) return null;
    let s = String(raw).trim();
    s = s.replace(/(₦|\$|£|€|NGN|USD|EUR|GBP)/ig, '');
    s = s.replace(/,/g,'');
    const m = s.match(/-?\d+(\.\d+)?/);
    if(!m) return null;
    const num = parseFloat(m[0]);
    if(Number.isNaN(num)) return null;
    return num;
  }

  function parseLine(line){
    const raw = line.trim();
    if(!raw) return null;
    // attempt to get last number-like token
    const lastNumMatch = raw.match(/(-?\d{1,3}(?:[,\d]*)(?:\.\d+)?)(?!.*\d)/);
    let price = null;
    let name = raw;
    if(lastNumMatch){
      price = parsePrice(lastNumMatch[0]);
      const idx = raw.lastIndexOf(lastNumMatch[0]);
      name = raw.slice(0, idx).replace(/[-:—–]+$/,'').trim();
      if(!name) name = '(unnamed)';
    } else {
      // split by separators
      const parts = raw.split(/\s+-\s+|\s+:\s+|\s+\|\s+/);
      if(parts.length >= 2){
        name = parts.slice(0,-1).join(' - ').trim();
        price = parsePrice(parts[parts.length-1]);
      } else {
        price = null;
        name = raw;
      }
    }
    return { raw, name, price };
  }

  function parseAll(text){
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const parsed = [];
    const invalid = [];
    lines.forEach((ln, idx)=>{
      const p = parseLine(ln);
      if(!p) return;
      if(p.price === null) invalid.push({line:ln, parsed:p});
      else parsed.push(p);
    });
    return { parsed, invalid };
  }

  // ----- categorization -----
  function matchCategoryIndex(name, cats){
    const lower = name.toLowerCase();
    for(let i=0;i<cats.length;i++){
      const kw = (cats[i].keywords||[]).map(k=>k.trim().toLowerCase()).filter(Boolean);
      if(kw.includes('*')) continue; // place last
      for(const k of kw){
        if(!k) continue;
        if(lower.includes(k)) return i;
      }
    }
    for(let i=0;i<cats.length;i++){
      const kw = (cats[i].keywords||[]).map(k=>k.trim().toLowerCase()).filter(Boolean);
      if(kw.includes('*')) return i;
    }
    return -1;
  }

  function categorize(items, cats){
    const grouped = {};
    cats.forEach(c => grouped[c.name] = { name: c.name, items: [], keywords: c.keywords || [] });
    if(!grouped['Uncategorized']) grouped['Uncategorized'] = { name:'Uncategorized', items: [] };

    items.forEach(it => {
      const idx = matchCategoryIndex(it.name, cats);
      if(idx >= 0) grouped[cats[idx].name].items.push(it);
      else grouped['Uncategorized'].items.push(it);
    });
    return grouped;
  }

  // ----- renderers -----
  function formatCurrency(n){
    if(n === null || n === undefined) n = 0;
    const isInt = Number(n) === Math.trunc(Number(n));
    if(isNaN(Number(n))) return '₦0';
    if(isInt) return '₦' + new Intl.NumberFormat('en-NG').format(Math.round(n));
    else return '₦' + new Intl.NumberFormat('en-NG', {minimumFractionDigits:2, maximumFractionDigits:2}).format(n);
  }

  function renderDetailed(groups){
    reportArea.innerHTML = '';
    let grand = 0, count = 0;
    Object.keys(groups).forEach(catName=>{
      const g = groups[catName];
      if(!g || g.items.length === 0) return;
      const block = document.createElement('div');
      block.className = 'category-block';
      const subtotal = g.items.reduce((s,it)=> s + Number(it.price||0), 0);
      grand += subtotal; count += g.items.length;

      block.innerHTML = `<h3>${escapeHtml(g.name)} <span class="badge">${g.items.length} items</span></h3><div class="category-items"></div>
        <div class="muted" style="margin-top:8px">Category total: <strong>${formatCurrency(subtotal)}</strong></div>`;
      const list = block.querySelector('.category-items');
      g.items.forEach(it=>{
        const r = document.createElement('div'); r.className = 'item-row';
        r.innerHTML = `<div class="name">${escapeHtml(it.name)}</div><div class="price">${formatCurrency(it.price)}</div>`;
        list.appendChild(r);
      });
      reportArea.appendChild(block);
    });
    const foot = document.createElement('div');
    foot.style.marginTop = '10px';
    foot.innerHTML = `<h3>Grand Total <span class="badge">${count} items</span></h3><div style="font-size:18px;font-weight:800;margin-top:6px">${formatCurrency(grand)}</div>`;
    reportArea.appendChild(foot);
    summaryInfo.textContent = `Items: ${count} · Total: ${formatCurrency(grand)}`;
  }

  function renderSimple(groups){
    reportArea.innerHTML = '';
    let grand = 0, count=0;
    Object.keys(groups).forEach(catName=>{
      const g = groups[catName];
      if(!g || g.items.length === 0) return;
      const block = document.createElement('div'); block.className='category-block';
      block.innerHTML = `<h3>${escapeHtml(g.name)} <span class="badge">${g.items.length}</span></h3>`;
      const list = document.createElement('div'); list.className='category-items';
      g.items.forEach(it=>{
        const r = document.createElement('div'); r.className='item-row';
        r.innerHTML = `<div class="name">${escapeHtml(it.name)}</div><div class="price">${formatCurrency(it.price)}</div>`;
        list.appendChild(r);
        grand += Number(it.price||0); count++;
      });
      block.appendChild(list);
      reportArea.appendChild(block);
    });
    const foot = document.createElement('div'); foot.style.marginTop='10px';
    foot.innerHTML = `<div style="font-weight:700">Grand Total: ${formatCurrency(grand)}</div>`;
    reportArea.appendChild(foot);
    summaryInfo.textContent = `Items: ${count} · Total: ${formatCurrency(grand)}`;
  }

  function renderAccounting(groups){
    reportArea.innerHTML = '';
    const table = document.createElement('table'); table.className='table';
    table.innerHTML = `<thead><tr><th>Category</th><th>Item</th><th class="right">Price</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector('tbody');
    let total=0;
    Object.keys(groups).forEach(catName=>{
      const g = groups[catName];
      if(!g) return;
      if(g.items.length === 0){
        const tr = document.createElement('tr'); tr.innerHTML = `<td>${escapeHtml(g.name)}</td><td>—</td><td class="right">₦0</td>`;
        tbody.appendChild(tr);
      } else {
        g.items.forEach((it, idx)=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${idx===0?escapeHtml(g.name):''}</td><td>${escapeHtml(it.name)}</td><td class="right">${formatCurrency(it.price)}</td>`;
          tbody.appendChild(tr);
          total += Number(it.price||0);
        });
        const trT = document.createElement('tr');
        trT.innerHTML = `<td></td><td style="font-weight:700">Category total</td><td class="right" style="font-weight:700">${formatCurrency(g.items.reduce((s,i)=>s+Number(i.price||0),0))}</td>`;
        tbody.appendChild(trT);
      }
    });
    const trGrand = document.createElement('tr');
    trGrand.innerHTML = `<td></td><td style="font-weight:900">Grand Total</td><td class="right" style="font-weight:900">${formatCurrency(total)}</td>`;
    tbody.appendChild(trGrand);
    reportArea.appendChild(table);
    summaryInfo.textContent = `Items: — · Total: ${formatCurrency(total)}`;
  }

  // ----- generate -----
  function generateReport(){
    const text = (itemsInput.value||'').trim();
    if(!text) return alert('Please paste items first');
    saveJSON(KEY_INPUT, text);
    const { parsed, invalid } = parseAll(text);
    const grouped = categorize(parsed, categories);
    // render according to view mode
    const mode = (viewMode.value || 'detailed');
    if(mode === 'detailed') renderDetailed(grouped);
    else if(mode === 'simple') renderSimple(grouped);
    else renderAccounting(grouped);
    renderInvalid(invalid);
  }

  function renderInvalid(invalid){
    if(!invalid || invalid.length === 0){ invalidLinesEl.innerHTML=''; return; }
    invalidLinesEl.innerHTML = `<strong>Invalid/missing price:</strong><ul>${invalid.map(i=>`<li>${escapeHtml(i.line)}</li>`).join('')}</ul>`;
  }

  // ----- export (html & csv) -----
  function buildExportHTML(){
    const header = 'Smart Report';
    const content = reportArea.innerHTML;
    const now = new Date().toLocaleString();
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(header)}</title>
    <style>body{font-family:Arial,Helvetica,sans-serif;padding:18px;color:#111} .item-row{display:flex;justify-content:space-between;margin:6px 0}</style>
    </head><body><h1>${escapeHtml(header)}</h1><p>Exported: ${escapeHtml(now)}</p><hr/>${content}</body></html>`;
  }

  function downloadHTML(){
    const html = buildExportHTML();
    const blob = new Blob([html], {type:'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'report.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function buildCSV(){
    const text = (itemsInput.value||'').trim();
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const rows = [['Category','Item','Price']];
    lines.forEach(ln=>{
      const p = parseLine(ln);
      if(!p) return;
      const idx = matchCategoryIndex(p.name, categories);
      const catName = idx>=0 ? categories[idx].name : 'Uncategorized';
      rows.push([catName, p.name, p.price===null ? '' : p.price]);
    });
    return rows.map(r => r.map(csvEscape).join(',')).join('\n');
  }
  function csvEscape(v){ if(v===null||v===undefined) return ''; const s = String(v); if(s.includes(',')||s.includes('"')) return `"${s.replace(/"/g,'""')}"`; return s; }

  // ----- image export (html2canvas) -----
  function saveAsImage(){
    // temporarily apply white background to ensure crisp
    const prevBg = reportArea.style.background;
    reportArea.style.background = '#fff';
    html2canvas(reportArea, { scale: 2, useCORS:true }).then(canvas=>{
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = 'report.png'; document.body.appendChild(a); a.click(); a.remove();
      reportArea.style.background = prevBg;
    }).catch(err=>{
      reportArea.style.background = prevBg;
      alert('Unable to export image: ' + (err && err.message ? err.message : 'unknown'));
    });
  }

  // ----- share to Whatsapp / Web Share -----
  function shareReport(){
    // prefer Web Share with files (mobile)
    if(navigator.canShare){
      html2canvas(reportArea, { scale: 2 }).then(canvas=>{
        canvas.toBlob(blob=>{
          const file = new File([blob], 'report.png', { type:'image/png' });
          if(navigator.canShare({ files: [file] })){
            navigator.share({ files: [file], title: 'Report', text: 'Here is the report' }).catch(()=>{
              // fallback to whatsapp text
              window.open('https://wa.me/?text=' + encodeURIComponent(reportArea.innerText));
            });
          } else {
            window.open('https://wa.me/?text=' + encodeURIComponent(reportArea.innerText));
          }
        });
      });
    } else {
      // fallback: open whatsapp web with text content
      window.open('https://wa.me/?text=' + encodeURIComponent(reportArea.innerText));
    }
  }

  // ----- small utils -----
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // ----- init / events -----
  generateBtn.addEventListener('click', generateReport);
  downloadBtn.addEventListener('click', downloadHTML);
  downloadCSV.addEventListener('click', ()=>{
    const csv = buildCSV(); const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'report.csv'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  saveImgBtn.addEventListener('click', saveAsImage);
  shareBtn.addEventListener('click', shareReport);
  copyHTML.addEventListener('click', async ()=>{
    try { await navigator.clipboard.writeText(reportArea.innerHTML); alert('Report HTML copied to clipboard'); }
    catch(e){ alert('Copy failed — try Download HTML instead'); }
  });
  printBtn.addEventListener('click', ()=> window.print());

  sampleBtn.addEventListener('click', ()=>{
    const sample = [
      'Pen - 200',
      'Book - 500',
      'Rice 1,200',
      'Transport: 300',
      'Soap - 250',
      'Milo 900',
      'Notebook - 450'
    ].join('\\n');
    itemsInput.value = sample;
    saveJSON(KEY_INPUT, sample);
    generateReport();
  });

  clearInput.addEventListener('click', ()=> {
    if(!confirm('Clear input?')) return;
    itemsInput.value = '';
    saveJSON(KEY_INPUT, '');
    reportArea.innerHTML = '<p class="muted">No report yet — paste items and click <strong>Generate</strong>.</p>';
    summaryInfo.textContent = 'Items: 0 · Total: ₦0';
    invalidLinesEl.innerHTML = '';
  });

  // theme
  themeSelect.addEventListener('change', ()=> setTheme(themeSelect.value));

  // load initial data
  function start(){
    // restore categories
    const savedCats = loadJSON(KEY_CATS);
    if(savedCats && Array.isArray(savedCats)) categories = savedCats;
    else saveJSON(KEY_CATS, categories);

    // restore input
    const savedInput = localStorage.getItem(KEY_INPUT) || '';
    itemsInput.value = savedInput;

    // theme
    const savedTheme = loadJSON(KEY_THEME) || 'classic';
    themeSelect.value = savedTheme;
    setTheme(savedTheme);

    renderCategories();
    // auto-generate if input exists
    if(itemsInput.value.trim()) generateReport();
  }

  // install prompt handling
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = 'inline-block';
  });
  installBtn.addEventListener('click', async ()=>{
    if(!deferredPrompt) return alert('Install not available');
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if(choice.outcome === 'accepted') { deferredPrompt = null; installBtn.style.display='none'; }
  });

  // quick keyboard shortcut: Ctrl+G to generate
  window.addEventListener('keydown', (e)=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase() === 'g'){ e.preventDefault(); generateReport(); }
  });

  // start
  start();

})(); // IIFE
