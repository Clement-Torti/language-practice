// Onglet Vocabulaire

function createWordLists() {
    const wordLists = document.getElementById('wordLists');
    wordLists.innerHTML = '';
    const words = getCurrentLanguageData().words;

    // Favorites list
    const favoritesListItem = document.createElement('a');
    favoritesListItem.href = '#';
    favoritesListItem.className = 'list-group-item list-group-item-action';
    favoritesListItem.innerHTML = `<i class="fas fa-star me-2" style="color: gold;"></i>Favorites`;
    const favoritesCompletions = getLocalStorageValue(`favorites_${currentLanguage}`) || 0;
    favoritesListItem.innerHTML += ` (Completed ${favoritesCompletions} times)`;
    favoritesListItem.onclick = () => startFavoritesList();
    wordLists.appendChild(favoritesListItem);

    // Random list
    const randomListItem = document.createElement('a');
    randomListItem.href = '#';
    randomListItem.className = 'list-group-item list-group-item-action';
    randomListItem.innerHTML = `<i class="fas fa-random me-2"></i>Random`;
    const randomCompletions = getLocalStorageValue(`list0_${currentLanguage}`) || 0;
    randomListItem.innerHTML += ` (Completed ${randomCompletions} times)`;
    randomListItem.onclick = () => startList(-1, -1, 0);
    wordLists.appendChild(randomListItem);



    // Last 30 words
    const last30ListItem = document.createElement('a');
    last30ListItem.href = '#';
    last30ListItem.className = 'list-group-item list-group-item-action';
    last30ListItem.innerHTML = `<i class="fas fa-history me-2"></i>Last 30`;
    const last30Completions = getLocalStorageValue(`list999_${currentLanguage}`) || 0;
    last30ListItem.innerHTML += ` (Completed ${last30Completions} times)`;
    last30ListItem.onclick = () => startList(-1, -1, 999);
    wordLists.appendChild(last30ListItem);



    // Sequential lists
    for (let i = 0; i < words.length; i += LIST_LENGTH) {
        const listNumber = Math.floor(i / LIST_LENGTH) + 1;
        const listItem = document.createElement('a');
        listItem.href = '#';
        listItem.className = 'list-group-item list-group-item-action';
        listItem.innerText = `List ${listNumber}`;
        const completions = getLocalStorageValue(`list${listNumber}_${currentLanguage}`) || 0;
        listItem.innerText += ` (Completed ${completions} times)`;
        listItem.onclick = () => startList(i, i + LIST_LENGTH, listNumber);
        
      
        wordLists.appendChild(listItem);
    }

}

function startFavoritesList() {
    const words = getCurrentLanguageData().words;
    currentList = [];
    
    // Get all favorited words
    for (let i = 0; i < words.length; i++) {
        const isFavorited = localStorage.getItem(`favorite_word_${currentLanguage}_${i}`) === 'true';
        if (isFavorited) {
            currentList.push(words[i]);
        }
    }
    
    if (currentList.length === 0) {
        alert('No favorite words yet! Click the star icons to add words to favorites.');
        return;
    }
    
    currentList = shuffleArray(currentList);
    remainingWords = currentList.length;
    currentWordIndex = 0;
    currentListNumber = -2; // Special ID for favorites list
    showNextWord();
    document.getElementById('wordLists').style.display = 'none';
    document.getElementById('wordCard').style.display = 'block';
    updateProgress();
}

function toggleFavorite(listNumber) {
    const key = listNumber >= 0 ? 
        `favorite_list_${currentLanguage}_${listNumber}` : 
        `favorite_word_${currentLanguage}_${currentWordIndex}`;
    const current = localStorage.getItem(key) === 'true';
    localStorage.setItem(key, !current);
}

function startList(start, end, listNumber) {
    const words = getCurrentLanguageData().words;
    currentList = [];
    
    if (listNumber == 0) {
        // Random selection - include up to 5 favorite words
        const favoriteWords = [];
        
        // Get all favorited words
        for (let i = 0; i < words.length; i++) {
            const isFavorited = localStorage.getItem(`favorite_word_${currentLanguage}_${i}`) === 'true';
            if (isFavorited) {
                favoriteWords.push(words[i]);
            }
        }
        
        // Determine how many favorites to include (up to 5, or less if not enough exist)
        const favoritesToInclude = Math.min(5, favoriteWords.length);
        const shuffledFavorites = shuffleArray(favoriteWords).slice(0, favoritesToInclude);
        
        // Fill the rest with random words
        const remainingCount = LIST_LENGTH - shuffledFavorites.length;
        for (let i = 0; i < remainingCount; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            currentList.push(words[randomIndex]);
        }
        
        // Combine favorites with random words and shuffle again
        currentList = shuffleArray([...shuffledFavorites, ...currentList]);
    } else if (listNumber == 999) {
        // Last 30 words
        currentList = words.slice(words.length - 35, words.length);
        currentList = shuffleArray(currentList);
    } else {
        // Sequential list
        currentList = words.slice(start, end);
        currentList = shuffleArray(currentList);
    }

    remainingWords = currentList.length;
    currentWordIndex = 0;
    currentListNumber = listNumber;
    showNextWord();
    document.getElementById('wordLists').style.display = 'none';
    document.getElementById('wordCard').style.display = 'block';
    updateProgress();
}

// Modify showNextWord to update the star status
function showNextWord() {
    if (currentWordIndex < currentList.length) {
        const word = currentList[currentWordIndex];
        
        // Reset UI elements
        document.getElementById('translation').style.display = 'none';
        document.getElementById('replayAudioBtn').style.display = 'none';
        currentAudioText = ""; // Reset audio text

        // Parse Arabic parts (tense2) by splitting "/" and trimming whitespace
        const arabicParts = word.tense2.split('/').map(part => part.trim());
        // Select one random part for display or audio
        const randomArabicPart = arabicParts[Math.floor(Math.random() * arabicParts.length)];

        let displayWord, displayForm = '', translation;
        const rand = Math.random();

        // LOGIC: 40% French, 30% Arabic, 30% Audio
        // Note: In your JSON, tense1 is French/Meaning, tense2 is Arabic
        
        if (rand < 0.40) {
            // --- 40% FRENCH (Show Meaning, Guess Arabic) ---
            displayWord = word.tense1;
            translation = word.tense2;
            
            // Optional: Show form hint if Arabic mode is active
            if (word.type === "word" && currentLanguage === 'Arabic') {
                const formIndex = Math.floor(Math.random() * getCurrentLanguageData().wordForms.length);
                displayForm = getCurrentLanguageData().wordForms[formIndex];
            }

        } else if (rand < 0.70) {
            // --- 30% ARABIC (Show Arabic Text, Guess French) ---
            // We show one specific part (like existing logic) or the full list?
            // Let's stick to the "Random Part" logic you used before for cleaner cards
            displayWord = randomArabicPart;
            
            // The translation reveals the Full Arabic + French
            translation = (arabicParts.length > 1 ? word.tense2 + "\n\n" : "") + word.tense1;

        } else {
            // --- 30% AUDIO ONLY (Hear Arabic, Guess French/Text) ---
            
            // 1. Set the text to speak (One specific part)
            currentAudioText = randomArabicPart;
            
            // 2. Play the audio
            speakText(currentAudioText);
            
            // 3. UI Updates
            displayWord = '<i class="fas fa-headphones-alt" style="font-size: 4rem; color: var(--primary-color); animation: pulse 2s infinite;"></i><div style="font-size: 1rem; margin-top: 10px; color: var(--text-muted)">Listen...</div>';
            
            // 4. Reveal button logic
            document.getElementById('replayAudioBtn').style.display = 'inline-block';

            // 5. Translation shows The Arabic Word + French Meaning
            translation = `${word.tense2}\n\n${word.tense1}`;
        }

        // Apply to DOM
        document.getElementById('currentWord').innerHTML = displayWord;
        document.getElementById('wordForm').innerText = displayForm;
        document.getElementById('translation').innerText = translation;

        // Update favorite star status
        const words = getCurrentLanguageData().words;
        const wordIndex = words.findIndex(w => w.tense1 === word.tense1 && w.tense2 === word.tense2);
        const isFavorited = wordIndex !== -1 && localStorage.getItem(`favorite_word_${currentLanguage}_${wordIndex}`) === 'true';
        const star = document.getElementById('wordFavoriteStar');
        star.classList.toggle('active', isFavorited);
        star.style.color = isFavorited ? 'gold' : '#ccc';

    } else {
        finishList();
    }
}
function verifyWord() {
    document.getElementById('translation').style.display = 'block';
}

function markWord(status) {
    if (status === 'KO') {
        currentList.push(currentList[currentWordIndex]);
    } else {
        remainingWords--;
    }
    currentWordIndex++;
    showNextWord();
    updateProgress();
}

function updateProgress() {
    const total = currentList.length;
    const completed = total - remainingWords;
    const percentage = (completed / total) * 100;
    
    document.getElementById('progressBar').style.width = `${percentage}%`;
    document.getElementById('progressText').innerText = `${completed}/${total}`;
}

function finishList() {
    const completions = parseInt(getLocalStorageValue(`list${currentListNumber}_${currentLanguage}`)) || 0;
    setLocalStorageValue(`list${currentListNumber}_${currentLanguage}`, completions + 1);
    alert('Congratulations! You completed the list!');
    document.getElementById('wordCard').style.display = 'none';
    document.getElementById('wordLists').style.display = 'block';
    createWordLists();
}
