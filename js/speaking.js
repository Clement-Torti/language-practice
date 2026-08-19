// Onglet Speaking (génération de phrases via Gemini)

let speakingSentences = [];
let currentSentenceIndex = 0;
let speakingStats = { correct: 0, wrong: 0 };
let speakingTimer = 0;
let speakingHistoryKey = '';
let speakingHistory = []; // mirrors exactly what's saved in localStorage
let speakingTimerInterval = null;
let speakingNoCount = false; // true when session should not increment the counter

// Calendrier de révision espacée : une phrase revient aux séances 1, 3, 8, 15 et 30
// après son introduction. REVIEW_OFFSETS = ces séances moins un (0 = la séance
// d'introduction elle-même). Défini ici une seule fois : les trois écrans qui
// s'en servent lisent ces constantes.
const REVIEW_DAYS = [1, 3, 8, 15, 30];
const REVIEW_OFFSETS = REVIEW_DAYS.map(day => day - 1);
const OFFSET_TO_DAY = Object.fromEntries(REVIEW_OFFSETS.map((offset, i) => [offset, REVIEW_DAYS[i]]));
// Au-delà de la dernière révision, la phrase sort de l'historique.
const REVIEW_LAST_OFFSET = REVIEW_OFFSETS[REVIEW_OFFSETS.length - 1];

async function startSpeakingPractice() {
    // Les phrases ne viennent plus de Gemini : la clé n'est plus obligatoire ici.
    // Elle reste utile pour "Fix translation" et "Replace sentence", donc on la garde.
    const apiKey = document.getElementById('geminiApiKey').value.trim();
    if (apiKey) localStorage.setItem('gemini_api_key', apiKey);

    // Show loading indicator
    document.getElementById('speakingControls').style.display = 'none';
    document.getElementById('speakingContent').style.display = 'block';
    document.getElementById('loadingIndicator').style.display = 'block';

    try {
        const TARGET = 50;

        // Current challenge counter (incremented at session end)
        const currentCount = parseInt(getLocalStorageValue(getStorageKey('speaking'))) || 0;

        // Load stored history; migrate old entries with ISO date strings to 2 challenges ago
        speakingHistoryKey = getStorageKey('speaking_history');
        const rawHistory = JSON.parse(localStorage.getItem(speakingHistoryKey) || '[]');
        const allHistory = rawHistory.map(s => typeof s.date === 'number' ? s : { ...s, date: currentCount - 2 });

        // Deduplicate by french text, keeping the earliest introduction
        const seenFrench = new Map();
        allHistory.forEach(s => {
            if (!seenFrench.has(s.french) || s.date < seenFrench.get(s.french).date) seenFrench.set(s.french, s);
        });

        // Drop sentences past their last review (see REVIEW_DAYS)
        const activeHistory = Array.from(seenFrench.values()).filter(s => currentCount - s.date <= REVIEW_LAST_OFFSET);

        // 10 nouvelles phrases tirées au hasard dans les conversations d'Expression
        // (ancienne version : const newSentences = await generateSentences(apiKey, 10);)
        const newSentences = pickSentencesFromConversations(10);

        if (newSentences.length === 0) {
            alert('No translated conversation available yet. Translate some in the Expression tab first.');
            resetSpeakingPractice();
            return;
        }
        const todaySentences = newSentences.map(s => ({ ...s, date: currentCount, reviewDay: 1 }));

        // Sentences from history due this session (diff > 0 to exclude this session's new batch)
        const dueSentences = activeHistory
            .filter(s => {
                const diff = currentCount - s.date;
                return diff > 0 && REVIEW_OFFSETS.includes(diff);
            })
            .map(s => ({ ...s, reviewDay: OFFSET_TO_DAY[currentCount - s.date] }));

        // Filler: stored sentences not due this session, shuffled so different ones appear each session
        const dueKeys = new Set(dueSentences.map(s => s.french));
        const filler = activeHistory
            .filter(s => !dueKeys.has(s.french))
            .map(s => ({ ...s, reviewDay: 0 }))
            .sort(() => Math.random() - 0.5);

        // Build display: new → due → random filler, capped at TARGET, then shuffle
        const displayPool = [...todaySentences, ...dueSentences, ...filler].slice(0, TARGET);
        speakingSentences = displayPool.sort(() => Math.random() - 0.5);

        // Save: active history + this session's new sentences
        speakingHistory = [...activeHistory, ...todaySentences];
        localStorage.setItem(speakingHistoryKey, JSON.stringify(speakingHistory));

        // Hide loading, show first sentence
        document.getElementById('loadingIndicator').style.display = 'none';
        document.getElementById('sentenceDisplay').style.display = 'block';

        // Reset stats and timer
        speakingStats = { correct: 0, wrong: 0 };
        currentSentenceIndex = 0;
        speakingTimer = 0;
        updateSpeakingStats();

        speakingNoCount = false;
        startSpeakingTimer();

        // Display first sentence
        displayCurrentSentence();
    } catch (error) {
        console.error('Error generating sentences:', error);
        alert('Error generating sentences: ' + error.message);
        resetSpeakingPractice();
    }
}

async function startSpeakingPracticeNoGenerate() {
    document.getElementById('speakingControls').style.display = 'none';
    document.getElementById('speakingContent').style.display = 'block';

    try {
        const TARGET = 50;

        const currentCount = parseInt(getLocalStorageValue(getStorageKey('speaking'))) || 0;

        speakingHistoryKey = getStorageKey('speaking_history');
        const rawHistory = JSON.parse(localStorage.getItem(speakingHistoryKey) || '[]');
        const allHistory = rawHistory.map(s => typeof s.date === 'number' ? s : { ...s, date: currentCount - 2 });

        const seenFrench = new Map();
        allHistory.forEach(s => {
            if (!seenFrench.has(s.french) || s.date < seenFrench.get(s.french).date) seenFrench.set(s.french, s);
        });

        const activeHistory = Array.from(seenFrench.values()).filter(s => currentCount - s.date <= REVIEW_LAST_OFFSET);

        if (activeHistory.length === 0) {
            alert('No saved sentences found. Use "Start Practice" to generate new sentences first.');
            resetSpeakingPractice();
            return;
        }

        const dueSentences = activeHistory
            .filter(s => {
                const diff = currentCount - s.date;
                return diff > 0 && REVIEW_OFFSETS.includes(diff);
            })
            .map(s => ({ ...s, reviewDay: OFFSET_TO_DAY[currentCount - s.date] }));

        const dueKeys = new Set(dueSentences.map(s => s.french));
        const filler = activeHistory
            .filter(s => !dueKeys.has(s.french))
            .map(s => ({ ...s, reviewDay: 0 }))
            .sort(() => Math.random() - 0.5);

        const displayPool = [...dueSentences, ...filler].slice(0, TARGET);
        speakingSentences = displayPool.sort(() => Math.random() - 0.5);

        speakingHistory = activeHistory;
        localStorage.setItem(speakingHistoryKey, JSON.stringify(speakingHistory));

        document.getElementById('sentenceDisplay').style.display = 'block';

        speakingStats = { correct: 0, wrong: 0 };
        currentSentenceIndex = 0;
        speakingTimer = 0;
        updateSpeakingStats();

        speakingNoCount = true;
        startSpeakingTimer();
        displayCurrentSentence();
    } catch (error) {
        console.error('Error starting practice:', error);
        alert('Error starting practice: ' + error.message);
        resetSpeakingPractice();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Génération via Gemini — conservée mais désactivée.
// Les phrases proviennent désormais de pickSentencesFromConversations().
// Pour revenir à Gemini : décommenter ce bloc et restaurer l'appel dans
// startSpeakingPractice(), ainsi que le contrôle de la clé API.
// ─────────────────────────────────────────────────────────────────────────────
/*
async function generateSentences(apiKey, count) {
    const words = getCurrentLanguageData().words;

    // Select random words
    const shuffled = shuffleArray(words);
    const selectedWords = shuffled.slice(0, count);

    // Prepare words for the prompt
    const wordList = selectedWords.map(word => {
        // For words with multiple forms, pick one randomly
        const forms = word.tense2.split(' / ');
        const randomForm = forms[Math.floor(Math.random() * forms.length)];
        return {
            french: word.tense1,
            arabic: randomForm,
            type: word.type
        };
    });

    // Create the prompt
    const prompt = `You are a language learning assistant. Generate ${count} sentences using the following words. Each sentence should use ONE word from the list below.

Words to use:
${wordList.map((w, i) => `${i + 1}. ${w.french} = ${w.arabic} (${w.type})`).join('\n')}

IMPORTANT INSTRUCTIONS:
1. Generate exactly ${count} sentences, one for each word
2. Each sentence should be in French with its Arabic translation
3. For verbs, feel free to conjugate them in any tense (past, present, future, imperative, etc.)
4. For nouns, you can use them in singular, plural, or dual form, but be consistent with the translation. For instance, if you use plural in arabic, use plural in french.
5. Make sentences of reasonable length (5-15 words)
6. Make the sentences practical and useful for language learning
7. Ensure the Arabic translation uses the exact word form provided (or a conjugated/declined form of it)

FORMAT YOUR RESPONSE EXACTLY LIKE THIS (use this exact format with pipe | separators):
SENTENCE1|French sentence here|Arabic translation here
SENTENCE2|French sentence here|Arabic translation here
SENTENCE3|French sentence here|Arabic translation here
...and so on

Example format:
SENTENCE1|J'ai une grande opportunité aujourd'hui|لَدَيَّ فُرْصَة كَبِيرَة اليَوْم
SENTENCE2|Le candidat a présenté son programme|قَدَّمَ المُرَشَّحُ بَرْنَامَجَه

Do NOT include any other text, explanations, or formatting. ONLY the sentences in the exact format shown above.`;

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
    }

    const data = await response.json();
    const generatedText = data.candidates[0].content.parts[0].text;

    // Parse the response
    const sentences = parseSentences(generatedText, count);

    if (sentences.length === 0) {
        throw new Error('Failed to parse sentences from API response');
    }

    return sentences;
}
*/

function parseSentences(text, expectedCount) {
    const sentences = [];
    const lines = text.trim().split('\n');

    for (const line of lines) {
        // Match lines in format: SENTENCE1|French text|Arabic text
        const match = line.match(/SENTENCE\d+\|(.+?)\|(.+?)$/);
        if (match) {
            sentences.push({
                french: match[1].trim(),
                arabic: match[2].trim()
            });
        }
    }

    return sentences;
}

function displayCurrentSentence() {
    if (currentSentenceIndex >= speakingSentences.length) {
        showCompletionScreen();
        return;
    }

    const sentence = speakingSentences[currentSentenceIndex];

    // Display the French sentence (tense1), hide Arabic translation (tense2)
    document.getElementById('currentSentence').textContent = sentence.french;
    document.getElementById('translationText').textContent = sentence.arabic;
    document.getElementById('translationDisplay').style.display = 'none';
    document.getElementById('reviewDayBadge').textContent = sentence.reviewDay != null ? `j${sentence.reviewDay}` : '';

    // Reset buttons
    document.getElementById('revealBtn').style.display = 'inline-block';
    document.getElementById('answerButtons').style.display = 'none';

    // Update progress
    updateSpeakingStats();
}

function revealTranslation() {
    document.getElementById('translationDisplay').style.display = 'block';
    document.getElementById('revealBtn').style.display = 'none';
    document.getElementById('answerButtons').style.display = 'flex';
}

async function fixCurrentSentence() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return;

    const sentence = speakingSentences[currentSentenceIndex];
    const btn = document.getElementById('fixTranslationBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Fixing...';

    try {
        const prompt = `The following sentence pair may have errors on either side: the French may be broken, contain Arabic words, or be unnatural; the Arabic translation may be imprecise. Rewrite both sides so they are correct, natural, and consistent with each other.

Current French: ${sentence.french}
Current Arabic: ${sentence.arabic}

Respond ONLY in this exact format (nothing else):
FIXED|corrected French sentence here|corrected Arabic translation here`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 256 }
            })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text.trim();
        const match = text.match(/FIXED\|(.+?)\|(.+)/);

        if (match) {
            const fixedFrench = match[1].trim();
            const fixedArabic = match[2].trim();

            speakingSentences[currentSentenceIndex].french = fixedFrench;
            speakingSentences[currentSentenceIndex].arabic = fixedArabic;
            document.getElementById('currentSentence').textContent = fixedFrench;
            document.getElementById('translationText').textContent = fixedArabic;

            // Persist both sides to localStorage
            const idx = speakingHistory.findIndex(s => s.french === sentence.french);
            if (idx !== -1) {
                speakingHistory[idx].french = fixedFrench;
                speakingHistory[idx].arabic = fixedArabic;
                localStorage.setItem(speakingHistoryKey, JSON.stringify(speakingHistory));
            }
        }
    } catch (e) {
        console.error('Fix translation error:', e);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-spell-check me-1"></i>Fix Translation';
    }
}

async function replaceCurrentSentence() {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) return;

    const btn = document.getElementById('replaceSentenceBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Replacing...';

    try {
        const newSentences = await generateSentences(apiKey, 1);
        if (newSentences.length > 0) {
            const currentCount = parseInt(getLocalStorageValue(getStorageKey('speaking'))) || 0;
            const oldSentence = speakingSentences[currentSentenceIndex];
            const newSentence = { ...newSentences[0], date: currentCount };

            speakingSentences[currentSentenceIndex] = newSentence;

            // Update speakingHistory: swap old sentence out, new one in
            const idx = speakingHistory.findIndex(s => s.french === oldSentence.french);
            if (idx !== -1) {
                speakingHistory[idx] = newSentence;
            } else {
                speakingHistory.push(newSentence);
            }
            localStorage.setItem(speakingHistoryKey, JSON.stringify(speakingHistory));

            displayCurrentSentence();
        }
    } catch (e) {
        console.error('Replace sentence error:', e);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sync-alt me-1"></i>New Sentence';
    }
}

function markAnswer(isCorrect) {
    if (isCorrect) {
        speakingStats.correct++;
    } else {
        speakingStats.wrong++;
        // Add this sentence back to the end of the list
        const currentSentence = speakingSentences[currentSentenceIndex];
        speakingSentences.push(currentSentence);
    }

    updateSpeakingStats();

    // Move to next sentence
    currentSentenceIndex++;

    setTimeout(() => {
        displayCurrentSentence();
    }, 300);
}

function updateSpeakingStats() {
    const total = speakingStats.correct + speakingStats.wrong;
    const accuracy = total > 0 ? Math.round((speakingStats.correct / total) * 100) : 0;

    document.getElementById('speakingProgress').textContent = `${currentSentenceIndex}/${speakingSentences.length}`;
    document.getElementById('speakingScore').textContent = `${accuracy}%`;
}

function showCompletionScreen() {
    // Stop timer
    stopSpeakingTimer();

    document.getElementById('sentenceDisplay').style.display = 'none';
    document.getElementById('completionScreen').style.display = 'block';

    const total = speakingStats.correct + speakingStats.wrong;
    const score = total > 0 ? Math.round((speakingStats.correct / total) * 100) : 0;

    // Format and display final time
    const minutes = Math.floor(speakingTimer / 60);
    const seconds = speakingTimer % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('finalTime').textContent = timeString;
    document.getElementById('finalCorrect').textContent = speakingStats.correct;
    document.getElementById('finalWrong').textContent = speakingStats.wrong;
    document.getElementById('finalScore').textContent = score + '%';

    // Increment total sessions count in localStorage (not for "saved sentences" sessions)
    if (!speakingNoCount) {
        const completions = parseInt(getLocalStorageValue(getStorageKey('speaking'))) || 0;
        setLocalStorageValue(getStorageKey('speaking'), completions + 1);
    }
    updateAllStats();
}

function clearSpeakingHistory() {
    const modal = document.getElementById('clearHistoryModal');
    modal.style.display = 'flex';
}

function closeClearHistoryModal() {
    document.getElementById('clearHistoryModal').style.display = 'none';
}

function confirmClearHistory() {
    localStorage.removeItem(getStorageKey('speaking_history'));
    closeClearHistoryModal();
}

function exportSpeakingHistory() {
    const history = JSON.parse(localStorage.getItem(getStorageKey('speaking_history')) || '[]');
    const counter = parseInt(localStorage.getItem(getStorageKey('speaking')) || '0');
    const data = JSON.stringify({ language: currentLanguage, counter, history });
    navigator.clipboard.writeText(data).then(() => {
        const btn = document.querySelector('[onclick="exportSpeakingHistory()"]');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check me-1"></i>Copied!';
        setTimeout(() => { btn.innerHTML = original; }, 2000);
    }).catch(() => alert('Could not copy to clipboard.'));
}

function openImportSpeakingModal() {
    document.getElementById('importHistoryTextarea').value = '';
    document.getElementById('importHistoryModal').style.display = 'flex';
}

function confirmImportSpeakingHistory() {
    const raw = document.getElementById('importHistoryTextarea').value.trim();
    let data;
    try { data = JSON.parse(raw); } catch { return alert('Invalid JSON.'); }
    if (!Array.isArray(data.history)) return alert('Invalid format: missing "history" array.');
    localStorage.setItem(getStorageKey('speaking_history'), JSON.stringify(data.history));
    if (typeof data.counter === 'number') localStorage.setItem(getStorageKey('speaking'), data.counter);
    document.getElementById('importHistoryModal').style.display = 'none';
    updateAllStats();
    alert(`Imported ${data.history.length} sentences.`);
}

function openSentenceInspector() {
    const key = getStorageKey('speaking_history');
    const currentCount = parseInt(getLocalStorageValue(getStorageKey('speaking'))) || 0;

    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    const sentences = raw.map(s => typeof s.date === 'number' ? s : { ...s, date: currentCount - 2 });

    document.getElementById('inspectorMeta').textContent =
        `Challenge counter: ${currentCount} · ${sentences.length} sentence(s) stored`;

    const nextReview = (date) => {
        const diff = currentCount - date;
        const next = REVIEW_OFFSETS.find(o => o > diff);
        if (next == null) return 'expired';
        return `J${OFFSET_TO_DAY[next]} in ${next - diff} session(s)`;
    };

    const rows = sentences
        .sort((a, b) => a.date - b.date)
        .map(s => {
            const diff = currentCount - s.date;
            const label = OFFSET_TO_DAY[diff] != null ? `J${OFFSET_TO_DAY[diff]}` : (diff > REVIEW_LAST_OFFSET ? 'expired' : `filler (${diff})`);
            const next = nextReview(s.date);
            return `<div style="border-bottom:1px solid var(--border-color); padding:8px 0; font-size:0.85rem;">
                <div style="display:flex; justify-content:space-between; gap:8px;">
                    <span style="color:var(--text-light); flex:1;">${s.french}</span>
                    <span style="color:var(--text-muted); white-space:nowrap;">intro: ${s.date} · now: <b style="color:var(--text-light);">${label}</b> · next: ${next}</span>
                </div>
                <div style="color:var(--text-muted); font-size:0.8rem; margin-top:2px;">${s.arabic || ''}</div>
            </div>`;
        }).join('');

    document.getElementById('inspectorList').innerHTML = rows || '<p style="color:var(--text-muted);">No sentences stored yet.</p>';
    document.getElementById('sentenceInspectorModal').style.display = 'flex';
}

function resetSpeakingPractice() {
    stopSpeakingTimer();

    document.getElementById('speakingControls').style.display = 'block';
    document.getElementById('speakingContent').style.display = 'none';
    document.getElementById('sentenceDisplay').style.display = 'none';
    document.getElementById('completionScreen').style.display = 'none';
    document.getElementById('loadingIndicator').style.display = 'none';

    speakingSentences = [];
    currentSentenceIndex = 0;
    speakingStats = { correct: 0, wrong: 0 };
    speakingTimer = 0;
    document.getElementById('speakingTimer').textContent = '0:00';
}

function startSpeakingTimer() {
    stopSpeakingTimer(); // Clear any existing timer
    speakingTimer = 0;
    speakingTimerInterval = setInterval(() => {
        speakingTimer++;
        updateTimerDisplay();
    }, 1000);
}

function stopSpeakingTimer() {
    if (speakingTimerInterval) {
        clearInterval(speakingTimerInterval);
        speakingTimerInterval = null;
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(speakingTimer / 60);
    const seconds = speakingTimer % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('speakingTimer').textContent = timeString;
}
