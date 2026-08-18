// Tirage aléatoire de phrases dans les conversations de l'onglet Expression.
//
// Deux nombres aléatoires sont tirés : le premier désigne la conversation,
// le second la phrase à l'intérieur de cette conversation.
//
// Attention : une réplique n'est pas une phrase. Une réplique peut en contenir
// plusieurs, séparées par la ponctuation. Une phrase de moins de MIN_WORDS mots
// n'est pas considérée comme complète : on lui ajoute la phrase suivante.
//
// La traduction arabe n'existe qu'au niveau de la réplique entière : on affiche
// donc toute la réplique en arabe, à l'utilisateur d'y isoler la phrase.

const MIN_WORDS = 5;
const PICKED_SENTENCES_KEY = 'speaking_picked_sentences';

// Cache des découpages, calculés une seule fois par conversation.
const sentenceCache = new Map();

// ── Découpage d'une réplique en phrases ────────────────────────────────────

function countWords(text) {
    return text.trim().split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
}

// Découpe sur la ponctuation forte, puis agrège tant qu'on n'a pas MIN_WORDS mots.
function splitIntoSentences(text) {
    const chunks = (text.match(/[^.!?…]+[.!?…]*/g) || [text])
        .map(s => s.trim())
        .filter(Boolean);

    const sentences = [];
    let buffer = '';

    for (const chunk of chunks) {
        buffer = buffer ? `${buffer} ${chunk}` : chunk;
        if (countWords(buffer) >= MIN_WORDS) {
            sentences.push(buffer);
            buffer = '';
        }
    }

    // Reste trop court en fin de réplique : on le rattache à la phrase précédente.
    if (buffer) {
        if (sentences.length) {
            sentences[sentences.length - 1] += ` ${buffer}`;
        } else {
            sentences.push(buffer);
        }
    }

    return sentences;
}

// Toutes les phrases d'une conversation, à plat, avec leur réplique d'origine.
function getConversationSentences(conv) {
    if (sentenceCache.has(conv.id)) return sentenceCache.get(conv.id);

    const sentences = [];
    conv.lines.forEach((line, lineIndex) => {
        splitIntoSentences(line.fr).forEach(sentence => {
            sentences.push({
                sentence,                 // la phrase à traduire
                replicaFr: line.fr,       // la réplique complète en français
                replicaAr: line.ar,       // la réplique complète en arabe
                speaker: line.speaker,
                lineIndex
            });
        });
    });

    sentenceCache.set(conv.id, sentences);
    return sentences;
}

// ── Tirage aléatoire ───────────────────────────────────────────────────────

// Entier dans [0, max) sans biais de modulo, via crypto quand c'est disponible.
function randomInt(max) {
    if (max <= 0) return 0;

    if (window.crypto && window.crypto.getRandomValues) {
        const limit = Math.floor(0xFFFFFFFF / max) * max;
        const buffer = new Uint32Array(1);
        let value;
        do {
            window.crypto.getRandomValues(buffer);
            value = buffer[0];
        } while (value >= limit);
        return value % max;
    }

    return Math.floor(Math.random() * max);
}

// Clés déjà tirées, mémorisées pour ne jamais retomber deux fois sur la même phrase.
// On utilise l'id de la conversation plutôt que son index : les index bougent
// dès qu'une conversation est ajoutée, l'id non.
function getPickedKeys() {
    try {
        return new Set(JSON.parse(localStorage.getItem(getStorageKey(PICKED_SENTENCES_KEY))) || []);
    } catch (e) {
        return new Set();
    }
}

function savePickedKeys(keys) {
    localStorage.setItem(getStorageKey(PICKED_SENTENCES_KEY), JSON.stringify([...keys]));
}

function resetPickedSentences() {
    localStorage.removeItem(getStorageKey(PICKED_SENTENCES_KEY));
}

// Tire `count` phrases jamais vues, dans les conversations entièrement traduites.
function pickSentencesFromConversations(count) {
    const pool = CONVERSATIONS.filter(isConvReady);
    if (pool.length === 0) return [];

    const picked = getPickedKeys();
    const total = pool.reduce((sum, conv) => sum + getConversationSentences(conv).length, 0);

    // Tout a été vu : on repart d'un tour neuf.
    if (picked.size >= total) {
        picked.clear();
        resetPickedSentences();
    }

    const results = [];
    const drawn = new Set();
    const maxAttempts = 2000;

    for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt++) {
        const convIndex = randomInt(pool.length);              // 1er nombre aléatoire
        const sentences = getConversationSentences(pool[convIndex]);
        if (sentences.length === 0) continue;

        const sentenceIndex = randomInt(sentences.length);     // 2e nombre aléatoire
        const key = `${pool[convIndex].id}:${sentenceIndex}`;
        if (picked.has(key) || drawn.has(key)) continue;

        drawn.add(key);
        results.push(toSpeakingSentence(sentences[sentenceIndex], key));
    }

    // Si le tirage patine (presque tout a déjà été vu), on balaie ce qui reste.
    if (results.length < count) {
        for (const conv of pool) {
            for (const [index, entry] of getConversationSentences(conv).entries()) {
                if (results.length >= count) break;
                const key = `${conv.id}:${index}`;
                if (picked.has(key) || drawn.has(key)) continue;
                drawn.add(key);
                results.push(toSpeakingSentence(entry, key));
            }
        }
    }

    savePickedKeys([...picked, ...drawn]);
    return results;
}

// L'arabe affiché est la réplique entière : la traduction phrase à phrase n'existe pas.
function toSpeakingSentence(entry, key) {
    return {
        french: entry.sentence,
        arabic: entry.replicaAr,
        replicaFr: entry.replicaFr,
        speaker: entry.speaker,
        source: key
    };
}
