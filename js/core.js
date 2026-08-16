// Variables globales, stockage et utilitaires

let currentLanguage = 'Arabic';
let currentList = [];
let currentWordIndex = 0;
let remainingWords = 0;
let currentListNumber = 0;
const LIST_LENGTH = 50;

// Game state variables
let gameTimers = {
    verb: null,
    number: null,
    expression: null
};

let gameStates = {
    verb: { score: 0, timeLeft: 60, isRunning: false },
    number: { score: 0, timeLeft: 60, isRunning: false },
    expression: { score: 0, timeLeft: 300, isRunning: false, isPaused: false }
};

// Utility functions
function getCurrentLanguageData() {
    return currentLanguage === 'Arabic' ? ARABIC_DATA : FRENCH_DATA;
}

function getStorageKey(type) {
    return `${type}_${currentLanguage}`;
}

function getLocalStorageValue(key) {
    return localStorage.getItem(key) || 0;
}

function setLocalStorageValue(key, value) {
    localStorage.setItem(key, value);
}

function getGoal(storageKey) {
    let goal = 20;
    const current = parseInt(getLocalStorageValue(storageKey));
    while (current >= goal) {
        goal *= 2;
    }
    return goal;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
