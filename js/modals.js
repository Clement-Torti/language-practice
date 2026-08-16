// Modales et favoris

function closeHint() {
    document.getElementById("hintModal").style.display = "none";
}

// Close modal when clicking outside of it
document.addEventListener('click', function(event) {
    const modal = document.getElementById('hintModal');
    if (event.target === modal) {
        closeHint();
    }
});


function toggleWordFavorite() {
    const star = document.getElementById('wordFavoriteStar');
    const isFavorited = !star.classList.contains('active');
    
    star.classList.toggle('active');
    star.style.color = isFavorited ? 'gold' : '#ccc';
    
    // Get the current word's index in the original words array
    const words = getCurrentLanguageData().words;
    const currentWord = currentList[currentWordIndex];
    const wordIndex = words.findIndex(w => w.tense1 === currentWord.tense1 && w.tense2 === currentWord.tense2);
    
    if (wordIndex !== -1) {
        localStorage.setItem(`favorite_word_${currentLanguage}_${wordIndex}`, isFavorited);
    }
}
