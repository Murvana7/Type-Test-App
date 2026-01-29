const quoteApiUrl = "https://zenquotes.io/api/random";
const quoteSection = document.getElementById("quote");
const userInput = document.getElementById("quote-input");

let quote = "";
let time = 60;
let timer = null;
let mistakes = 0;

// -------------------- Difficulty Quotes --------------------
const easyQuotes = [
  "The quick brown fox jumps over the lazy dog.",
  "Practice makes progress.",
  "Focus on accuracy first.",
  "Slow typing builds speed.",
  "Stay calm and keep typing.",
  "Good habits create results.",
  "Every key press matters.",
  "Typing is a useful skill.",
  "Small steps lead forward.",
  "Consistency brings success.",
  "Accuracy beats speed.",
  "Relax and type carefully.",
  "Learning takes patience.",
  "Practice every single day.",
  "Mistakes help you improve."
];

const mediumQuotes = [
  "Typing speed improves naturally when accuracy becomes consistent.",
  "Small improvements repeated daily create strong long term skills.",
  "Discipline will take you further than motivation ever can.",
  "Focus on clean input instead of rushing the clock.",
  "Accuracy today leads to speed tomorrow.",
  "Good habits build reliable performance over time.",
  "Progress feels slow until it suddenly becomes obvious.",
  "Typing is a rhythm that improves with steady practice.",
  "Staying relaxed helps reduce unnecessary mistakes.",
  "Repetition builds muscle memory and confidence.",
  "Speed grows when mistakes are controlled.",
  "Calm focus produces better typing results.",
  "Consistency matters more than raw talent.",
  "Correct practice leads to lasting improvement.",
  "Skills compound quietly before they show results."
];

const hardQuotes = [
  "Consistency compounds silently until the accumulated effort produces undeniable results.",
  "True improvement comes from deliberate practice focused on precision rather than speed.",
  "Mastery is built through disciplined repetition of correct technique over extended periods.",
  "High performance typing requires calm focus, controlled breathing, and deliberate accuracy.",
  "Speed achieved without accuracy creates instability and reinforces incorrect muscle memory.",
  "Sustainable progress depends on patience, structure, and consistent feedback loops.",
  "Advanced skill development demands attention to detail under increasing cognitive load.",
  "Efficiency emerges when effort is reduced through optimized movement and awareness.",
  "Complex skills improve fastest when fundamentals are reinforced under pressure.",
  "Long term excellence is the product of systems, not bursts of motivation.",
  "Training slowly with precision produces faster and more reliable execution.",
  "Cognitive clarity improves when distractions are removed and focus is sustained.",
  "Expert performance results from thousands of small correct decisions.",
  "Stress reveals the quality of your preparation.",
  "Control under pressure separates advanced practitioners from beginners."
];

let currentDifficulty = "medium"; // "easy" | "medium" | "hard"

// -------------------- XP + Levels --------------------
let xp = 0;
let level = 1;

function xpToNextLevel(lvl) {
  return 100 + (lvl - 1) * 40; // 100, 140, 180...
}

function updateLevelUI() {
  const levelEl = document.getElementById("level");
  const xpEl = document.getElementById("xp");
  const xpNextEl = document.getElementById("xp-next");
  const xpGainedEl = document.getElementById("xp-gained");

  if (levelEl) levelEl.innerText = level;
  if (xpEl) xpEl.innerText = xp;
  if (xpNextEl) xpNextEl.innerText = xpToNextLevel(level);
  if (xpGainedEl) xpGainedEl.innerText = ""; // clear per run
}

function difficultyMultiplier() {
  if (currentDifficulty === "easy") return 1.0;
  if (currentDifficulty === "hard") return 1.6;
  return 1.3; // medium
}

function addXP(wpm, accuracy) {
  const base = (wpm * 1.2) + (accuracy * 0.8);
  const accuracyFactor = accuracy < 70 ? 0.5 : accuracy < 85 ? 0.8 : 1.0;

  const gained = Math.max(
    0,
    Math.round(base * difficultyMultiplier() * accuracyFactor)
  );

  xp += gained;

  while (xp >= xpToNextLevel(level)) {
    xp -= xpToNextLevel(level);
    level++;
  }

  localStorage.setItem("xp", String(xp));
  localStorage.setItem("level", String(level));
  updateLevelUI();

  const xpGainedEl = document.getElementById("xp-gained");
  if (xpGainedEl) xpGainedEl.innerText = "+" + gained + " XP";

  return gained;
}

// -------------------- Difficulty handling --------------------
function getQuoteByDifficulty() {
  if (currentDifficulty === "easy") return easyQuotes;
  if (currentDifficulty === "hard") return hardQuotes;
  return mediumQuotes;
}

function renderQuoteToScreen(text) {
  quote = text;
  quoteSection.innerHTML = quote
    .split("")
    .map(ch => `<span class="quote-chars">${ch}</span>`)
    .join("");
}

// Set difficulty (NO event.target bugs)
function setDifficulty(level) {
  currentDifficulty = level;

  // highlight active (if you added .difficulty buttons)
  document.querySelectorAll(".difficulty button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.level === level);
  });

  // reset state
  clearInterval(timer);
  timer = null;
  time = 60;
  mistakes = 0;

  document.getElementById("mistakes").innerText = "0";
  document.getElementById("timer").innerText = "0s";
  document.querySelector(".result").style.display = "none";

  userInput.value = "";
  userInput.disabled = true;

  document.getElementById("start-test").style.display = "block";
  document.getElementById("stop-test").style.display = "none";

  renderNewQuote();
}

// -------------------- Quote loader (API then fallback) --------------------
const renderNewQuote = async () => {
  try {
    quoteSection.innerHTML = "Loading...";

    const response = await fetch(quoteApiUrl);
    if (!response.ok) throw new Error("HTTP " + response.status);

    const data = await response.json();
    const apiQuote = data?.[0]?.q;

    if (!apiQuote) throw new Error("Bad API format");
    renderQuoteToScreen(apiQuote);
  } catch (err) {
    console.error("Quote fetch failed:", err);
    const quotes = getQuoteByDifficulty();
    const fallback = quotes[Math.floor(Math.random() * quotes.length)];
    renderQuoteToScreen(fallback);
  }
};

// -------------------- Typing logic --------------------
userInput.addEventListener("input", () => {
  const quoteChars = Array.from(document.querySelectorAll(".quote-chars"));
  let userInputChars = userInput.value.split("");

  if (userInputChars.length > quoteChars.length) {
    userInputChars = userInputChars.slice(0, quoteChars.length);
    userInput.value = userInputChars.join("");
  }

  quoteChars.forEach((char, index) => {
    const typedChar = userInputChars[index];

    if (typedChar == null) {
      char.classList.remove("success", "fail");
      return;
    }

    if (char.innerText === typedChar) {
      char.classList.add("success");
      char.classList.remove("fail");
    } else {
      if (!char.classList.contains("fail")) {
        mistakes++;
        document.getElementById("mistakes").innerText = String(mistakes);
      }
      char.classList.add("fail");
      char.classList.remove("success");
    }
  });

  if (quoteChars.length > 0 && quoteChars.every(el => el.classList.contains("success"))) {
    displayResult();
  }
});

// -------------------- Timer --------------------
function updateTimer() {
  if (time === 0) {
    displayResult();
  } else {
    document.getElementById("timer").innerText = --time + "s";
  }
}

const timeReduce = () => {
  clearInterval(timer);
  time = 60;
  document.getElementById("timer").innerText = "60s";
  timer = setInterval(updateTimer, 1000);
};

// -------------------- End test --------------------
const displayResult = () => {
  document.querySelector(".result").style.display = "block";
  clearInterval(timer);
  timer = null;

  document.getElementById("stop-test").style.display = "none";
  userInput.disabled = true;

  const secondsTaken = 60 - time;
  const minutesTaken = Math.max(secondsTaken / 60, 1 / 60);

  const wpm = Number((userInput.value.length / 5 / minutesTaken).toFixed(2));
  document.getElementById("wpm").innerText = wpm + " wpm";

  const typedLen = userInput.value.length;
  const accuracy = typedLen > 0
    ? Math.max(0, Math.round(((typedLen - mistakes) / typedLen) * 100))
    : 0;
  document.getElementById("accuracy").innerText = accuracy + "%";

  addXP(wpm, accuracy);
};

// -------------------- Start test --------------------
const startTest = () => {
  mistakes = 0;
  document.getElementById("mistakes").innerText = "0";

  clearInterval(timer);
  timer = null;

  userInput.disabled = false;
  userInput.value = "";
  document.querySelector(".result").style.display = "none";

  renderNewQuote();
  timeReduce();

  document.getElementById("start-test").style.display = "none";
  document.getElementById("stop-test").style.display = "block";
};

// -------------------- On load --------------------
window.onload = () => {
  userInput.value = "";
  userInput.disabled = true;

  document.getElementById("timer").innerText = "0s";
  document.getElementById("mistakes").innerText = "0";

  document.getElementById("start-test").style.display = "block";
  document.getElementById("stop-test").style.display = "none";
  document.querySelector(".result").style.display = "none";

  // load saved XP/level
  xp = Number(localStorage.getItem("xp")) || 0;
  level = Number(localStorage.getItem("level")) || 1;
  updateLevelUI();

  // If you added difficulty buttons with data-level, set default highlight
  document.querySelectorAll(".difficulty button").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.level === currentDifficulty);
  });

  renderNewQuote();
};
