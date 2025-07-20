



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
          currentScene = currentScene.scene ? { scene: currentScene.scene } : {};
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

function renderHistoryEntry(entry) {
  const isNarrator = entry.character?.toLowerCase() === "narrator";
  const historyEntry = document.createElement("div");
  historyEntry.className = "fade-in mb-4";

  if (isNarrator) {
    historyEntry.innerHTML = `
      <div class="text-white text-xl font-bold drop-shadow-[0_0_6px_white]">${entry.text}</div>
    `;
  } else {
    const avatar = characters[entry.character] || "";
    historyEntry.classList.add("flex", "space-x-4", "items-start");
    historyEntry.innerHTML = `
      <div class="flex-shrink-0">
        <img src="${avatar}" class="w-14 h-14 pixel-avatar object-cover">
      </div>
      <div class="flex-1">
        <div class="char-name font-['Press+Start+2P'] text-[#eb6f92]">${entry.character}</div>
        <div class="mt-1 text-[#e0def4] text-sm">${entry.text}</div>
      </div>
    `;
  }
  dialogueHistory.appendChild(historyEntry);
  dialogueHistory.scrollTop = dialogueHistory.scrollHeight;
}

function showDialogue(index) {
  const entry = story[index];
  if (!entry) return;

  if (index > 0) renderHistoryEntry(story[index - 1]);

  const isNarrator = entry.character?.toLowerCase() === "narrator";
  currentDialogue.innerHTML = "";

  if (isNarrator) {
    currentDialogue.innerHTML = `
      <div class="p-4 fade-in">
        <p id="typing-text" class="text-white text-2xl font-bold drop-shadow-[0_0_6px_white]"></p>
      </div>
    `;
  } else {
    const avatar = characters[entry.character] || "";
    currentDialogue.innerHTML = `
      <div class="flex space-x-4 p-4 fade-in">
        <div class="flex-shrink-0">
          <img src="${avatar}" class="w-16 h-16 pixel-avatar object-cover">
        </div>
        <div class="flex-1">
          <div class="char-name font-['Press+Start+2P'] text-sm text-[#eb6f92] mb-1">${entry.character}</div>
          <div id="typing-text" class="text-[#e0def4] leading-snug"></div>
        </div>
      </div>
    `;
  }

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

  localStorage.setItem("vn-progress", currentIndex);
}

let bgmStarted = false;

nextBtn.addEventListener("click", () => {
  if (!bgmStarted) {
    const currentBGM = story[currentIndex]?.bgm;
    if (currentBGM) {
      bgmPlayer.src = currentBGM;
      bgmPlayer.play().catch((e) => {
        console.warn("Autoplay blocked, but will retry on next click.");
      });
    }
    bgmStarted = true;
  }

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
  localStorage.removeItem("vn-progress");
  currentIndex = 0;
  location.reload();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#dialogue-history") && e.target.id !== "next-btn") {
    nextBtn.click();
  }
});

function getStoryFileFromURL() {
  const params = new URLSearchParams(window.location.search);
  const chap = params.get("chap");
  return chap ? `story/${chap}.txt` : "story/story.txt";
}

function waitForAudioToLoad(audio) {
  return new Promise((resolve) => {
    audio.addEventListener("canplaythrough", resolve, { once: true });
    audio.load();
  });
}

async function preloadBGMTracks(story) {
  const uniqueTracks = [...new Set(
    story.map((entry) => entry.bgm).filter((bgm) => bgm && typeof bgm === "string")
  )];

  const progressBar = document.getElementById("loading-bar");

  for (let i = 0; i < uniqueTracks.length; i++) {
    const url = uniqueTracks[i];
    const audio = new Audio(url);
    await waitForAudioToLoad(audio);
    const percent = ((i + 1) / uniqueTracks.length) * 100;
    progressBar.style.width = `${percent}%`;
  }
}

Promise.all([
  loadCharacters(),
  loadStoryFromText(getStoryFileFromURL()),
]).then(async ([charData, storyData]) => {
  characters = charData;
  story = storyData;

  await preloadBGMTracks(story);

  document.getElementById("loading-screen").style.display = "none";

  const saved = parseInt(localStorage.getItem("vn-progress"));
  if (!isNaN(saved) && saved >= 0 && saved < story.length) {
    currentIndex = saved;
  }

  if (currentIndex > 0) {
    for (let i = 0; i < currentIndex; i++) {
      renderHistoryEntry(story[i]);
    }
  }


  showDialogue(currentIndex);
});
