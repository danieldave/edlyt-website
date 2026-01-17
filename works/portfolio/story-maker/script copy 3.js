/* -----------------------------
   GLOBAL VARIABLES
----------------------------- */
let deferredPrompt = null;
let projects = JSON.parse(localStorage.getItem("scratchProjects") || "[]");

/* -----------------------------
   INSTALL BANNER LOGIC
----------------------------- */
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  document.getElementById("installBanner").style.display = "flex";
  document.getElementById("openInstallBtn").classList.add("hidden");
});

document.getElementById("closeInstall").addEventListener("click", () => {
  document.getElementById("installBanner").style.display = "none";
  document.getElementById("openInstallBtn").classList.remove("hidden");
});

document.getElementById("openInstallBtn").addEventListener("click", () => {
  document.getElementById("installBanner").style.display = "flex";
  document.getElementById("openInstallBtn").classList.add("hidden");
});

document.getElementById("installAppBtn").addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;

  if (outcome === "accepted") {
    document.getElementById("installBanner").style.display = "none";
  }

  deferredPrompt = null;
});

/* -----------------------------
   MODE DESCRIPTION
----------------------------- */
const modeText = {
  story: "Create full Scratch stories with plot, characters, and scenes.",
  game: "Generate Scratch game ideas, rules, mechanics, and sprites.",
  character: "Build unique characters with backstories and Scratch costumes.",
  scene: "Create scenes, environments, backgrounds, and world settings."
};

document.querySelectorAll("input[name='aiMode']").forEach(radio => {
  radio.addEventListener("change", () => {
    const val = radio.value;
    document.getElementById("modeDescriptionText").innerText = modeText[val];
  });
});

/* -----------------------------
   SURPRISE ME
----------------------------- */
document.getElementById("surpriseBtn").addEventListener("click", () => {
  const randomIdeas = [
    "A cat exploring a candy planet",
    "A robot who learns emotions",
    "A magical pencil that changes the world",
    "A girl who jumps through dreams",
    "A flying turtle racing in the sky"
  ];
  document.getElementById("userInput").value =
    randomIdeas[Math.floor(Math.random() * randomIdeas.length)];
});

/* -----------------------------
   START CREATING BUTTON SCROLL
----------------------------- */
document.getElementById("startBtn").addEventListener("click", () => {
  document.querySelector(".mode-selector").scrollIntoView({ behavior: "smooth" });
});

/* -----------------------------
   MAIN AI CALL (Using Vercel Proxy)
----------------------------- */
async function callAI(mode, genre, character, setting, difficulty, userIdea) {
  try {
    const prompt = `
Mode: ${mode}
Genre: ${genre}
Main Character: ${character}
Setting: ${setting}
Difficulty: ${difficulty}

User Idea: ${userIdea}

Return a creative JSON object with:
- title
- description
- scratch_blocks (list of suggested blocks)
- sprites
- scenes
- how_to_build
- fun_twist
`;

    document.getElementById("output").innerHTML =
      `<p class="loading">✨ Generating your amazing project…</p>`;

    const response = await fetch("/api/openai-proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You output only JSON. No explanation." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const result = await response.json();

    document.getElementById("output").innerHTML =
      `<pre>${JSON.stringify(result, null, 2)}</pre>`;

    return result;

  } catch (err) {
    document.getElementById("output").innerHTML =
      `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

/* -----------------------------
   GENERATE PROJECT
----------------------------- */
document.getElementById("generateBtn").addEventListener("click", async () => {
  const mode = document.querySelector("input[name='aiMode']:checked").value;
  const genre = document.getElementById("genre").value || "Any";
  const mainCharacter = document.getElementById("mainCharacter").value || "Unknown hero";
  const setting = document.getElementById("setting").value || "Any world";
  const difficulty = document.getElementById("difficulty").value;
  const userIdea = document.getElementById("userInput").value;

  const project = await callAI(mode, genre, mainCharacter, setting, difficulty, userIdea);
});

/* -----------------------------
   SAVE PROJECT
----------------------------- */
document.getElementById("saveProject").addEventListener("click", () => {
  const content = document.getElementById("output").innerText;
  if (!content || content.includes("Your AI project will appear here")) {
    alert("Generate a project first!");
    return;
  }

  projects.push(content);
  localStorage.setItem("scratchProjects", JSON.stringify(projects));
  alert("Saved to your Shelf! 📚");
});

/* -----------------------------
   OPEN SHELF
----------------------------- */
document.getElementById("openShelf").addEventListener("click", () => {
  const shelf = document.getElementById("projectShelf");
  shelf.innerHTML = "";

  projects.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "shelf-item";
    div.innerHTML = `
      <strong>Project ${i + 1}</strong>
      <pre style="text-align:left; font-size:12px;">${item}</pre>
    `;
    shelf.appendChild(div);
  });

  shelf.scrollIntoView({ behavior: "smooth" });
});

/* -----------------------------
   READ STORY (TTS)
----------------------------- */
document.getElementById("readStoryBtn").addEventListener("click", () => {
  const text = document.getElementById("output").innerText;
  if ("speechSynthesis" in window) {
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  } else {
    alert("Your browser does not support speech!");
  }
});
