// Synthèse vocale

let currentAudioText = "";

function speakText(text) {
    if (!text) return;

    // Cancel any currently playing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // 'ar-SA' is the standard locale for Modern Standard Arabic
    utterance.lang = 'ar-SA'; 
    utterance.rate = 1; // Slightly slower speed for better clarity
    utterance.pitch = 1;

    // Error handling for missing voices
    utterance.onerror = function(event) {
        console.error('Speech synthesis error', event);
    };

    window.speechSynthesis.speak(utterance);
}

function replayCurrentAudio() {
    speakText(currentAudioText);
}
