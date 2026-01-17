// Quick Report Builder - app.js
// Author: assistant (customized for user's mum)
// No external libraries. Uses localStorage for persistence.

(() => {
  // --- DOM ---
  const catForm = document.getElementById('categoryForm');
  const catNameInput = document.getElementById('catName');
  const catKeywordsInput = document.getElementById('catKeywords');
  const catsListEl = document.getElementById('categoriesList');
  const resetCatsBtn = document.getElementById('resetCats');

  const itemsInput = document.getElementById('itemsInput');
  const generateBtn = document.getElementById('generateBtn');
  const viewModeSelect = document.getElementById('viewMode');
  const reportArea = document.getElementById('reportArea');
  const summaryCount = document.getElementById('summaryCount');
  const summaryTotal = document.getElementById('summaryTotal');
  const invalidLinesEl = document.getElementById('invalidLines');

  const printBtn = document.getElementById('printBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const clearInputBtn = document.getElementById('clearInput');
  const exportCSVBtn = document.getElementById('exportCSV');
  const copyHTMLBtn = document.getElementById('copyHTML');

  // --- storage keys and defaults ---
  const STORAGE_KEY = 'qr_categories_v1';
  const INPUT_KEY = 'qr_last_input_v1';

  const DEFAULT_CATEGORIES = [
    { name: 'Groceries', keywords: ['rice','beans','soap','milo','sugar','salt','oil'] },
    { name: 'Stationery', keywords: ['pen','pencil','book','notebook','eraser','marker'] },
    { name: 'Transport', keywords: ['transport','bus','fuel','taxi','uber','train'] },
    { name: 'Others', keywords: ['*'] }
  ];

  // --- helpers ---
  function loadCategories(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return DEFAULT_CATEGORIES.slice();
      const parsed = JSON.parse(raw);
      if(!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_CATEGORIES.slice();
      return parsed;
    } catch(e){ return DEFAULT_CATEGORIES.slice(); }
  }

  function saveCategories(cats){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cats));
  }

  function saveInput(text){
    localStorage.setItem(INPUT_KEY, text);
  }
  function loadInput(){
    return localStorage.getItem(INPUT_KEY) || '';
  }

  // sanitize money string to number
  function parsePrice(raw){
    if(raw === undefined || raw === null) return null;
    // remove currency symbols, commas, spaces except decimal point and minus
    let s = String(raw).trim();
    // Replace common currency symbols and words
    s = s.replace(/(₦|\$|£|€|NGN|USD|EUR|GBP)/ig, '');
    s = s.replace(/,/g, '');
    // Find number (allow decimals)
    const m = s.match(/-?\d+(\.\d+)?/);
    if(!m) return null;
    const num = parseFloat(m[0]);
    if(Number.isNaN(num)) return null;
    return num;
  }

  // parse a single line -> {name, price, raw}
  function parseLine(line){
    const raw = line.trim();
    if(!raw) return null;
    // Try to find last number in line (common format "item 1234" or "item - 1,234" or "item: ₦1,234")
    const lastNumMatch = raw.match(/(-?\d{1,3}(?:[,\d]*)(?:\.\d+)?)(?!.*\d)/);
    // Alternative: match any number pattern at end
    let price = null;
    let name = raw;
    if(lastNumMatch){
      price = parsePrice(lastNumMatch[0]);
      // name is raw with the matched number removed
      const idx = raw.lastIndexOf(lastNumMatch[0]);
      name = raw.slice(0, idx).replace(/[-:—–]+$/,'').trim();
      if(!name) name = '(unnamed item)';
    } else {
      // no number found — attempt to split by common separators
      const parts = raw.split(/\s+-\s+|\s+:\s+|\s+\|\s+/);
      if(parts.length >= 2){
        name = parts.slice(0, -1).join(' - ').trim();
        price = parsePrice(parts[parts.length-1]);
      } else {
        // If absolutely no price, mark price null and keep raw as name
        price = null;
        name = raw;
      }
    }
    return { raw, name, price };
  }

  // match name to category by keywords. returns index in cats or -1
  function matchCategoryIndex(name, cats){
    const lower = name.toLowerCase();
    // exact keyword inclusion
    for(let i=0;i<cats.length;i++){
      const kw = (cats[i].keywords || []).map(k => k.trim().toLowerCase()).filter(Boolean);
      // check '*' wildcard
      if(kw.includes('*')) continue; // skip catch-all for now (place last)
      for(const k of kw){
        if(!k) continue;
        // match whole word or inclusion — allow partial matches (e.g., "soap" matches "handsoap")
        if(lower.includes(k)) return i;
      }
    }
    // no match -> next check catch-all
    for(let i=0;i<cats.length;i++){
      const kw = (cats[i].keywords || []).map(k => k.trim().toLowerCase()).filter(Boolean);
      if(kw.includes('*')) return i;
    }
    return -1;
  }

  // --- UI render functions ---
  function renderCategories(){
    const cats = loadCategories();
    catsListEl.innerHTML = '';
    cats.forEach((c, idx) => {
      const item = document.createElement('div');
      item.className = 'category-item';
      item.innerHTML = `
        <div class="cat-left">
          <div>
            <div style="font-weight:700">${escapeHtml(c.name)}</div>
            <div class="cat-keywords">${escapeHtml((c.keywords||[]).join(', '))}</div>
          </div>
        </div>
        <div class="cat-actions">
          <button data-edit="${idx}" class="btn ghost small">Edit</button>
          <button data-delete="${idx}" class="btn ghost small">Delete</button>
        </div>
      `;
      catsListEl.appendChild(item);
    });

    // wire up edit/delete
    catsListEl.querySelectorAll('[data-edit]').forEach(btn =>{
      btn.addEventListener('click', (e)=>{
        const i = Number(e.currentTarget.dataset.edit);
        editCategory(i);
      });
    });
    catsListEl.querySelectorAll('[data-delete]').forEach(btn =>{
      btn.addEventListener('click', (e)=>{
        const i = Number(e.currentTarget.dataset.delete);
        deleteCategory(i);
      });
    });
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  function editCategory(index){
    const cats = loadCategories();
    const c = cats[index];
    const newName = prompt('Edit category name:', c.name);
    if(newName === null) return;
    const newKw = prompt('Edit keywords (comma-separated):', (c.keywords||[]).join(', '));
    if(newKw === null) return;
    cats[index] = { name: newName.trim() || c.name, keywords: newKw.split(',').map(x=>x.trim()).filter(Boolean) };
    saveCategories(cats);
    renderCategories();
  }

  function deleteCategory(index){
    if(!confirm('Delete this category? This will remove it from saved structure.')) return;
    const cats = loadCategories();
    cats.splice(index,1);
    saveCategories(cats);
    renderCategories();
  }

  // --- core generate ---
  function generateReport(){
    const cats = loadCategories();
    const text = itemsInput.value || '';
    saveInput(text);
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    const parsed = [];
    const invalid = [];
    lines.forEach((ln, i) => {
      const p = parseLine(ln);
      if(!p) return;
      if(p.price === null || p.price === undefined){
        // push as invalid but still store name
        invalid.push({line:ln, index:i, parsed:p});
      } else {
        parsed.push(p);
      }
    });

    // categorize parsed items
    const grouped = {};
    const categoryOrder = [];
    for(let i=0;i<cats.length;i++){
      grouped[cats[i].name] = { name: cats[i].name, items: [], keywords: cats[i].keywords || [] };
      categoryOrder.push(cats[i].name);
    }

    // unmatched goes to 'Uncategorized' or create if not exist
    if(!grouped['Uncategorized']) grouped['Uncategorized'] = { name: 'Uncategorized', items: []};

    parsed.forEach(item => {
      const idx = matchCategoryIndex(item.name, cats);
      if(idx >= 0){
        grouped[cats[idx].name].items.push(item);
      } else {
        grouped['Uncategorized'].items.push(item);
      }
    });

    // compute totals
    const result = [];
    let grandTotal = 0;
    let grandCount = 0;
    for(const catName of categoryOrder){
      const g = grouped[catName];
      if(!g) continue;
      const total = g.items.reduce((s,it) => s + (Number(it.price)||0), 0);
      grandTotal += total;
      grandCount += g.items.length;
      result.push({ name: catName, items: g.items, total, count: g.items.length });
    }
    // include Uncategorized if present and has items
    if(grouped['Uncategorized'].items.length){
      const u = grouped['Uncategorized'];
      const total = u.items.reduce((s,it) => s + (Number(it.price)||0), 0);
      grandTotal += total;
      grandCount += u.items.length;
      result.push({ name: 'Uncategorized', items: u.items, total, count: u.items.length });
    }

    // render depending on view mode
    const mode = viewModeSelect.value || 'detailed';
    if(mode === 'detailed') renderDetailed(result, grandTotal, grandCount);
    if(mode === 'simple') renderSimple(result, grandTotal, grandCount);
    if(mode === 'accounting') renderAccounting(result, grandTotal, grandCount);

    // show invalid lines
    renderInvalid(invalid);

    // update summary badges
    summaryCount.textContent = `Items: ${grandCount}`;
    summaryTotal.textContent = `Total: ${formatCurrency(grandTotal)}`;
  }

  function renderDetailed(groups, grandTotal, grandCount){
    reportArea.innerHTML = '';
    groups.forEach(g => {
      const block = document.createElement('div');
      block.className = 'category-block';
      block.innerHTML = `
        <h3>${escapeHtml(g.name)} <span class="badge">${g.count} items</span></h3>
        <div class="category-items"></div>
        <div class="totals">Category total: <strong style="margin-left:8px">${formatCurrency(g.total)}</strong></div>
      `;
      const list = block.querySelector('.category-items');
      if(g.items.length === 0){
        list.innerHTML = `<div class="muted">No items</div>`;
      } else {
        g.items.forEach(it => {
          const r = document.createElement('div');
          r.className = 'item-row';
          r.innerHTML = `<div class="name">${escapeHtml(it.name)}</div><div class="price">${formatCurrency(it.price)}</div>`;
          list.appendChild(r);
        });
      }
      reportArea.appendChild(block);
    });
    // grand total block
    const gt = document.createElement('div');
    gt.style.marginTop = '12px';
    gt.innerHTML = `<h3>Grand Total <span class="badge">${grandCount} items</span></h3><div style="font-size:18px;font-weight:800;margin-top:6px">${formatCurrency(grandTotal)}</div>`;
    reportArea.appendChild(gt);
  }

  function renderSimple(groups, grandTotal, grandCount){
    reportArea.innerHTML = '';
    groups.forEach(g => {
      const block = document.createElement('div');
      block.className = 'category-block';
      block.innerHTML = `<h3>${escapeHtml(g.name)} <span class="badge">${g.count}</span></h3>`;
      const list = document.createElement('div');
      list.className = 'category-items';
      if(g.items.length === 0){
        list.innerHTML = `<div class="muted">No items</div>`;
      } else {
        g.items.forEach(it => {
          const r = document.createElement('div');
          r.className = 'item-row';
          r.innerHTML = `<div class="name">${escapeHtml(it.name)}</div><div class="price">${formatCurrency(it.price)}</div>`;
          list.appendChild(r);
        });
      }
      block.appendChild(list);
      reportArea.appendChild(block);
    });
    const gt = document.createElement('div');
    gt.style.marginTop = '12px';
    gt.innerHTML = `<div style="font-weight:700">Grand Total: ${formatCurrency(grandTotal)}</div>`;
    reportArea.appendChild(gt);
  }

  function renderAccounting(groups, grandTotal, grandCount){
    reportArea.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'table';
    table.innerHTML = `<thead><tr><th>Category</th><th>Item</th><th class="right">Price</th></tr></thead><tbody></tbody>`;
    const body = table.querySelector('tbody');
    groups.forEach(g=>{
      if(g.items.length === 0){
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${escapeHtml(g.name)}</td><td>—</td><td class="right">${formatCurrency(0)}</td>`;
        body.appendChild(tr);
      } else {
        // merge rows with category label on first row
        g.items.forEach((it, idx) =>{
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${idx===0?escapeHtml(g.name):''}</td><td>${escapeHtml(it.name)}</td><td class="right">${formatCurrency(it.price)}</td>`;
          body.appendChild(tr);
        });
        const trTotal = document.createElement('tr');
        trTotal.innerHTML = `<td></td><td style="font-weight:700">Category total</td><td class="right" style="font-weight:700">${formatCurrency(g.total)}</td>`;
        body.appendChild(trTotal);
      }
    });
    // grand total row
    const trGrand = document.createElement('tr');
    trGrand.innerHTML = `<td></td><td style="font-weight:900">Grand Total</td><td class="right" style="font-weight:900">${formatCurrency(grandTotal)}</td>`;
    body.appendChild(trGrand);

    reportArea.appendChild(table);
  }

  function renderInvalid(invalid){
    if(!invalid || !invalid.length){
      invalidLinesEl.innerHTML = '';
      return;
    }
    invalidLinesEl.innerHTML = `<strong>Invalid / Missing price:</strong><ul>${invalid.map(i=>`<li>${escapeHtml(i.line)}</li>`).join('')}</ul>`;
  }

  function formatCurrency(n){
    if(n === null || n === undefined) n = 0;
    // format with commas, no decimals for simplicity, but keep decimals if present
    const isInt = Number(n) === Math.trunc(Number(n));
    if(isNaN(Number(n))) return '0';
    if(isInt){
      return new Intl.NumberFormat('en-NG').format(Math.round(n));
    } else {
      return new Intl.NumberFormat('en-NG', {minimumFractionDigits:2, maximumFractionDigits:2}).format(n);
    }
  }

  // --- events ---
  catForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = (catNameInput.value || '').trim();
    const kwRaw = (catKeywordsInput.value || '').trim();
    if(!name) return alert('Give category a name');
    const kw = kwRaw ? kwRaw.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const cats = loadCategories();
    cats.push({ name, keywords: kw });
    saveCategories(cats);
    catNameInput.value = '';
    catKeywordsInput.value = '';
    renderCategories();
  });

  resetCatsBtn.addEventListener('click', ()=>{
    if(!confirm('Reset categories to default sample list? This will overwrite your saved categories.')) return;
    saveCategories(DEFAULT_CATEGORIES.slice());
    renderCategories();
  });

  generateBtn.addEventListener('click', ()=>{
    generateReport();
  });

  viewModeSelect.addEventListener('change', ()=>{
    // regenerate when view changes if we have input saved
    generateReport();
  });

  printBtn.addEventListener('click', ()=>{
    // prepare print-friendly layout; print CSS handles the rest
    window.print();
  });

  downloadBtn.addEventListener('click', ()=>{
    const html = buildExportHTML();
    const blob = new Blob([html], {type: 'text/html'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  });

  clearInputBtn.addEventListener('click', ()=>{
    if(!confirm('Clear the items input?')) return;
    itemsInput.value = '';
    saveInput('');
    reportArea.innerHTML = `<p class="muted">Input cleared. Paste items and generate a report.</p>`;
    summaryCount.textContent = 'Items: 0';
    summaryTotal.textContent = 'Total: 0';
    invalidLinesEl.innerHTML = '';
  });

  exportCSVBtn.addEventListener('click', ()=>{
    const csv = buildCSV();
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  });

  copyHTMLBtn.addEventListener('click', async ()=>{
    const html = reportArea.innerHTML;
    try {
      await navigator.clipboard.writeText(html);
      alert('Report HTML copied to clipboard. Paste into an email or editor.');
    } catch(e){
      alert('Unable to copy automatically. You can use "Download HTML" instead.');
    }
  });

  // build a minimal HTML page for export
  function buildExportHTML(){
    const header = document.querySelector('.brand h1').textContent;
    const content = reportArea.innerHTML;
    const now = new Date().toLocaleString();
    return `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(header)} - Report</title>
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:22px}
h1{margin-bottom:6px}
.badge{background:#efefef;padding:4px 8px;border-radius:8px;margin-left:8px}
.item-row{display:flex;justify-content:space-between;margin:6px 0}
</style>
</head>
<body>
<h1>${escapeHtml(header)}</h1>
<p>Exported: ${escapeHtml(now)}</p>
<hr />
<div>${content}</div>
</body>
</html>`;
  }

  function buildCSV(){
    // produce rows: Category, Item, Price
    const rows = [];
    // crude parsing to retrieve displayed grouped items
    const cats = loadCategories();
    const text = itemsInput.value || '';
    const lines = text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    lines.forEach(ln => {
      const p = parseLine(ln);
      if(!p) return;
      const idx = matchCategoryIndex(p.name, cats);
      const catName = idx>=0 ? cats[idx].name : 'Uncategorized';
      rows.push([catName, p.name, p.price === null ? '' : p.price]);
    });
    // CSV string with header
    const csv = ['Category,Item,Price', ...rows.map(r => `${csvEscape(r[0])},${csvEscape(r[1])},${csvEscape(r[2])}`)];
    return csv.join('\n');
  }
  function csvEscape(v){
    if(v === null || v === undefined) return '';
    const s = String(v);
    if(s.includes(',') || s.includes('"')) return `"${s.replace(/"/g,'""')}"`;
    return s;
  }

  // init
  function start(){
    // load saved input
    itemsInput.value = loadInput();
    renderCategories();
    // auto-generate if content exists
    if(itemsInput.value.trim()) generateReport();
    // else default placeholder
    else reportArea.innerHTML = `<p class="muted">No report yet. Paste items on the left and click <strong>Generate Report</strong>.</p>`;
  }

  // small utilities
  function debounce(fn, ms=250){
    let t;
    return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), ms); };
  }

  // Save input on change (debounced)
  itemsInput.addEventListener('input', debounce(()=>saveInput(itemsInput.value), 500));

  // start
  start();

})();
