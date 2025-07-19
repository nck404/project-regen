const bgmPlayer = document.getElementById("bgm-player");
const dialogueHistory = document.getElementById("dialogue-history");
const currentDialogue = document.getElementById("current-dialogue");
const nextBtn = document.getElementById("next-btn");
const sceneContainer = document.getElementById("scene-container");
const sceneElement = document.getElementById("scene");

let characters = {};
let story = [];
let currentIndex = 0;

async function loadCharacters() {
  const res = await fetch("char.json");
  return await res.json();
}

async function loadStoryFromText(url) {
  const res = await fetch(url);
  const text = await res.text();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const scenes = [];
  let currentScene = {};

  for (let line of lines) {
    if (line.startsWith("#scene")) {
      currentScene.scene = line.replace("#scene", "").trim();
    } else if (line.startsWith("#music") || line.startsWith("#bgm")) {
      const music = line.split(" ")[1]?.trim();
      currentScene.bgm = music === "stop" ? null : music;
    } else if (line.startsWith("[")) {
      const match = line.match(/^\[([^\]:]+)(?::([^\]]+))?\]\s*(.+)$/);
      if (match) {
        const [_, character, emotion, text] = match;
        if (currentScene.character) {
          scenes.push({ ...currentScene });
          currentScene = currentScene.scene
            ? { scene: currentScene.scene }
            : {};
        }
        currentScene.character = character;
        currentScene.emotion = emotion || null;
        currentScene.text = text;
      }
    }
  }
  if (currentScene.character) scenes.push(currentScene);
  return scenes;
}

function playBGM(url) {
  if (!url) return;
  if (bgmPlayer.src !== location.origin + "/" + url) {
    bgmPlayer.src = url;
    bgmPlayer.play();
  }
}

function showDialogue(index) {
  const entry = story[index];
  if (!entry) return;

  if (index > 0) {
    const prev = story[index - 1];
    const avatar = characters[prev.character] || "";
    const historyEntry = document.createElement("div");
    historyEntry.className = "flex space-x-4 items-start fade-in";
    historyEntry.innerHTML = `
    <div class="flex-shrink-0">
      <img src="${avatar}" class="w-14 h-14 pixel-avatar object-cover">
    </div>
    <div class="flex-1">
      <div class="char-name font-['Press+Start+2P'] text-[#eb6f92]">${prev.character}</div>
      <div class="mt-1 text-[#e0def4] text-sm">${prev.text}</div>
    </div>
  `;
    dialogueHistory.appendChild(historyEntry);
    dialogueHistory.scrollTop = dialogueHistory.scrollHeight;
  }

  const avatar = characters[entry.character] || "";
  currentDialogue.innerHTML = `
  <div class="flex space-x-4 p-4">
    <div class="flex-shrink-0">
      <img src="${avatar}" class="w-16 h-16 pixel-avatar object-cover">
    </div>
    <div class="flex-1">
      <div class="char-name font-['Press+Start+2P'] text-sm text-[#eb6f92] mb-1">${entry.character}</div>
      <div id="typing-text" class="text-[#e0def4] leading-snug"></div>
    </div>
  </div>
`;

  const textEl = document.getElementById("typing-text");
  let i = 0;
  const fullText = entry.text;
  function typeWriter() {
    if (i < fullText.length) {
      textEl.textContent = fullText.slice(0, i + 1);
      textEl.classList.add("typing");
      i++;
      setTimeout(typeWriter, 20);
    } else {
      textEl.classList.remove("typing");
    }
  }
  typeWriter();

  if (entry.scene) {
    sceneElement.style.backgroundImage = `url('${entry.scene}')`;
    sceneContainer.classList.remove("opacity-0");
    sceneContainer.classList.add("opacity-100");
  }

  if (entry.bgm !== undefined) {
    if (entry.bgm === null) {
      bgmPlayer.pause();
      bgmPlayer.src = "";
    } else {
      playBGM(entry.bgm);
    }
  }
}

nextBtn.addEventListener("click", () => {
  currentIndex++;
  if (currentIndex < story.length) {
    showDialogue(currentIndex);
  } else {
    currentDialogue.innerHTML = `
    <div class="p-8 text-center">
      <div class="text-2xl text-[#d79921] mb-4">The End</div>
      <div class="text-[#ebdbb2]">Thank you for experiencing this story.</div>
    </div>
  `;
    nextBtn.disabled = true;
    nextBtn.classList.add("opacity-50");
  }
});

document.getElementById("reset-btn").addEventListener("click", () => {
  currentIndex = 0;
  location.reload();
});

document.addEventListener("click", (e) => {
  if (
    !e.target.closest("#dialogue-history") &&
    e.target.id !== "next-btn"
  ) {
    nextBtn.click();
  }
});

function getStoryFileFromURL() {
  const params = new URLSearchParams(window.location.search);
  const chap = params.get("chap");
  return chap ? `${chap}.txt` : "story.txt";
}

Promise.all([
  loadCharacters(),
  loadStoryFromText(getStoryFileFromURL()),
]).then(([charData, storyData]) => {
  characters = charData;
  story = storyData;
  showDialogue(currentIndex);
});