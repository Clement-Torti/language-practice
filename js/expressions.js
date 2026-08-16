// Onglet Expressions

let expressionWordIndex = 0;

function refreshExpression() {
    gameStates.expression = { score: 0, timeLeft: 300, isRunning: true, isPaused: false };
    expressionWordIndex = 0;
    
    refreshImage();
    displayRandomWord();
    startExpressionTimer();
}

function nextExpressionWord() {
    gameStates.expression.score++;
    expressionWordIndex++;
    displayRandomWord();
}

function pauseExpression() {
    gameStates.expression.isPaused = !gameStates.expression.isPaused;
    const pauseBtn = document.getElementById("pauseBtn");
    pauseBtn.innerHTML = gameStates.expression.isPaused ? 
        '<i class="fas fa-play me-2"></i>Resume' : 
        '<i class="fas fa-pause me-2"></i>Pause';
}

function displayRandomWord() {
    const words = getCurrentLanguageData().words;
    const randomIndex = Math.floor(Math.random() * words.length);
    const randomObject = words[randomIndex];
    const randomWords = randomObject.tense2.split("/");
    const randomWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    
    document.getElementById('expressionWords').innerText = 
        `Score: ${gameStates.expression.score} - ${randomWord} (${randomObject.tense1})`;
}

function startExpressionTimer() {
    gameStates.expression.isRunning = true;
    clearInterval(gameTimers.expression);

    function updateExpressionTimer() {
        if (gameStates.expression.isPaused) return;
        
        const minutes = Math.floor(gameStates.expression.timeLeft / 60);
        const seconds = gameStates.expression.timeLeft % 60;
        document.getElementById('expressionTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (gameStates.expression.timeLeft === 0) {
            clearInterval(gameTimers.expression);
            endExpressionGame();
        } else {
            gameStates.expression.timeLeft--;
        }
    }

    updateExpressionTimer();
    gameTimers.expression = setInterval(updateExpressionTimer, 1000);
}

function endExpressionGame() {
    gameStates.expression.isRunning = false;
    
    const completions = parseInt(getLocalStorageValue(getStorageKey('expression'))) || 0;
    setLocalStorageValue(getStorageKey('expression'), completions + 1);
    updateAllStats();
    
    alert(`Time's up! Your score: ${gameStates.expression.score}`);
}

function refreshImage() {
    const width = 500;
    const height = 300;
    const randomImageUrl = `https://picsum.photos/${width}/${height}?random=${Math.random()}`;
    document.getElementById('expressionImage').src = randomImageUrl;
}
