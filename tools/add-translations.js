// Injecte des traductions arabes dans js/data/conversations.js
//
//   node tools/add-translations.js batch.json
//
// batch.json : { "<id-de-conversation>": ["ar ligne 0", "ar ligne 1", ...], ... }
// Le nombre de traductions doit correspondre exactement au nombre de répliques.

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'js', 'data', 'conversations.js');
const HEADER = fs.readFileSync(DATA, 'utf8').split('const CONVERSATIONS =')[0];

const batchPath = process.argv[2];
if (!batchPath) {
    console.error('usage: node tools/add-translations.js <batch.json>');
    process.exit(1);
}

const src = fs.readFileSync(DATA, 'utf8');
const conversations = eval(src + ';CONVERSATIONS');
const batch = JSON.parse(fs.readFileSync(batchPath, 'utf8'));

let injected = 0;
for (const [id, translations] of Object.entries(batch)) {
    const conv = conversations.find(c => c.id === id);
    if (!conv) {
        console.error(`✗ conversation inconnue : ${id}`);
        process.exit(1);
    }
    if (conv.lines.length !== translations.length) {
        console.error(`✗ ${id} : ${conv.lines.length} répliques mais ${translations.length} traductions`);
        process.exit(1);
    }
    conv.lines.forEach((line, i) => { line.ar = translations[i]; });
    injected += translations.length;
    console.log(`✓ ${id} — ${translations.length} lignes`);
}

fs.writeFileSync(DATA, HEADER + 'const CONVERSATIONS = ' + JSON.stringify(conversations, null, 1) + ';\n');

const ready = conversations.filter(c => c.lines.every(l => l.ar && l.ar.trim()));
const total = conversations.reduce((n, c) => n + c.lines.length, 0);
const doneLines = conversations.reduce((n, c) => n + c.lines.filter(l => l.ar).length, 0);
console.log(`\n${injected} lignes injectées`);
console.log(`total : ${ready.length}/${conversations.length} conversations complètes — ${doneLines}/${total} lignes traduites`);
