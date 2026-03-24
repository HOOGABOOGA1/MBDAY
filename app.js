const config = window.birthdayConfig;

const state = {
  experienceStarted: false,
  quoteIndex: 0,
  clickEffectIndex: 0,
  timelineTick: null,
  ambientTick: null,
  timelineStart: null,
  completedMoments: new Set(),
  synthMode: false,
  audioContext: null,
  synthInterval: null,
  game: {
    active: false,
    score: 0,
    timeLeft: config.game.duration,
    spawner: null,
    timer: null
  }
};

const ui = {
  startScreen: document.getElementById("startScreen"),
  startTitle: document.getElementById("startTitle"),
  startMessage: document.getElementById("startMessage"),
  startExperience: document.getElementById("startExperience"),
  peekButton: document.getElementById("peekButton"),
  heroTitle: document.getElementById("heroTitle"),
  heroLine: document.getElementById("heroLine"),
  heroIntro: document.getElementById("heroIntro"),
  coreName: document.getElementById("coreName"),
  musicStatus: document.getElementById("musicStatus"),
  progressLabel: document.getElementById("progressLabel"),
  chapterTrack: document.getElementById("chapterTrack"),
  photoGallery: document.getElementById("photoGallery"),
  tributePhotoShell: document.getElementById("tributePhotoShell"),
  tributeName: document.getElementById("tributeName"),
  tributeMemory: document.getElementById("tributeMemory"),
  tributeQuote: document.getElementById("tributeQuote"),
  petGallery: document.getElementById("petGallery"),
  quoteStack: document.getElementById("quoteStack"),
  finaleNote: document.getElementById("finaleNote"),
  effectLayer: document.getElementById("effectLayer"),
  toastStack: document.getElementById("toastStack"),
  starfield: document.getElementById("starfield"),
  musicToggle: document.getElementById("musicToggle"),
  burstButton: document.getElementById("burstButton"),
  wishButton: document.getElementById("wishButton"),
  quoteButton: document.getElementById("quoteButton"),
  finaleButton: document.getElementById("finaleButton"),
  letterButton: document.getElementById("letterButton"),
  gameStartButton: document.getElementById("gameStartButton"),
  gameBoard: document.getElementById("gameBoard"),
  gameOverlay: document.getElementById("gameOverlay"),
  gameScore: document.getElementById("gameScore"),
  gameTimer: document.getElementById("gameTimer"),
  gameGoal: document.getElementById("gameGoal"),
  gameResult: document.getElementById("gameResult")
};

const totalTimelineSeconds = 120;
const synthSequence = [440, 554.37, 659.25, 587.33, 523.25, 659.25, 739.99, 659.25];

let bgmAudio = null;

function init() {
  renderStaticContent();
  buildStarfield();
  setupRevealObserver();
  attachEvents();
}

function renderStaticContent() {
  const joinedNames = config.names.join(" / ");

  ui.startTitle.textContent = `For ${joinedNames}`;
  ui.startMessage.textContent = config.dedication;
  ui.heroTitle.textContent = `For ${joinedNames}`;
  ui.heroLine.textContent = config.title;
  ui.heroIntro.textContent = config.intro;
  ui.coreName.textContent = joinedNames;
  ui.tributeName.textContent = config.passedPet.name;
  ui.tributeMemory.textContent = config.passedPet.memory;
  ui.tributeQuote.textContent = config.passedPet.quote;
  ui.finaleNote.textContent = config.finaleNote;
  ui.gameGoal.textContent = String(config.game.goal);
  ui.gameTimer.textContent = `${config.game.duration}s`;

  renderTimeline();
  renderGallery();
  renderTribute();
  renderPets();
  renderQuotes();
}

function renderTimeline() {
  ui.chapterTrack.innerHTML = config.timelineMoments
    .map(
      (moment, index) => `
        <article class="chapter-card" data-moment-index="${index}" data-time="${moment.time}">
          <span class="chapter-time">${moment.label}</span>
          <h3>${moment.title}</h3>
          <p>${moment.description}</p>
        </article>
      `
    )
    .join("");
}

function renderGallery() {
  ui.photoGallery.innerHTML = config.memories
    .map(
      (memory) => `
        <article class="photo-card">
          ${renderMediaFrame(memory.src, memory.alt, memory.title)}
          <div class="card-copy">
            <h3>${memory.title}</h3>
            <p>${memory.caption}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderTribute() {
  ui.tributePhotoShell.innerHTML = renderMediaFrame(
    config.passedPet.photo,
    config.passedPet.name,
    config.passedPet.name,
    true
  );
}

function renderPets() {
  ui.petGallery.innerHTML = config.pets
    .map(
      (pet) => `
        <article class="pet-card">
          ${renderMediaFrame(pet.photo, pet.name, pet.name)}
          <div class="card-copy">
            <h3>${pet.name}</h3>
            <p>${pet.note}</p>
          </div>
        </article>
      `
    )
    .join("");
}

function renderQuotes() {
  ui.quoteStack.innerHTML = config.quotes
    .map(
      (quote, index) => `
        <article class="quote-card ${index === 0 ? "active" : ""}" data-quote-index="${index}">
          <p>"${quote}"</p>
          <footer>for ${config.names[0]}</footer>
        </article>
      `
    )
    .join("");
}

function renderMediaFrame(src, alt, label) {
  return `
    <div class="media-frame">
      <img src="${src}" alt="${alt}" loading="lazy">
      <div class="media-placeholder">
        <strong>${label}</strong>
        <span>Add the real image file here:</span>
        <code>${src}</code>
      </div>
    </div>
  `;
}

function buildStarfield() {
  const stars = Array.from({ length: 42 }, (_, index) => {
    const star = document.createElement("span");
    star.style.setProperty("--size", `${Math.random() * 0.35 + 0.1}rem`);
    star.style.setProperty("--left", `${Math.random() * 100}%`);
    star.style.setProperty("--top", `${Math.random() * 100}%`);
    star.style.setProperty("--duration", `${Math.random() * 4 + 2.5}s`);
    star.style.setProperty("--delay", `${index * 0.18}s`);
    return star;
  });

  ui.starfield.replaceChildren(...stars);

  document.querySelectorAll(".media-frame img").forEach((img) => {
    const revealImage = () => {
      if (img.naturalWidth > 0) {
        img.parentElement.classList.add("has-image");
      }
    };

    img.addEventListener("load", revealImage);
    img.addEventListener("error", () => {
      img.removeAttribute("src");
    });

    if (img.complete) {
      revealImage();
    }
  });
}

function attachEvents() {
  ui.startExperience.addEventListener("click", startExperience);
  ui.peekButton.addEventListener("click", () => {
    spawnMagicalClickEffect(window.innerWidth / 2, window.innerHeight / 2);
    showToast(pickRandom(config.surpriseMessages));
  });
  ui.musicToggle.addEventListener("click", toggleMusic);
  ui.burstButton.addEventListener("click", () => {
    spawnCenterCelebration(16);
    showToast("The page just accepted your request for extra magic.");
  });
  ui.wishButton.addEventListener("click", () => {
    spawnCenterCelebration(12);
    showToast("A warm little birthday wish has been released.");
  });
  ui.quoteButton.addEventListener("click", cycleQuote);
  ui.finaleButton.addEventListener("click", runFinale);
  ui.letterButton.addEventListener("click", () => {
    cycleQuote();
    showToast(pickRandom(config.surpriseMessages));
  });
  ui.gameStartButton.addEventListener("click", startGame);

  document.addEventListener("click", (event) => {
    spawnMagicalClickEffect(event.clientX, event.clientY);
  });
}

function startExperience() {
  if (state.experienceStarted) {
    return;
  }

  state.experienceStarted = true;
  ui.startScreen.classList.add("hidden");
  showToast("The birthday sky is open.");
  startMusic(true);
  startTimeline();
  spawnCenterCelebration(18);
}

function startTimeline() {
  if (state.timelineTick) {
    window.clearInterval(state.timelineTick);
  }
  if (state.ambientTick) {
    window.clearInterval(state.ambientTick);
  }

  state.timelineStart = Date.now();
  state.completedMoments.clear();
  updateTimelineUI(0);
  activateTimelineMoment(0);

  state.timelineTick = window.setInterval(() => {
    const elapsedSeconds = Math.min(totalTimelineSeconds, Math.floor((Date.now() - state.timelineStart) / 1000));
    updateTimelineUI(elapsedSeconds);

    config.timelineMoments.forEach((moment, index) => {
      if (elapsedSeconds >= moment.time && !state.completedMoments.has(index)) {
        activateTimelineMoment(index);
      }
    });

    if (elapsedSeconds >= totalTimelineSeconds) {
      window.clearInterval(state.timelineTick);
      window.clearInterval(state.ambientTick);
      state.timelineTick = null;
      state.ambientTick = null;
      runFinale();
    }
  }, 250);

  state.ambientTick = window.setInterval(() => {
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    spawnMagicalClickEffect(x, y);
  }, 3200);
}

function updateTimelineUI(elapsedSeconds) {
  const progressPercent = `${(elapsedSeconds / totalTimelineSeconds) * 100}%`;
  document.documentElement.style.setProperty("--progress", progressPercent);

  const remaining = Math.max(0, totalTimelineSeconds - elapsedSeconds);
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  ui.progressLabel.textContent = `${minutes}:${seconds}`;

  if (elapsedSeconds >= 40) {
    document.body.classList.add("theme-shift-soft");
  }

  if (elapsedSeconds >= 100) {
    document.body.classList.add("theme-shift-finale");
  }
}

function activateTimelineMoment(index) {
  const cards = Array.from(document.querySelectorAll(".chapter-card"));
  const card = cards[index];
  if (!card) {
    return;
  }

  cards.forEach((item) => item.classList.remove("active"));
  card.classList.add("active");
  state.completedMoments.add(index);

  if (index > 0) {
    showToast(config.timelineMoments[index].title);
  }

  if (index === 2 || index === 5) {
    cycleQuote();
  }

  if (index === 4) {
    spawnCenterCelebration(14);
  }
}

function cycleQuote() {
  const cards = Array.from(document.querySelectorAll(".quote-card"));
  if (!cards.length) {
    return;
  }

  cards[state.quoteIndex].classList.remove("active");
  state.quoteIndex = (state.quoteIndex + 1) % cards.length;
  cards[state.quoteIndex].classList.add("active");
  showToast(config.quotes[state.quoteIndex]);
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  ui.toastStack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 5000);
}

function spawnMagicalClickEffect(x, y) {
  const effects = [
    () => spawnParticleBurst(x, y, ["var(--accent-gold)", "var(--accent-coral)"]),
    () => spawnParticleBurst(x, y, ["var(--accent-teal)", "var(--accent-sky)"]),
    () => spawnRipple(x, y),
    () => spawnMessageBubble(x, y, pickRandom(config.surpriseMessages)),
    () => spawnComet(x, y),
    () => spawnRing(x, y),
    () => {
      spawnRipple(x, y);
      spawnParticleBurst(x, y, ["#ffffff", "var(--accent-gold)"]);
    },
    () => {
      spawnMessageBubble(x, y, "happy birthday");
      spawnParticleBurst(x, y, ["var(--accent-rose)", "var(--accent-gold)"]);
    }
  ];

  const effect = effects[state.clickEffectIndex % effects.length];
  state.clickEffectIndex += 1;
  effect();
}

function spawnParticleBurst(x, y, colors) {
  for (let i = 0; i < 14; i += 1) {
    const particle = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 90 + 30;
    particle.className = "magic-particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--particle-color", pickRandom(colors));
    ui.effectLayer.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove());
  }
}

function spawnRipple(x, y) {
  const ripple = document.createElement("span");
  ripple.className = "magic-ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ui.effectLayer.appendChild(ripple);
  ripple.addEventListener("animationend", () => ripple.remove());
}

function spawnMessageBubble(x, y, message) {
  const bubble = document.createElement("span");
  bubble.className = "magic-bubble";
  bubble.style.left = `${x}px`;
  bubble.style.top = `${y}px`;
  bubble.textContent = message;
  ui.effectLayer.appendChild(bubble);
  bubble.addEventListener("animationend", () => bubble.remove());
}

function spawnComet(x, y) {
  const comet = document.createElement("span");
  const angle = `${Math.random() * 110 - 55}deg`;
  comet.className = "magic-comet";
  comet.style.left = `${x}px`;
  comet.style.top = `${y}px`;
  comet.style.setProperty("--angle", angle);
  comet.style.setProperty("--comet-x", `${Math.random() * 220 + 70}px`);
  comet.style.setProperty("--comet-y", `${Math.random() * 90 - 45}px`);
  ui.effectLayer.appendChild(comet);
  comet.addEventListener("animationend", () => comet.remove());
}

function spawnRing(x, y) {
  const ring = document.createElement("span");
  ring.className = "magic-ring";
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ui.effectLayer.appendChild(ring);
  ring.addEventListener("animationend", () => ring.remove());
}

function spawnCenterCelebration(count) {
  for (let i = 0; i < count; i += 1) {
    window.setTimeout(() => {
      const x = window.innerWidth / 2 + Math.random() * 140 - 70;
      const y = window.innerHeight / 2 + Math.random() * 90 - 45;
      spawnParticleBurst(x, y, [
        "var(--accent-gold)",
        "var(--accent-teal)",
        "var(--accent-coral)",
        "var(--accent-rose)"
      ]);
    }, i * 45);
  }
}

function startMusic(userInitiated = false) {
  if (!bgmAudio) {
    bgmAudio = new Audio(config.music.file);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.58;
    bgmAudio.addEventListener("error", () => {
      if (!state.synthMode) {
        startSynthMusic(userInitiated);
      }
    });
  }

  bgmAudio
    .play()
    .then(() => {
      state.synthMode = false;
      ui.musicToggle.textContent = "Music: custom track";
      ui.musicToggle.setAttribute("aria-pressed", "true");
      ui.musicStatus.textContent = `Music mode: ${config.music.label}`;
    })
    .catch(() => {
      startSynthMusic(userInitiated);
    });
}

function startSynthMusic(userInitiated = false) {
  if (!userInitiated && !state.audioContext) {
    return;
  }

  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }

  if (state.synthInterval) {
    return;
  }

  state.synthMode = true;
  let step = 0;

  playSynthChord(step);
  state.synthInterval = window.setInterval(() => {
    step = (step + 1) % synthSequence.length;
    playSynthChord(step);
  }, 900);

  ui.musicToggle.textContent = "Music: synth on";
  ui.musicToggle.setAttribute("aria-pressed", "true");
  ui.musicStatus.textContent = "Music mode: built-in dreamy synth";
}

function playSynthChord(index) {
  if (!state.audioContext) {
    return;
  }

  const now = state.audioContext.currentTime;
  const notes = [synthSequence[index], synthSequence[(index + 2) % synthSequence.length]];

  notes.forEach((frequency, noteIndex) => {
    const oscillator = state.audioContext.createOscillator();
    const gainNode = state.audioContext.createGain();

    oscillator.type = noteIndex === 0 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    oscillator.detune.value = noteIndex * 7;

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.06 - noteIndex * 0.02, now + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);

    oscillator.connect(gainNode);
    gainNode.connect(state.audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.82);
  });
}

function stopMusic() {
  if (bgmAudio && !bgmAudio.paused) {
    bgmAudio.pause();
  }

  if (state.synthInterval) {
    window.clearInterval(state.synthInterval);
    state.synthInterval = null;
  }

  if (state.audioContext && state.audioContext.state === "running") {
    state.audioContext.suspend();
  }

  ui.musicToggle.textContent = "Music: paused";
  ui.musicToggle.setAttribute("aria-pressed", "false");
  ui.musicStatus.textContent = "Music mode: paused";
}

function toggleMusic() {
  const audioActive = bgmAudio && !bgmAudio.paused;
  const synthActive = Boolean(state.synthInterval);

  if (audioActive || synthActive) {
    stopMusic();
    return;
  }

  startMusic(true);
}

function startGame() {
  if (state.game.active) {
    return;
  }

  clearGameTargets();
  state.game.active = true;
  state.game.score = 0;
  state.game.timeLeft = config.game.duration;
  ui.gameScore.textContent = "0";
  ui.gameTimer.textContent = `${config.game.duration}s`;
  ui.gameResult.textContent = "";
  ui.gameOverlay.classList.add("hidden");

  state.game.spawner = window.setInterval(spawnGameTarget, 620);
  state.game.timer = window.setInterval(() => {
    state.game.timeLeft -= 1;
    ui.gameTimer.textContent = `${state.game.timeLeft}s`;

    if (state.game.timeLeft <= 0) {
      endGame(state.game.score >= config.game.goal);
    }
  }, 1000);
}

function spawnGameTarget() {
  if (!state.game.active) {
    return;
  }

  const target = document.createElement("button");
  const size = Math.floor(Math.random() * 18) + 38;
  const targetType = Math.random() > 0.45 ? "star" : "heart";
  const left = Math.max(8, Math.random() * (ui.gameBoard.clientWidth - size - 16));

  target.type = "button";
  target.className = `game-target ${targetType}`;
  target.style.width = `${size}px`;
  target.style.height = `${size}px`;
  target.style.left = `${left}px`;
  target.style.setProperty("--fall-duration", `${Math.random() * 1200 + 2300}ms`);
  target.style.setProperty("--target-rotation", targetType === "heart" ? "-45deg" : "0deg");
  target.setAttribute("aria-label", "Catch sparkle");

  target.addEventListener("click", (event) => {
    event.stopPropagation();
    scoreTarget(target);
  });

  target.addEventListener("animationend", () => {
    target.remove();
  });

  ui.gameBoard.appendChild(target);
}

function scoreTarget(target) {
  if (!state.game.active) {
    return;
  }

  state.game.score += 1;
  ui.gameScore.textContent = String(state.game.score);
  const boardRect = ui.gameBoard.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const x = targetRect.left - boardRect.left + targetRect.width / 2;
  const y = targetRect.top - boardRect.top + targetRect.height / 2;
  spawnScorePop(x, y, "+1");
  target.remove();

  if (state.game.score >= config.game.goal) {
    endGame(true);
  }
}

function spawnScorePop(x, y, text) {
  const pop = document.createElement("span");
  pop.className = "score-pop";
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  pop.textContent = text;
  ui.gameBoard.appendChild(pop);
  pop.addEventListener("animationend", () => pop.remove());
}

function clearGameTargets() {
  ui.gameBoard.querySelectorAll(".game-target, .score-pop").forEach((node) => node.remove());
}

function endGame(won) {
  state.game.active = false;
  window.clearInterval(state.game.spawner);
  window.clearInterval(state.game.timer);
  state.game.spawner = null;
  state.game.timer = null;
  clearGameTargets();
  ui.gameOverlay.classList.remove("hidden");
  ui.gameOverlay.textContent = won
    ? "You won. The stars have surrendered their secret."
    : "The sky wants a rematch. Try again for the secret note.";

  if (won) {
    ui.gameResult.textContent = "Secret unlocked: Even on hard days, you still make the world softer just by being here.ILY!";
    spawnCenterCelebration(18);
    showToast("Game won. Secret note unlocked.");
  } else {
    ui.gameResult.textContent = "Almost there. One more round and the stars will tell you something special.";
  }
}

function runFinale() {
  spawnCenterCelebration(28);
  showToast("Finale unlocked.");
  document.querySelector(".finale-panel")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function setupRevealObserver() {
  const panels = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    panels.forEach((panel) => panel.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15
    }
  );

  panels.forEach((panel) => {
    if (!panel.classList.contains("visible")) {
      observer.observe(panel);
    }
  });
}

init();
