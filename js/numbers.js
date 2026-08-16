// Onglet Nombres

let currentOperation = null;

function startNumberGame() {
    gameStates.number = { score: 0, timeLeft: 60, isRunning: true };
    
    document.getElementById("numberStartBtn").style.display = "none";
    document.getElementById("numberResetBtn").style.display = "inline-block";
    document.getElementById("numberNextBtn").style.display = "inline-block";
    
    displayNumberOperation();
    gameTimers.number = setInterval(updateNumberTimer, 1000);
}

function updateNumberTimer() {
    gameStates.number.timeLeft--;
    document.getElementById("numberTimer").textContent = gameStates.number.timeLeft;

    if (gameStates.number.timeLeft === 0) {
        endNumberGame();
    }
}

function displayNumberOperation() {
    const a = Math.floor(Math.random() * 100) + 1;
    const b = Math.floor(Math.random() * 100) + 1;
    const operators = ['+', '-', '*', '/'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let result;
    switch (operator) {
        case '+': result = a + b; break;
        case '-': result = a - b; break;
        case '*': result = a * b; break;
        case '/': result = (a / b).toFixed(2); break;
    }
    
    const randomResult = Math.floor(Math.random() * 10000000) + 100;
    document.getElementById("numberOperation").textContent = 
        `${a.toLocaleString()} ${operator} ${b.toLocaleString()} = ${randomResult.toLocaleString()}`;
}

function nextNumberOperation() {
    gameStates.number.score++;
    document.getElementById("numberScore").textContent = gameStates.number.score;
    displayNumberOperation();
}

function endNumberGame() {
    clearInterval(gameTimers.number);
    gameStates.number.isRunning = false;
    
    const completions = parseInt(getLocalStorageValue(getStorageKey('number'))) || 0;
    setLocalStorageValue(getStorageKey('number'), completions + 1);
    updateAllStats();

    alert(`Time's up! Your score is ${gameStates.number.score}.`);
    resetNumberGame();
}

function resetNumberGame() {
    clearInterval(gameTimers.number);
    gameStates.number = { score: 0, timeLeft: 60, isRunning: false };
    
    document.getElementById("numberTimer").textContent = 60;
    document.getElementById("numberScore").textContent = 0;
    document.getElementById("numberStartBtn").style.display = "inline-block";
    document.getElementById("numberResetBtn").style.display = "none";
    document.getElementById("numberNextBtn").style.display = "none";
    document.getElementById("numberOperation").textContent = "Ready to start?";
}
