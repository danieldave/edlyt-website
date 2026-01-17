// =====================================================
// ComponentCraft AI — Supercharged Generator
// =====================================================

// ====== CONFIG ======
const OPENAI_API_KEY = "";           // ← ADD YOUR KEY HERE
const AI_MODEL = "gpt-4o-mini";      // Best speed + quality

// ====== DOM ELEMENTS ======
const examplesGrid = document.getElementById("examplesGrid");
const generateBtn = document.getElementById("generateBtn");
const promptInput = document.getElementById("promptInput");
const difficultySel = document.getElementById("difficulty");
const styleSel = document.getElementById("styleSel");
const componentTitle = document.getElementById("componentTitle");

const htmlView = document.getElementById("htmlView");
const cssView = document.getElementById("cssView");
const jsView = document.getElementById("jsView");
const mockView = document.getElementById("mockView");
const notesView = document.getElementById("notesView");

const previewView = document.getElementById("previewView");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const tabs = document.querySelectorAll(".tab");

let currentComponent = null;
let commentsOn = true;

// ====== 20 Prebuilt Example Placeholders (AI fills them later) ======
const components = [
  { componentName: "Responsive Navbar" },
  { componentName: "Student Portfolio Card" },
  { componentName: "Pricing Section" },
  { componentName: "Hero Banner" },
  { componentName: "Login Form" },
  { componentName: "Signup Form" },
  { componentName: "Testimonial Card" },
  { componentName: "Team Section" },
  { componentName: "FAQ Accordion" },
  { componentName: "Footer Block" },
  { componentName: "Dashboard Sidebar" },
  { componentName: "Analytics Card" },
  { componentName: "Feature Grid" },
  { componentName: "Contact Form" },
  { componentName: "Gallery Grid" },
  { componentName: "Blog Card" },
  { componentName: "Call to Action Box" },
  { componentName: "Notification Toast" },
  { componentName: "Stats Widget" },
  { componentName: "Profile Header" }
];

// ====== Render Example Buttons ======
components.forEach((c, idx) => {
  const btn = document.createElement("button");
  btn.className = "example-btn";
  btn.innerHTML = `<strong>${c.componentName}</strong><small>AI generated on click</small>`;
  btn.addEventListener("click", () => generateFromExample(c.componentName));
  examplesGrid.appendChild(btn);
});

// ====== Tabs Switching ======
tabs.forEach((t) =>
  t.addEventListener("click", () => {
    document.querySelector(".tab.active").classList.remove("active");
    t.classList.add("active");
    showTab(t.dataset.tab);
  })
);

function showTab(name) {
  ["preview", "html", "css", "js", "mock", "notes"].forEach((k) => {
    document.getElementById(k + "View").style.display = k === name ? "block" : "none";
  });

  if (name === "preview" && currentComponent) renderPreview(currentComponent);
}

// =====================================================
// PERFECTED OPENAI GENERATION ENGINE
// =====================================================

async function callOpenAI(prompt) {
  const difficulty = difficultySel.value;
  const style = styleSel.value;

  const systemPrompt = `
You are ComponentCraft AI, a senior frontend engineer.
You output ONLY valid JSON with keys:
- html
- css
- js
- mockData
- notes

Rules:
- HTML must be self-contained, production-ready, and easy for beginners.
- CSS must be clean, modern, mobile-first.
- JS must be optional; include only if necessary.
- mockData must contain sample data used.
- notes must explain how to edit the component.
- DO NOT escape quotes.
- NO markdown.
- NO backticks.
- NO explanations outside JSON.
`;

  const userPrompt = `
Generate a ${difficulty}-level FRONTEND component using style "${style}".
Component description: ${prompt}

Return ONLY raw JSON, no formatting.
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.6,
      max_tokens: 2000
    })
  });

  const data = await res.json();

  let raw = data.choices?.[0]?.message?.content || "{}";

  // SAFE JSON EXTRACTION
  raw = extractJSON(raw);

  return JSON.parse(raw);
}

// Extract JSON even if the model adds noise
function extractJSON(text) {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1) return "{}";
  return text.substring(first, last + 1);
}

// =====================================================
// GENERATION HANDLER
// =====================================================

async function generateFromExample(name) {
  promptInput.value = name;
  generateBtn.click();
}

generateBtn.addEventListener("click", async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) return alert("Type something!");

  componentTitle.textContent = "Generating...";
  htmlView.textContent = cssView.textContent = jsView.textContent = "";
  mockView.textContent = notesView.textContent = "";
  renderPreview({ html: "<p style='padding:20px'>Loading…</p>", css: "", js: "" });

  try {
    const result = await callOpenAI(prompt);

    currentComponent = {
      componentName: prompt,
      html: result.html || "",
      css: result.css || "",
      js: result.js || "",
      mockData: result.mockData || {},
      notes: result.notes || []
    };

    htmlView.textContent = currentComponent.html;
    cssView.textContent = currentComponent.css;
    jsView.textContent = currentComponent.js;
    mockView.textContent = JSON.stringify(currentComponent.mockData, null, 2);
    // Normalize notes to always be an array
    let notes = currentComponent.notes;

    if (typeof notes === "string") {
    notes = [notes];
    }
    if (!Array.isArray(notes)) {
    notes = ["No notes provided."];
    }

    notesView.textContent = notes.map((n) => "- " + n).join("\n");

    componentTitle.textContent = prompt;
    showTab("preview");
  } catch (err) {
    console.error(err);
    alert("❌ AI failed to generate component");
    componentTitle.textContent = "Error generating";
  }
});

// =====================================================
// PREVIEW ENGINE
// =====================================================
function renderPreview(c) {
  previewView.innerHTML = "";
  const frame = document.createElement("iframe");
  frame.style.width = "100%";
  frame.style.height = "100%";
  frame.setAttribute("sandbox", "allow-scripts allow-same-origin");

  previewView.appendChild(frame);
  const doc = frame.contentDocument;

  doc.open();
  doc.write(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body { font-family: Inter, system-ui; padding:20px; background:white; }
${c.css}
</style>
</head>
<body>
${c.html}
<script>${c.js}</script>
</body>
</html>
`);
  doc.close();
}

// =====================================================
// COPY CODE
// =====================================================
copyBtn.addEventListener("click", async () => {
  if (!currentComponent) return alert("Nothing to copy");

  const payload = `
<!-- ${currentComponent.componentName} -->
${currentComponent.html}

<style>
${currentComponent.css}
</style>

<script>
${currentComponent.js}
</script>
`;

  await navigator.clipboard.writeText(payload);
  alert("Copied!");
});

// =====================================================
// DOWNLOAD
// =====================================================
downloadBtn.addEventListener("click", () => {
  if (!currentComponent) return alert("Nothing to download");

  const zipContent = `
--- index.html ---
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${currentComponent.css}</style>
</head>
<body>
${currentComponent.html}
<script>${currentComponent.js}</script>
</body>
</html>
`;

  const blob = new Blob([zipContent], { type: "application/zip" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${currentComponent.componentName.replace(/\s+/g, "-")}.zip`;
  a.click();
});

// =====================================================
console.log("ComponentCraft AI loaded ✔");
