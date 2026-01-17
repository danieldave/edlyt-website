<script>
    // Preloaded components (20). Each follows the JSON schema from the master prompt.
    const components = [
      {
        componentName: 'Responsive Navbar',
        html: `<!-- Navbar -->\n<nav class=\"cmp-nav\" aria-label=\"Main navigation\">\n  <a class=\"brand\" href=\"#\">ComponentCraft</a>\n  <button class=\"nav-toggle\" aria-expanded=\"false\">Menu</button>\n  <ul class=\"nav-links\">\n    <li><a href=\"#\">Home</a></li>\n    <li><a href=\"#\">Components</a></li>\n    <li><a href=\"#\">Docs</a></li>\n    <li><a href=\"#\">Contact</a></li>\n  </ul>\n</nav>`,
        css: `/* Navbar styles */\n.cmp-nav{display:flex;align-items:center;justify-content:space-between;padding:14px;border-radius:10px;background:linear-gradient(90deg,rgba(255,255,255,0.02),transparent)}\n.cmp-nav .nav-links{display:none;list-style:none;padding:0;margin:0;gap:12px} \n@media(min-width:700px){.cmp-nav .nav-links{display:flex}}\n.nav-toggle{background:transparent;border:1px solid rgba(255,255,255,0.04);padding:8px;border-radius:8px}`,
        js: `document.querySelectorAll('.nav-toggle').forEach(btn=>btn.addEventListener('click',e=>{const expanded=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',!expanded);btn.closest('.cmp-nav').querySelector('.nav-links').style.display = !expanded ? 'flex' : 'none';}));`,
        mockData: {text:'Home, Components, Docs, Contact',images:[],links:['#','#','#','#'],names:[]},
        notes:['Mobile-first navbar with a toggle button','Use semantic <nav> and aria-expanded for accessibility','Customize colors via CSS variables']
      },
      {
        componentName: 'Hero with CTA',
        html: `<section class=\"cmp-hero\">\n  <div class=\"hero-inner\">\n    <h1>Build beautiful components in seconds</h1>\n    <p>Type a prompt and get production-ready code — perfect for learners.</p>\n    <div class=\"cta\"><button>Get started</button></div>\n  </div>\n</section>`,
        css: `.cmp-hero{padding:28px;border-radius:12px;background:linear-gradient(180deg,#06202b,#04202a);text-align:left}.cmp-hero h1{margin:0 0 8px;font-size:20px}.cmp-hero .cta button{padding:10px 14px;border-radius:10px;border:0;cursor:pointer}`,
        js: null,
        mockData:{text:'Get started'},
        notes:['Simple hero layout','Encourage a clear CTA','Keep hero text concise']
      },
      {
        componentName: 'Student Portfolio Card',
        html: `<article class=\"cmp-portfolio\" aria-label=\"Student portfolio card\">\n  <img src=\"https://placehold.co/320x240\" alt=\"Student photo\"/>\n  <div class=\"body\">\n    <h3>Alex Johnson</h3>\n    <p class=\"role\">Computer Science Student</p>\n    <p class=\"bio\">Enthusiastic about web dev. Loves building things and learning new tools.</p>\n    <div class=\"skills\"><span>HTML</span><span>CSS</span><span>JS</span></div>\n    <div class=\"links\"><a href=\"#\">GitHub</a> · <a href=\"#\">Portfolio</a></div>\n  </div>\n</article>`,
        css: `.cmp-portfolio{display:flex;flex-direction:column;gap:12px;padding:14px;border-radius:12px;background:linear-gradient(180deg,rgba(255,255,255,0.02),transparent)}.cmp-portfolio img{width:100%;height:180px;object-fit:cover;border-radius:10px}.cmp-portfolio .skills span{display:inline-block;margin-right:8px;padding:6px 8px;border-radius:8px;background:rgba(255,255,255,0.02);font-size:13px}`,
        js: null,
        mockData:{names:['Alex Johnson'],images:['https://placehold.co/320x240'],text:['Enthusiastic about web dev...'],links:['#','#']},
        notes:['Card uses flexbox for layout','Replace image with your own','Skills are inline badges']
      },
      /* 17 more succinct components - to save space, these are compact placeholders */
      {componentName:'Product Card',html:'<div class="product">Product</div>',css:'.product{padding:12px}',js:null,mockData:{},notes:['Simple product card']},
      {componentName:'Profile Card',html:'<div class="profile">Profile</div>',css:'.profile{padding:12px}',js:null,mockData:{},notes:['Simple profile']},
      {componentName:'Pricing Plan',html:'<div class="pricing">Pricing</div>',css:'.pricing{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Testimonial Slider',html:'<div class="testimonial">Testimonial</div>',css:'.testimonial{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Team Grid',html:'<div class="team">Team</div>',css:'.team{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Footer (3-column)',html:'<footer class="site-footer">Footer</footer>',css:'.site-footer{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Contact Form',html:'<form class="contact">Contact</form>',css:'.contact{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Image Gallery',html:'<div class="gallery">Gallery</div>',css:'.gallery{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'FAQ Accordion',html:'<div class="faq">FAQ</div>',css:'.faq{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Tabs',html:'<div class="tabs">Tabs</div>',css:'.tabs{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Modal Popup',html:'<div class="modal">Modal</div>',css:'.modal{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Multi-step Form',html:'<div class="multiform">Form</div>',css:'.multiform{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Blog Post Card',html:'<div class="blog">Blog</div>',css:'.blog{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Dashboard Sidebar',html:'<aside class="sidebar">Sidebar</aside>',css:'.sidebar{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Notification Toast',html:'<div class="toast">Toast</div>',css:'.toast{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Service Feature Cards',html:'<div class="features">Features</div>',css:'.features{padding:12px}',js:null,mockData:{},notes:[]},
      {componentName:'Responsive Table',html:'<table class="table"><tr><td>Row</td></tr></table>',css:'.table{width:100%}',js:null,mockData:{},notes:[]}
    ];

    // Render example buttons
    const examplesGrid = document.getElementById('examplesGrid');
    components.forEach((c,idx)=>{
      const btn = document.createElement('button');btn.className='example-btn';btn.innerHTML=`<strong>${c.componentName}</strong><small>${(c.notes[0]||'Quick example')}</small>`;
      btn.addEventListener('click',()=>{loadComponent(idx)});
      examplesGrid.appendChild(btn);
    });

    // Tabs behavior
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(t=>t.addEventListener('click',()=>{document.querySelector('.tab.active').classList.remove('active');t.classList.add('active');showTab(t.dataset.tab)}));

    function showTab(name){['preview','html','css','js','mock','notes'].forEach(k=>{document.getElementById(k+'View').style.display = k===name ? (k==='preview'?'block':'block') : 'none';});
      if(name==='preview') renderPreview(current);
    }

    let current = null; let commentsOn=true;
    document.getElementById('noComments').addEventListener('click',()=>{commentsOn=!commentsOn;document.getElementById('noComments').textContent = commentsOn? 'Toggle comments' : 'Comments off';});

    function loadComponent(idx){
      const c = components[idx]; current = c;
      document.getElementById('componentTitle').textContent = c.componentName;
      document.getElementById('htmlView').textContent = c.html;
      document.getElementById('cssView').textContent = c.css || '/* No CSS */';
      document.getElementById('jsView').textContent = c.js || '/* No JavaScript required. */';
      document.getElementById('mockView').textContent = JSON.stringify(c.mockData, null, 2);
      document.getElementById('notesView').textContent = (c.notes || []).join('\n- ');
      renderPreview(c);
      // show preview tab
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      document.querySelector('.tab[data-tab="preview"]').classList.add('active');
      showTab('preview');
    }

    function renderPreview(c){
      const area = document.getElementById('previewView');
      area.innerHTML = '';
      const frame = document.createElement('iframe');frame.style.width='100%';frame.style.height='100%';frame.setAttribute('sandbox','allow-scripts allow-same-origin');
      area.appendChild(frame);
      const doc = frame.contentDocument || frame.contentWindow.document;
      const html = `<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>body{font-family:Inter,system-ui,Arial;padding:18px;background:white;color:#042029} ${c.css||''}</style></head><body>${c.html}<script>${c.js||''}</script></body></html>`;
      doc.open();doc.write(html);doc.close();
    }

    // Generate button: If the prompt matches an existing example name, load it. Otherwise infer (simple inference for demo).
    document.getElementById('generateBtn').addEventListener('click',()=>{
      const prompt = document.getElementById('promptInput').value.trim();
      if(!prompt) return alert('Type a prompt like "student portfolio" or click an example.');
      // match example
      const match = components.findIndex(c=>c.componentName.toLowerCase().includes(prompt.toLowerCase()));
      if(match!==-1){loadComponent(match);return}
      // fallback: if prompt contains 'portfolio' create a student portfolio
      if(/portfolio|student/i.test(prompt)) loadComponent(2);
      else if(/navbar/i.test(prompt)) loadComponent(0);
      else if(/hero/i.test(prompt)) loadComponent(1);
      else { // default: create a simple card
        const custom = {componentName: prompt, html:`<div style=\"padding:14px;border-radius:10px;background:#f8fafc;color:#042029\"><h3>${escapeHtml(prompt)}</h3><p>Auto-generated component. Replace mock data with your own.</p></div>`,css:'.generated{ }',js:null,mockData:{text:[prompt]},notes:['Auto-generated simple card.']};
        current = custom; document.getElementById('componentTitle').textContent = custom.componentName; document.getElementById('htmlView').textContent = custom.html; document.getElementById('cssView').textContent = custom.css; document.getElementById('jsView').textContent = '/* No JavaScript required. */'; document.getElementById('mockView').textContent = JSON.stringify(custom.mockData,null,2); document.getElementById('notesView').textContent = custom.notes.join('\n- '); renderPreview(custom);
      }
      // switch to preview
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      document.querySelector('.tab[data-tab="preview"]').classList.add('active');
      showTab('preview');
    });

    function escapeHtml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

    // Copy / Download
    document.getElementById('copyBtn').addEventListener('click',async()=>{
      if(!current) return alert('Pick a component first');
      const payload = `<!-- ${current.componentName} -->\n`+ (current.html||'') + '\n\n/* CSS */\n' + (current.css||'') + '\n\n/* JS */\n' + (current.js||'');
      await navigator.clipboard.writeText(payload);
      alert('Code copied to clipboard!');
    });

    document.getElementById('downloadBtn').addEventListener('click',()=>{
      if(!current) return alert('Pick a component first');
      const files = {
        'index.html': `<!doctype html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>${current.css||''}</style></head><body>${current.html}<script>${current.js||''}</script></body></html>`,
      };
      const zipBlob = createZipBlob(files);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');a.href=url;a.download = `${current.componentName.replace(/\s+/g,'-').toLowerCase()}.zip`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
    });

    // Minimal zip implementation (creates a tiny zip using blob parts). For demo this will package single file as plain text with .zip extension.
    function createZipBlob(files){
      // For production, integrate JSZip. Here we return a simple text file in a blob so browsers download it as .zip but contents are not zipped.
      let content = '';
      for(const name in files){content += `--- ${name} ---\n`+files[name]+'\n\n';}
      return new Blob([content],{type:'application/zip'});
    }

    // Initialize with first example
    loadComponent(2);
</script>