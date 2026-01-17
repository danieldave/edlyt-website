/* =====================================================
  AI SCRATCH STORY MAKER — Upgraded JS (Full)
  - Structured AI JSON prompts
  - Interactive copyable Scratch blocks
  - Progress tracker, badges, confetti, TTS
  - Save / Load full project JSON to localStorage
  - Robust DOM handling (creates missing containers)
  - Placeholder OPENAI_KEY -> replace with your key
  ===================================================== */

const OPENAI_KEY = ""; // Replace with your key
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // change if desired

/* ---------------------- Utilities ---------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function createEl(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const k in props) {
    if (k === "class") el.className = props[k];
    else if (k === "html") el.innerHTML = props[k];
    else el.setAttribute(k, props[k]);
  }
  children.forEach(c => {
    if (typeof c === "string") el.appendChild(document.createTextNode(c));
    else if (c instanceof Node) el.appendChild(c);
  });
  return el;
}

function rand(min, max) { return Math.random() * (max - min) + min; }
function safeJSONParse(s){ try { return JSON.parse(s); } catch(e) { return null; } }

/* ---------------------- Ensure UI containers ---------------------- */
function ensureContainer() {
  // output section (primary area to render project)
  let out = $("#projectOutput");
  if (!out) {
    out = createEl("div", { id: "projectOutput", class: "output-section" });
    // try to append to a known place (output or body)
    const anchor = $("#output") || $("body");
    anchor.appendChild(out);
  }
  // title, summary containers
  if (!$("#projectTitle")) out.appendChild(createEl("h2", { id: "projectTitle" }, "Your Project will appear here ✨"));
  if (!$("#storySummary")) out.appendChild(createEl("p", { id: "storySummary" }, ""));
  // cards container
  if (!$("#cardsWrap")) out.appendChild(createEl("div", { id: "cardsWrap", class: "cards-wrap" }));
  // progress
  if (!$("#progressWrap")) {
    const progress = createEl("div", { id: "progressWrap", class: "progress-wrap" },
      createEl("div", { id: "progressText" }, "Step 0 of 0"),
      createEl("div", { id: "badgeArea", class: "badge-area" })
    );
    out.appendChild(progress);
  }
  return out;
}
ensureContainer();

/* ---------------------- Helpful UI functions ---------------------- */
function clearOutputUI() {
  $("#projectTitle").innerText = "Generating your project... ✨";
  $("#storySummary").innerText = "";
  $("#cardsWrap").innerHTML = "";
  $("#progressText").innerText = "Step 0 of 0";
  $("#badgeArea").innerHTML = "";
}

function showBadge(text) {
  const b = createEl("div", { class: "badge" }, text);
  $("#badgeArea").appendChild(b);
  setTimeout(()=> b.classList.add("pop"), 100);
  setTimeout(()=> b.remove(), 6000);
}

function playConfetti(amount = 40) {
  // simple DOM confetti (no external lib)
  for (let i = 0; i < amount; i++) {
    const p = createEl("div", { class: "confetti-piece" });
    p.style.position = "fixed";
    p.style.left = `${rand(5, 95)}%`;
    p.style.top = "-20px";
    p.style.width = `${Math.floor(rand(6, 12))}px`;
    p.style.height = `${Math.floor(rand(8, 18))}px`;
    p.style.background = `hsl(${Math.floor(rand(0, 360))} 80% 60%)`;
    p.style.zIndex = 9999;
    p.style.borderRadius = "2px";
    document.body.appendChild(p);
    const dur = rand(1500, 3200);
    p.animate([{transform:"translateY(0) rotate(0deg)", opacity:1},{transform:`translateY(${window.innerHeight + 200}px) rotate(${rand(180,1080)}deg)`, opacity:0.9}], {duration: dur, easing:"cubic-bezier(.2,.8,.2,1)"});
    setTimeout(()=> p.remove(), dur + 100);
  }
}

/* ---------------------- TTS ---------------------- */
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  u.pitch = 1.05;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/* ---------------------- Prompt builder (requests JSON) ---------------------- */
function buildStructuredPrompt(mode, inputs) {
  return `
You are an expert Scratch teacher for kids aged 7-14. Produce a COMPLETE project blueprint in strict JSON format only (no extra chat). The JSON must follow this schema:

{
  "title": string,
  "summary": string,
  "characters": [
    {
      "name": string,
      "sprite_url": string (optional),
      "personality": string,
      "goal": string,
      "blocks": [ "block line 1", "block line 2", ... ],
      "notes": string (optional)
    }
  ],
  "scenes": [
    {
      "name": string,
      "backdrop_url": string (optional),
      "blocks": [ "block line 1", "block line 2", ... ],
      "notes": string (optional)
    }
  ],
  "game_rules": [ "rule 1", "rule 2", ... ],
  "bonus_challenges": [ "challenge 1", ... ]
}

Requirements:
- Keep language simple, short sentences.
- Blocks must be clear Scratch textual blocks (e.g. "when green flag clicked", "repeat 10", "move 10 steps", "if <touching [Star]?> then").
- Provide at least 1 character with 6–12 blocks, and at least 1 scene with 3–8 blocks.
- Include basic scoring logic (create a variable 'score', change it when collecting).
- Include level progression step if applicable.
- Include sound and looks blocks where appropriate (e.g. "play sound [pop] until done", "say 'Yay!' for 2 seconds").
- Do NOT include explanation outside the JSON (respond only with JSON).

Mode: ${mode}
Inputs:
${JSON.stringify(inputs)}
`;
}

/* ---------------------- Fake generator fallback (structured JSON) ---------------------- */
function fakeStructuredProject(mode, inputs) {
  const title = `${(inputs.character || "Hero")} ${mode === "game" ? "Adventure" : "Story"}`;
  const summary = `${(inputs.character || "The hero")} is in ${(inputs.setting || "a magical place")}. ${inputs.plot || "They must collect special items and learn a lesson."}`;
  const characters = [
    {
      name: inputs.character || "Flicker",
      sprite_url: "https://img.icons8.com/emoji/96/000000/dragon.png",
      personality: "Curious and kind",
      goal: "Collect 10 wishes",
      blocks: [
        "when green flag clicked",
        "set [score] to 0",
        "forever",
        "  if key [up arrow] pressed then change y by 10",
        "  if key [down arrow] pressed then change y by -10",
        "  if key [left arrow] pressed then change x by -10",
        "  if key [right arrow] pressed then change x by 10",
        "  if <touching [Wish]> then",
        "    change [score] by 1",
        "    play sound [pop] until done",
        "    delete this clone"
      ],
      notes: "Use flap costumes to animate wings."
    }
  ];

  const scenes = [
    {
      name: "Enchanted Forest",
      backdrop_url: "https://img.icons8.com/emoji/96/000000/deciduous-tree.png",
      blocks: [
        "when green flag clicked",
        "switch backdrop to [Enchanted Forest]",
        "create clones of [Wish] 10 times",
        "wait 0.5 seconds between clones"
      ],
      notes: "Add gentle wind sound."
    }
  ];

  const game_rules = ["Collect 10 wishes to win", "Avoid obstacles (lose a life)"];
  const bonus = ["Add a timer (60s) and a high-score table", "Make wishes move with sine wave motion"];

  return { title, summary, characters, scenes, game_rules, bonus_challenges: bonus };
}

/* ---------------------- Call OpenAI for structured JSON ---------------------- */
async function callOpenAIStructured(mode, inputs) {
  const prompt = buildStructuredPrompt(mode, inputs);
  try {
    const res = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You output only JSON and nothing else. Follow the user's schema exactly." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1200
      })
    });

    const j = await res.json();
    // depending on model, content may be in choices[0].message.content
    const content = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || null;
    if (!content) throw new Error("No content returned from API.");
    // try parse
    const parsed = safeJSONParse(content.trim());
    if (parsed) return { ok: true, project: parsed };
    // sometimes the model returns markdown or code fences — attempt to extract JSON substring
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const p = safeJSONParse(jsonMatch[0]);
      if (p) return { ok: true, project: p };
    }
    // fallback: return text as not JSON
    return { ok: false, text: content };
  } catch (err) {
    console.error("OpenAI error", err);
    return { ok: false, error: err.message };
  }
}

/* ---------------------- Render structured project UI ---------------------- */
function renderProjectUI(project) {
  ensureContainer();
  const titleEl = $("#projectTitle");
  const summaryEl = $("#storySummary");
  const cardsWrap = $("#cardsWrap");
  const progressText = $("#progressText");

  titleEl.innerText = project.title || "Untitled Project";
  summaryEl.innerText = project.summary || "";

  cardsWrap.innerHTML = "";

  const allSteps = [];
  // characters
  if (Array.isArray(project.characters)) {
    project.characters.forEach((c, ci) => {
      const card = createEl("div", { class: "card character-card" });
      const img = createEl("img", { class: "sprite-icon", src: c.sprite_url || "", alt: c.name || "character" });
      img.onerror = () => img.style.display = "none";
      card.appendChild(img);
      card.appendChild(createEl("h3", {}, c.name || `Character ${ci+1}`));
      card.appendChild(createEl("p", { class: "muted" }, c.personality || ""));
      // blocks container
      const blockWrap = createEl("div", { class: "blocks-wrap" });
      const pre = createEl("pre", { class: "blocks" }, (c.blocks||[]).join("\n"));
      blockWrap.appendChild(pre);
      // copy & animate buttons
      const btnCopy = createEl("button", { class: "copy-btn" }, "Copy Blocks");
      btnCopy.addEventListener("click", () => {
        navigator.clipboard.writeText((c.blocks||[]).join("\n")).then(()=> {
          btnCopy.innerText = "Copied ✅";
          setTimeout(()=>btnCopy.innerText="Copy Blocks", 1500);
        });
      });
      const btnPreview = createEl("button", { class: "preview-btn" }, "Preview");
      btnPreview.addEventListener("click", ()=> {
        // small text preview + sound + tiny animation
        playConfetti(12);
        speak(`Previewing ${c.name}. Follow the blocks to animate this character in Scratch.`);
      });
      blockWrap.appendChild(btnCopy);
      blockWrap.appendChild(btnPreview);
      if (c.notes) blockWrap.appendChild(createEl("div", { class: "note" }, c.notes));
      card.appendChild(blockWrap);
      cardsWrap.appendChild(card);
      allSteps.push(...(c.blocks||[]));
    });
  }

  // scenes
  if (Array.isArray(project.scenes)) {
    project.scenes.forEach((s, si) => {
      const card = createEl("div", { class: "card scene-card" });
      const img = createEl("img", { class: "scene-icon", src: s.backdrop_url || "", alt: s.name || "scene" });
      img.onerror = () => img.style.display = "none";
      card.appendChild(img);
      card.appendChild(createEl("h3", {}, s.name || `Scene ${si+1}`));
      const pre = createEl("pre", { class: "blocks" }, (s.blocks||[]).join("\n"));
      const copyBtn = createEl("button", { class: "copy-btn" }, "Copy Scene Blocks");
      copyBtn.addEventListener("click", ()=> {
        navigator.clipboard.writeText((s.blocks||[]).join("\n")).then(()=> {
          copyBtn.innerText="Copied ✅";
          setTimeout(()=>copyBtn.innerText="Copy Scene Blocks", 1500);
        });
      });
      card.appendChild(pre);
      card.appendChild(copyBtn);
      if (s.notes) card.appendChild(createEl("div", { class: "note" }, s.notes));
      cardsWrap.appendChild(card);
      allSteps.push(...(s.blocks||[]));
    });
  }

  // game rules area
  if (Array.isArray(project.game_rules) && project.game_rules.length) {
    const rulesCard = createEl("div", { class: "card rules-card" },
      createEl("h3", {}, "Game Rules"),
      createEl("ul", {}, ...project.game_rules.map(r => createEl("li", {}, r)))
    );
    cardsWrap.appendChild(rulesCard);
  }

  if (Array.isArray(project.bonus_challenges) && project.bonus_challenges.length) {
    const bonusCard = createEl("div", { class: "card bonus-card" },
      createEl("h3", {}, "Bonus Challenges"),
      createEl("ul", {}, ...project.bonus_challenges.map(b => createEl("li", {}, b)))
    );
    cardsWrap.appendChild(bonusCard);
  }

  // progress: number of distinct actionable steps (rough)
  const totalSteps = allSteps.length || 1;
  progressText.innerText = `Step 0 of ${totalSteps}`;
  // attach scroll listener to update progress as user reads
  const blocks = cardsWrap.querySelectorAll(".blocks");
  function updateProgress() {
    let read = 0;
    blocks.forEach((b, idx) => {
      const rect = b.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.8) read += (b.innerText.split("\n").length || 1);
    });
    const stepCount = Math.min(totalSteps, Math.max(1, Math.round(read)));
    $("#progressText").innerText = `Step ${stepCount} of ${totalSteps}`;
  }
  window.addEventListener("scroll", updateProgress);
  // friendly badge
  showBadge("Project Generated 🎉");
}

/* ---------------------- High-level generate flow ---------------------- */
async function generateProject(mode = "story", inputs = {}) {
  clearOutputUI();
  $("#projectTitle").innerText = "Thinking... AI is building your project ✨";
  // call API
  const res = await callOpenAIStructured(mode, inputs);
  if (res.ok && res.project) {
    renderProjectUI(res.project);
    speak(`Your ${mode} project is ready. Follow the steps to build it in Scratch!`);
    playConfetti(36);
    // store last generated for quick save
    localStorage.setItem("last_project", JSON.stringify({ mode, project: res.project }));
    return res.project;
  } else if (res.ok === false && res.project === undefined && res.text) {
    // returned non-JSON text — present friendly fallback: attempt to display then make fake structured
    const text = res.text;
    $("#projectTitle").innerText = "AI returned text — showing readable output";
    $("#storySummary").innerText = text;
    // fallback: generate fake structured project on device so kids can proceed
    const fallback = fakeStructuredProject(mode, inputs);
    showBadge("Using offline builder (fallback)");
    renderProjectUI(fallback);
    return fallback;
  } else {
    // error or no response: fallback to local generator
    console.warn("OpenAI failed or returned unusable output - using fake generator.", res.error || res);
    const fallback = fakeStructuredProject(mode, inputs);
    $("#projectTitle").innerText = fallback.title;
    $("#storySummary").innerText = fallback.summary;
    renderProjectUI(fallback);
    showBadge("Offline Mode — try again later for fresh AI results");
    return fallback;
  }
}

/* ---------------------- Save & Load (full JSON objects) ---------------------- */
function saveFullProject(name, projectObj) {
  const list = JSON.parse(localStorage.getItem("savedProjects") || "[]");
  list.unshift({ id: Date.now(), name: name || projectObj.title || "Saved Project", project: projectObj, savedAt: Date.now() });
  localStorage.setItem("savedProjects", JSON.stringify(list.slice(0, 50)));
  showBadge("Saved to Shelf 💾");
  renderShelf();
}

function renderShelf() {
  // ensure shelf container exists
  let shelf = $("#savedShelf");
  if (!shelf) {
    shelf = createEl("div", { id: "savedShelf", class: "shelf" });
    document.body.appendChild(shelf);
  }
  shelf.innerHTML = "";
  const list = JSON.parse(localStorage.getItem("savedProjects") || "[]");
  if (!list.length) {
    shelf.appendChild(createEl("div", { class: "muted" }, "No saved projects yet — generate one!"));
    return;
  }
  list.forEach((s, idx) => {
    const item = createEl("div", { class: "shelf-item" },
      createEl("strong", {}, s.name),
      createEl("div", { class: "muted small" }, new Date(s.savedAt).toLocaleString()),
      createEl("div", { class: "shelf-actions" },
        createEl("button", { class: "btn-load", "data-idx": idx }, "Open"),
        createEl("button", { class: "btn-delete", "data-idx": idx }, "Delete")
      )
    );
    shelf.appendChild(item);
  });
  shelf.querySelectorAll(".btn-load").forEach(b => b.addEventListener("click", (e) => {
    const idx = e.target.dataset.idx;
    const list = JSON.parse(localStorage.getItem("savedProjects") || "[]");
    const p = list[idx];
    if (p && p.project) renderProjectUI(p.project);
  }));
  shelf.querySelectorAll(".btn-delete").forEach(b => b.addEventListener("click", (e) => {
    const idx = e.target.dataset.idx;
    const list = JSON.parse(localStorage.getItem("savedProjects") || "[]");
    list.splice(idx, 1);
    localStorage.setItem("savedProjects", JSON.stringify(list));
    renderShelf();
    showBadge("Deleted from shelf");
  }));
}

/* ---------------------- Small helpers and event wiring ---------------------- */
function getFormInputs() {
  // gracefully gather fields (works with many versions of HTML)
  const genre = ( $("#genre") && $("#genre").value ) || ($("#topicInput") && $("#topicInput").value) || "";
  const character = ( $("#mainCharacter") && $("#mainCharacter").value ) || ($("#characterInput") && $("#characterInput").value) || "";
  const setting = ( $("#setting") && $("#setting").value ) || ($("#settingInput") && $("#settingInput").value) || "";
  const difficulty = ( $("#difficulty") && $("#difficulty").value ) || ($("#difficultyInput") && $("#difficultyInput").value) || "Fun";
  const plot = ( $("#userInput") && $("#userInput").value ) || ($("#plot") && $("#plot").value) || "";
  return { genre, character, setting, difficulty, plot };
}

/* ---------------------- UI Controls hooking (tolerant to different HTML) ---------------------- */
function hookButtons() {
  // start/create button
  const startBtn = $("#startBtn");
  if (startBtn) startBtn.addEventListener("click", () => {
    // show form (if exists) otherwise generate immediately with defaults
    const inputs = getFormInputs();
    const mode = (document.querySelector('input[name="aiMode"]:checked') || {}).value || "story";
    generateProject(mode, inputs);
  });
// MODE DESCRIPTIONS (kid-friendly)
const modeDescriptions = {
  story: "Story Maker — AI builds a short plot, scenes, and step-by-step Scratch blocks to tell it. Great for starting a fun story!",
  game: "Game Maker — AI gives gameplay rules, scoring, enemy behaviour, and exact Scratch block steps to make a playable game.",
  character: "Character Builder — AI creates names, personalities, sprite ideas and exact animation blocks to bring a character to life.",
  scene: "Scene Builder — AI provides backdrop ideas, sprite interactions and blocks for staging scenes and dialogue."
};

function updateModeDescription(selectedMode) {
  const text = modeDescriptions[selectedMode] || "Choose a mode to see a quick tip.";
  const el = document.getElementById('modeDescriptionText');
  if (el) el.innerText = text;
}

// wire up radio/cards (works for radio inputs or clickable cards)
document.addEventListener('click', (e) => {
  const card = e.target.closest('.mode-card');
  if (card && card.dataset.mode) {
    updateModeDescription(card.dataset.mode);
  }
});
document.querySelectorAll('input[name="aiMode"]').forEach(r => {
  r.addEventListener('change', (ev) => updateModeDescription(ev.target.value));
});

// set default description on load
const defaultMode = (document.querySelector('input[name="aiMode"]:checked') || {}).value || 'story';
updateModeDescription(defaultMode);

  // generate button(s)
  const genBtn = $("#generateBtn") || $("#generateBtnAlt");
  if (genBtn) genBtn.addEventListener("click", () => {
    const inputs = getFormInputs();
    const mode = (document.querySelector('input[name="aiMode"]:checked') || {}).value || "story";
    generateProject(mode, inputs);
  });

  // surprise
  const surprise = $("#surpriseBtn");
  if (surprise) surprise.addEventListener("click", () => {
    // set some inputs randomly and generate
    const random = fakeStructuredProject("story", { character: "Spark", setting: "Cloud Village", plot: "collects lost stars" });
    // directly render the fake structured one as quick surprise (then attempt real AI)
    renderProjectUI(random);
    // also attempt a real AI generation in background
    const inputs = getFormInputs();
    const mode = (document.querySelector('input[name="aiMode"]:checked') || {}).value || "story";
    generateProject(mode, inputs);
  });

  // save button (if present)
  const saveBtn = $("#saveProject");
  if (saveBtn) saveBtn.addEventListener("click", () => {
    const last = localStorage.getItem("last_project");
    if (last) {
      const obj = JSON.parse(last).project;
      const name = prompt("Save project as:", obj.title || "My Project");
      saveFullProject(name, obj);
    } else {
      alert("No project to save yet. Generate one first!");
    }
  });

  // open shelf
  const openShelfBtn = $("#openShelf");
  if (openShelfBtn) openShelfBtn.addEventListener("click", () => {
    renderShelf();
    const s = $("#savedShelf");
    if (s) s.scrollIntoView({ behavior: "smooth" });
  });

  // TTS read button
  const ttsBtn = $("#readStoryBtn") || $("#playTTS");
  if (ttsBtn) ttsBtn.addEventListener("click", () => {
    const txt = ($("#storySummary") && $("#storySummary").innerText) || ($("#projectOutput") && $("#projectOutput").innerText) || "Your project is ready!";
    speak(txt);
  });

  // register basic service worker if available
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      if (!regs || !regs.length) {
        navigator.serviceWorker.register('/sw.js').catch(()=>{/*no-op*/});
      }
    }).catch(()=>{/*no-op*/});
  }
}

/* ---------------------- Init on load ---------------------- */
(function init() {
  // ensure base UI exists
  ensureContainer();
  hookButtons();
  renderShelf();

  // if there was a last project stored, load it into UI automatically
  const last = localStorage.getItem("last_project");
  if (last) {
    try {
      const p = JSON.parse(last).project;
      if (p) {
        // don't auto-render to avoid spam; show small "Continue" badge
        const contBtn = createEl("button", { class: "continue-btn" }, "Continue last project");
        contBtn.addEventListener("click", () => renderProjectUI(p));
        document.body.appendChild(contBtn);
      }
    } catch (e) {/* ignore */}
  }

  // minor UI polish: keyboard shortcut G to generate (for testers)
  document.addEventListener("keydown", e => {
    if (e.key.toLowerCase() === "g" && (e.ctrlKey || e.metaKey)) {
      const inputs = getFormInputs();
      const mode = (document.querySelector('input[name="aiMode"]:checked') || {}).value || "story";
      generateProject(mode, inputs);
    }
  });

  // small "first-run" badge for kids
  if (!localStorage.getItem("seen_welcome")) {
    showBadge("Welcome! Press Start to build your first project 🎉");
    localStorage.setItem("seen_welcome", "1");
  }
})();


// install banner logic (works with your existing deferredPrompt flow)
const installBanner = document.getElementById('installBanner');
const closeInstall = document.getElementById('closeInstall');
const openInstallBtn = document.getElementById('openInstallBtn');
const installAppBtn = document.getElementById('installAppBtn');
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // show banner and hide the small icon (or show it if closed)
  installBanner.style.display = 'flex';
  openInstallBtn.classList.add('hidden');
});

closeInstall?.addEventListener('click', () => {
  installBanner.style.display = 'none';
  openInstallBtn.classList.remove('hidden'); // show the small icon so user can re-open
});

openInstallBtn?.addEventListener('click', () => {
  // if user previously dismissed, re-open banner
  installBanner.style.display = 'flex';
  openInstallBtn.classList.add('hidden');
});

installAppBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  if (choice.outcome === 'accepted') {
    installBanner.style.display = 'none';
    openInstallBtn.classList.add('hidden');
  } else {
    // keep small icon visible so they can try again later
    installBanner.style.display = 'none';
    openInstallBtn.classList.remove('hidden');
  }
});

/* ===========================
   End of upgraded script.js
   Replace OPENAI_KEY and you're ready!
   =========================== */
