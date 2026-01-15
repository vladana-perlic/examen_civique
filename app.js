const setupPanel = document.getElementById("setupPanel");
const quizPanel = document.getElementById("quizPanel");
const resultPanel = document.getElementById("resultPanel");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const redoWrongBtn = document.getElementById("redoWrongBtn");
const backBtn = document.getElementById("backBtn");
const skipBtn = document.getElementById("skipBtn");
const submitBtn = document.getElementById("submitBtn");
const nextBtn = document.getElementById("nextBtn");

const timerValue = document.getElementById("timerValue");
const timerMeta = document.getElementById("timerMeta");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const questionMeta = document.getElementById("questionMeta");
const questionText = document.getElementById("questionText");
const optionsForm = document.getElementById("optionsForm");
const feedback = document.getElementById("feedback");
const scoreText = document.getElementById("scoreText");
const passText = document.getElementById("passText");

const TOTAL_TIME_MIN = 45;
let timerId = null;
let remainingSeconds = TOTAL_TIME_MIN * 60;
let elapsedSeconds = 0;

let quizQuestions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let currentOptions = [];
let currentCorrectIndex = 0;
let wrongQuestions = [];
let isRetryWrong = false;

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const updateTimerDisplay = () => {
  timerValue.textContent = formatTime(remainingSeconds);
  const minutesElapsed = Math.floor(elapsedSeconds / 60);
  const secondsElapsed = elapsedSeconds % 60;
  timerMeta.textContent = `${minutesElapsed} min ${String(secondsElapsed).padStart(2, "0")} s écoulées`;
};

const startTimer = () => {
  stopTimer();
  remainingSeconds = TOTAL_TIME_MIN * 60;
  elapsedSeconds = 0;
  updateTimerDisplay();
  timerId = setInterval(() => {
    remainingSeconds -= 1;
    elapsedSeconds += 1;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateTimerDisplay();
      finishQuiz(true);
      return;
    }
    updateTimerDisplay();
  }, 1000);
};

const stopTimer = () => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
};

const shuffle = (array) => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const pickQuestions = (mode) => {
  const situationPool = typeof SITUATION_QUESTIONS !== "undefined" ? SITUATION_QUESTIONS : [];

  if (mode === "all") {
    return shuffle([...QUESTIONS, ...situationPool]);
  }

  if (mode === "situations") {
    return shuffle(situationPool);
  }

  const connaissance = QUESTIONS.filter((q) => q.type === "connaissance");
  const situation = situationPool.length > 0
    ? situationPool
    : QUESTIONS.filter((q) => q.type === "situation");

  const selected = [
    ...shuffle(connaissance).slice(0, 28),
    ...shuffle(situation).slice(0, 12),
  ];

  if (selected.length < 40) {
    return shuffle(QUESTIONS).slice(0, 40);
  }

  return shuffle(selected);
};

const renderQuestion = () => {
  const question = quizQuestions[currentIndex];
  answered = false;
  feedback.classList.add("hidden");
  nextBtn.classList.add("hidden");
  submitBtn.disabled = false;
  backBtn.disabled = currentIndex === 0;

  const total = quizQuestions.length;
  progressText.textContent = `Question ${currentIndex + 1}/${total}`;
  progressFill.style.width = `${((currentIndex + 1) / total) * 100}%`;

  questionMeta.textContent = `${question.category} · ${question.type === "situation" ? "Mise en situation" : "Connaissance"}`;
  questionText.textContent = question.question;

  optionsForm.innerHTML = "";
  const shuffled = shuffle(question.options.map((text, index) => ({ text, index })));
  currentOptions = shuffled.map((item) => item.text);
  currentCorrectIndex = shuffled.findIndex((item) => item.index === question.correctIndex);

  currentOptions.forEach((option, index) => {
    const label = document.createElement("label");
    label.className = "option";
    label.innerHTML = `
      <input type="radio" name="option" value="${index}" />
      <span>${option}</span>
    `;
    optionsForm.appendChild(label);
  });
};

const showFeedback = (question, selectedIndex) => {
  const optionLabels = optionsForm.querySelectorAll(".option");
  optionLabels.forEach((label, idx) => {
    if (idx === currentCorrectIndex) {
      label.classList.add("correct");
    }
    if (idx === selectedIndex && selectedIndex !== currentCorrectIndex) {
      label.classList.add("incorrect");
    }
  });

  const isCorrect = selectedIndex === currentCorrectIndex;
  feedback.innerHTML = `
    <strong>${isCorrect ? "Bonne réponse" : "Réponse incorrecte"}</strong>
    <div>Réponse correcte : ${currentOptions[currentCorrectIndex]}</div>
    <div class="note">${question.explanation}</div>
  `;
  feedback.classList.remove("hidden");
};

const finishQuiz = (timeUp = false) => {
  stopTimer();
  quizPanel.classList.add("hidden");
  resultPanel.classList.remove("hidden");

  const total = quizQuestions.length;
  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 80;

  scoreText.textContent = `${score}/${total} (${percentage}%)`;
  if (isRetryWrong) {
    passText.textContent = timeUp
      ? "Temps écoulé — reprise des erreurs terminée."
      : "Reprise des erreurs terminée.";
  } else {
    passText.textContent = timeUp
      ? `Temps écoulé — ${passed ? "réussi" : "échoué"}.`
      : passed
      ? "Bravo, vous avez réussi l'examen."
      : "Résultat insuffisant pour réussir l'examen.";
  }

  if (!isRetryWrong && wrongQuestions.length > 0) {
    redoWrongBtn.classList.remove("hidden");
  } else {
    redoWrongBtn.classList.add("hidden");
  }
};

startBtn.addEventListener("click", () => {
  const mode = document.querySelector("input[name=mode]:checked").value;
  quizQuestions = pickQuestions(mode);
  currentIndex = 0;
  score = 0;
  wrongQuestions = [];
  isRetryWrong = false;
  setupPanel.classList.add("hidden");
  resultPanel.classList.add("hidden");
  quizPanel.classList.remove("hidden");
  startTimer();
  renderQuestion();
});

submitBtn.addEventListener("click", () => {
  if (answered) return;
  const checked = optionsForm.querySelector("input[name=option]:checked");
  if (!checked) {
    feedback.innerHTML = "<strong>Veuillez sélectionner une réponse.</strong>";
    feedback.classList.remove("hidden");
    return;
  }

  const selectedIndex = Number(checked.value);
  const question = quizQuestions[currentIndex];
  answered = true;
  submitBtn.disabled = true;

  if (selectedIndex === currentCorrectIndex) {
    score += 1;
  } else if (!isRetryWrong) {
    if (!wrongQuestions.some((item) => item.id === question.id)) {
      wrongQuestions.push(question);
    }
  }

  showFeedback(question, selectedIndex);
  nextBtn.classList.remove("hidden");
});

nextBtn.addEventListener("click", () => {
  if (currentIndex + 1 >= quizQuestions.length) {
    finishQuiz();
    return;
  }
  currentIndex += 1;
  renderQuestion();
});

skipBtn.addEventListener("click", () => {
  if (currentIndex + 1 >= quizQuestions.length) {
    finishQuiz();
    return;
  }
  currentIndex += 1;
  renderQuestion();
});

backBtn.addEventListener("click", () => {
  if (currentIndex === 0) return;
  currentIndex -= 1;
  renderQuestion();
});

restartBtn.addEventListener("click", () => {
  resultPanel.classList.add("hidden");
  setupPanel.classList.remove("hidden");
  stopTimer();
  updateTimerDisplay();
  wrongQuestions = [];
  isRetryWrong = false;
  redoWrongBtn.classList.add("hidden");
});

redoWrongBtn.addEventListener("click", () => {
  if (wrongQuestions.length === 0) return;
  quizQuestions = shuffle(wrongQuestions);
  currentIndex = 0;
  score = 0;
  isRetryWrong = true;
  resultPanel.classList.add("hidden");
  quizPanel.classList.remove("hidden");
  startTimer();
  renderQuestion();
});

updateTimerDisplay();
