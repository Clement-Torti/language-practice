// Onglet Expression — exercice de conversation français → arabe (MSA)
//
// L'utilisateur voit chaque réplique en français et doit la traduire en arabe,
// pour TOUTES les lignes (pas seulement celles d'un locuteur).
// Les conversations viennent de CONVERSATIONS (js/data/conversations.js),
// triées de la plus ancienne à la plus récente.

const CONV_PROGRESS_KEY = 'expression_conversations_done';

let convIndex = -1;      // index de la conversation en cours dans CONVERSATIONS
let convLine = -1;       // index de la réplique affichée
let convPrevLine = null; // réplique précédente (affichée en filigrane)
let convRevealed = false;
let convPlaySession = 0; // invalide les lectures en cours quand on change d'écran
let convPlayIdx = 0;
let convPlayPaused = false;
let convPlayRate = 0.9;

// ── Progression ────────────────────────────────────────────────────────────

function getConvProgress() {
    try {
        return JSON.parse(localStorage.getItem(CONV_PROGRESS_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function setConvDone(id) {
    const done = getConvProgress();
    done[id] = true;
    localStorage.setItem(CONV_PROGRESS_KEY, JSON.stringify(done));
}

// Une conversation n'est jouable que si chaque réplique a sa traduction arabe.
function isConvReady(conv) {
    return conv.lines.length > 0 && conv.lines.every(l => l.ar && l.ar.trim());
}

function resetConversationProgress() {
    if (!confirm('Reset your conversation progress? The list starts over from the oldest one.')) return;
    localStorage.removeItem(CONV_PROGRESS_KEY);
    renderConversationList();
}

// ── Liste des conversations ────────────────────────────────────────────────

function renderConversationList() {
    const list = document.getElementById('convList');
    if (!list) return;

    const done = getConvProgress();
    const ready = CONVERSATIONS.filter(isConvReady);

    list.innerHTML = '';
    CONVERSATIONS.forEach((conv, i) => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action';

        const isDone = !!done[conv.id];
        const playable = isConvReady(conv);
        if (!playable) item.classList.add('conv-item-locked');

        let badge = '';
        if (!playable) {
            badge = '<span class="conv-item-badge" style="background: rgba(255,255,255,0.08); color: var(--text-muted);">no translation yet</span>';
        } else if (isDone) {
            badge = '<span class="conv-item-badge" style="background: rgba(46,204,113,0.15); color: var(--success-color);">done</span>';
        }

        item.innerHTML = `<span class="conv-item-date">${conv.date}</span>${escapeConvHtml(conv.title)}${badge}`;
        item.onclick = (e) => {
            e.preventDefault();
            if (playable) startConversation(i);
        };
        list.appendChild(item);
    });

    const doneCount = ready.filter(c => done[c.id]).length;
    const counter = document.getElementById('expressionDone');
    if (counter) counter.textContent = `${doneCount}/${ready.length}`;
}

// Reprend à la première conversation non terminée (la plus ancienne d'abord).
function continueConversations() {
    const done = getConvProgress();
    const next = CONVERSATIONS.findIndex(c => isConvReady(c) && !done[c.id]);

    if (next === -1) {
        quitConversation();
        alert('Every available conversation is done. New ones will show up here once translated.');
        return;
    }
    startConversation(next);
}

// ── Déroulé de l'exercice ──────────────────────────────────────────────────

function startConversation(index) {
    convIndex = index;
    convLine = -1;
    convPrevLine = null;
    convPlaySession++;

    const conv = CONVERSATIONS[convIndex];
    document.getElementById('convPicker').style.display = 'none';
    document.getElementById('convDoneWrap').style.display = 'none';
    document.getElementById('convListenWrap').style.display = 'none';
    document.getElementById('convIntroWrap').style.display = 'block';
    document.getElementById('convStage').style.display = 'block';
    document.getElementById('convActionArea').style.display = 'block';
    document.getElementById('convListenControls').style.display = 'none';
    document.getElementById('convIntro').textContent = conv.intro;

    startExpressionTimer();
    nextConvLine();
}

function quitConversation() {
    convPlaySession++;
    window.speechSynthesis.cancel();
    stopExpressionTimer();

    document.getElementById('convStage').style.display = 'none';
    document.getElementById('convIntroWrap').style.display = 'none';
    document.getElementById('convListenWrap').style.display = 'none';
    document.getElementById('convDoneWrap').style.display = 'none';
    document.getElementById('convPicker').style.display = 'block';
    renderConversationList();
}

function nextConvLine() {
    const lines = CONVERSATIONS[convIndex].lines;

    if (convLine >= 0) convPrevLine = lines[convLine];
    convLine++;

    if (convLine >= lines.length) {
        finishConversationRound();
        return;
    }

    const line = lines[convLine];
    convRevealed = false;

    document.getElementById('convPrev').textContent = convPrevLine
        ? `${convPrevLine.speaker} : « ${convPrevLine.fr} »`
        : '';
    document.getElementById('convCounter').textContent = `${convLine + 1}/${lines.length}`;

    const speakerEl = document.getElementById('convSpeaker');
    speakerEl.textContent = line.speaker;
    speakerEl.style.color = convSpeakerColor(line.speaker);

    const frEl = document.getElementById('convFr');
    frEl.textContent = line.fr;
    frEl.classList.remove('conv-anim');
    void frEl.offsetWidth;
    frEl.classList.add('conv-anim');

    // L'arabe reste masqué : c'est ce que l'utilisateur doit produire.
    const arEl = document.getElementById('convAr');
    arEl.textContent = '……';
    arEl.classList.add('is-hidden');

    setConvActionBtn('reveal');
}

function revealConvArabic() {
    const line = CONVERSATIONS[convIndex].lines[convLine];
    const arEl = document.getElementById('convAr');

    arEl.textContent = line.ar;
    arEl.classList.remove('is-hidden');
    arEl.classList.remove('conv-anim');
    void arEl.offsetWidth;
    arEl.classList.add('conv-anim');

    convRevealed = true;
    currentAudioText = line.ar;
    speakText(line.ar);
    setConvActionBtn('next');
}

function setConvActionBtn(mode) {
    const btn = document.getElementById('convActionBtn');
    if (!btn) return;

    const isLast = convLine === CONVERSATIONS[convIndex].lines.length - 1;

    if (mode === 'reveal') {
        btn.innerHTML = '<i class="fas fa-eye me-2"></i>Show the Arabic';
        btn.onclick = revealConvArabic;
    } else {
        btn.innerHTML = isLast
            ? '<i class="fas fa-check me-2"></i>Finish'
            : 'Next <i class="fas fa-arrow-right ms-2"></i>';
        btn.onclick = nextConvLine;
    }
}

function replayConvAudio() {
    if (convRevealed) {
        speakText(CONVERSATIONS[convIndex].lines[convLine].ar);
    }
}

function convSpeakerColor(speaker) {
    const normalized = speaker.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return normalized === 'Rosalia' ? '#e74c3c' : '#4ECDC4';
}

function escapeConvHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Fin de la traduction : écoute intégrale ────────────────────────────────

function finishConversationRound() {
    stopExpressionTimer();
    document.getElementById('convStage').style.display = 'none';
    document.getElementById('convListenWrap').style.display = 'block';
}

function playWholeConversation() {
    document.getElementById('convListenWrap').style.display = 'none';
    document.getElementById('convStage').style.display = 'block';
    document.getElementById('convActionArea').style.display = 'none';
    document.getElementById('convListenControls').style.display = 'flex';
    document.getElementById('convPauseIcon').className = 'fas fa-pause';

    convPrevLine = null;
    convPlayPaused = false;
    startExpressionTimer();
    playConvFrom(0);
}

function playConvFrom(startIdx) {
    const session = ++convPlaySession;
    const lines = CONVERSATIONS[convIndex].lines;

    const playLine = (idx) => {
        if (session !== convPlaySession) return;

        if (idx >= lines.length) {
            completeConversation();
            return;
        }

        convPlayIdx = idx;
        const line = lines[idx];

        document.getElementById('convCounter').textContent = `${idx + 1}/${lines.length}`;
        document.getElementById('convPrev').textContent = idx > 0
            ? `${lines[idx - 1].speaker} : « ${lines[idx - 1].fr} »`
            : '';

        const speakerEl = document.getElementById('convSpeaker');
        speakerEl.textContent = line.speaker;
        speakerEl.style.color = convSpeakerColor(line.speaker);

        document.getElementById('convFr').textContent = line.fr;

        const arEl = document.getElementById('convAr');
        arEl.textContent = line.ar;
        arEl.classList.remove('is-hidden');
        arEl.classList.remove('conv-anim');
        void arEl.offsetWidth;
        arEl.classList.add('conv-anim');

        speakConvLine(line.ar, () => {
            if (session !== convPlaySession) return;
            setTimeout(() => {
                if (session === convPlaySession) playLine(idx + 1);
            }, 280);
        });
    };

    playLine(startIdx);
}

// Lecture arabe avec vitesse réglable, et callback de fin.
function speakConvLine(text, onEnd) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = convPlayRate;
    utterance.pitch = 1;
    utterance.onend = onEnd;
    utterance.onerror = () => onEnd && onEnd();

    window.speechSynthesis.speak(utterance);
}

function convPlayerToggle() {
    const icon = document.getElementById('convPauseIcon');
    if (convPlayPaused) {
        convPlayPaused = false;
        icon.className = 'fas fa-pause';
        playConvFrom(convPlayIdx);
    } else {
        convPlayPaused = true;
        icon.className = 'fas fa-play';
        convPlaySession++;
        window.speechSynthesis.cancel();
    }
}

function convPlayerNext() {
    convPlayPaused = false;
    document.getElementById('convPauseIcon').className = 'fas fa-pause';
    playConvFrom(Math.min(convPlayIdx + 1, CONVERSATIONS[convIndex].lines.length - 1));
}

function convPlayerPrev() {
    convPlayPaused = false;
    document.getElementById('convPauseIcon').className = 'fas fa-pause';
    playConvFrom(Math.max(convPlayIdx - 1, 0));
}

function convPlayerRate(rate) {
    convPlayRate = parseFloat(rate);
}

function completeConversation() {
    stopExpressionTimer();
    window.speechSynthesis.cancel();

    setConvDone(CONVERSATIONS[convIndex].id);

    const completions = parseInt(getLocalStorageValue(getStorageKey('expression'))) || 0;
    setLocalStorageValue(getStorageKey('expression'), completions + 1);
    updateAllStats();

    document.getElementById('convStage').style.display = 'none';
    document.getElementById('convIntroWrap').style.display = 'none';
    document.getElementById('convDoneWrap').style.display = 'block';
    renderConversationList();
}

// ── Chronomètre ────────────────────────────────────────────────────────────

function startExpressionTimer() {
    stopExpressionTimer();
    gameStates.expression.timeLeft = 0;
    gameStates.expression.isRunning = true;
    updateExpressionTimerDisplay();

    gameTimers.expression = setInterval(() => {
        gameStates.expression.timeLeft++;
        updateExpressionTimerDisplay();
    }, 1000);
}

function stopExpressionTimer() {
    clearInterval(gameTimers.expression);
    gameTimers.expression = null;
    gameStates.expression.isRunning = false;
}

function updateExpressionTimerDisplay() {
    const elapsed = gameStates.expression.timeLeft;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('expressionTimer').textContent =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
