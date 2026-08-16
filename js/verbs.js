// Onglet Verbes

let currentVerb = null;
let currentTense = null;
let verbShowed = false;

function startVerbGame() {
    gameStates.verb = { score: 0, timeLeft: 60, isRunning: true };
    
    document.getElementById("verbStartBtn").style.display = "none";
    document.getElementById("verbResetBtn").style.display = "inline-block";
    document.getElementById("verbNextBtn").style.display = "inline-block";
    // document.getElementById("verbConjBtn").style.display = "inline-block";
    document.getElementById("verbHintBtn").style.display = "inline-block";
    
    showRandomVerb();
    gameTimers.verb = setInterval(updateVerbTimer, 1000);
}

function updateVerbTimer() {
    gameStates.verb.timeLeft--;
    document.getElementById("verbTimer").textContent = gameStates.verb.timeLeft;

    if (gameStates.verb.timeLeft === 0) {
        endVerbGame();
    }
}

function showRandomVerb() {
    verbShowed = false;
    const verbs = getCurrentLanguageData().words.filter(item => item.type === "verb");
    const pronouns = getCurrentLanguageData().pronouns;
    const tenses = getCurrentLanguageData().tenses;
    
    currentVerb = verbs[Math.floor(Math.random() * verbs.length)];
    const randomPronoun = pronouns[Math.floor(Math.random() * pronouns.length)];
    currentTense = tenses[Math.floor(Math.random() * tenses.length)];

    document.getElementById("randomVerb").textContent = randomPronoun + " " + currentVerb.tense1;
    document.getElementById("verbTranslation").textContent = currentVerb.tense2;
    document.getElementById("verbTranslation").style.display = "none";
    document.getElementById("randomTense").textContent = currentTense.name;

    // 20% chance for negative
    const includeNegative = Math.random() <= 0.2;
    document.getElementById("randomNegative").textContent = includeNegative ? "(Negation)" : "";
}

function nextVerb() {
    gameStates.verb.score++;
    document.getElementById("verbScore").textContent = gameStates.verb.score;
    showRandomVerb();
}

function showVerbHint() {
    document.getElementById("verbTranslation").style.display = "block";
    verbShowed = true;
}

function showConjugation() {
    document.getElementById("hintContent").textContent = currentTense.hint;
    document.getElementById("hintModal").style.display = "block";
}

function endVerbGame() {
    clearInterval(gameTimers.verb);
    gameStates.verb.isRunning = false;
    
    document.getElementById("verbStartBtn").style.display = "inline-block";
    document.getElementById("verbResetBtn").style.display = "none";
    document.getElementById("verbNextBtn").style.display = "none";
    // document.getElementById("verbConjBtn").style.display = "none";
    document.getElementById("verbHintBtn").style.display = "none";
    document.getElementById("verbTranslation").style.display = "block";

    const completions = parseInt(getLocalStorageValue(getStorageKey('verbs'))) || 0;
    setLocalStorageValue(getStorageKey('verbs'), completions + 1);
    updateAllStats();

    alert("Game Over! Your score: " + gameStates.verb.score);
    clearVerbContent();
}

function resetVerbGame() {
    clearInterval(gameTimers.verb);
    gameStates.verb = { score: 0, timeLeft: 60, isRunning: false };
    
    document.getElementById("verbScore").textContent = 0;
    document.getElementById("verbTimer").textContent = 60;
    document.getElementById("verbStartBtn").style.display = "inline-block";
    document.getElementById("verbResetBtn").style.display = "none";
    document.getElementById("verbNextBtn").style.display = "none";
    // document.getElementById("verbConjBtn").style.display = "none";
    document.getElementById("verbHintBtn").style.display = "none";

    clearVerbContent();
}

function clearVerbContent() {
    document.getElementById("randomVerb").textContent = "Ready to practice verbs?";
    document.getElementById("verbTranslation").textContent = "";
    document.getElementById("randomTense").textContent = "";
    document.getElementById("randomNegative").textContent = "";
}
