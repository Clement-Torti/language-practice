// Initialisation de l'app et statistiques globales

document.addEventListener('DOMContentLoaded', function() {
    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
        document.getElementById('geminiApiKey').value = savedApiKey;
    }

    // Initialize the app
    createWordLists();
    updateAllStats();
    renderConversationList();
});

function updateAllStats() {
    // Update verb stats
    const verbTotal = parseInt(getLocalStorageValue(getStorageKey('verbs'))) || 0;
    const verbGoal = getGoal(getStorageKey('verbs'));
    document.getElementById("verbTotal").innerText = `${verbTotal}/${verbGoal}`;

    // Update number stats
    const numberTotal = parseInt(getLocalStorageValue(getStorageKey('number'))) || 0;
    const numberGoal = getGoal(getStorageKey('number'));
    document.getElementById("numberTotal").innerText = `${numberTotal}/${numberGoal}`;

    // Update expression stats
    const expressionTotal = parseInt(getLocalStorageValue(getStorageKey('expression'))) || 0;
    const expressionGoal = getGoal(getStorageKey('expression'));
    document.getElementById("expressionTotal").innerText = `${expressionTotal}/${expressionGoal}`;

    // Update speaking stats
    const speakingTotal = parseInt(getLocalStorageValue(getStorageKey('speaking'))) || 0;
    const speakingGoal = getGoal(getStorageKey('speaking'));
    document.getElementById("speakingTotal").innerText = `${speakingTotal}/${speakingGoal}`;
}
