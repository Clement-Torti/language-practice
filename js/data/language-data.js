// Données de langue (arabe, français)

const ARABIC_DATA = {
    pronouns: ["أنا", "أنتَ", "أنتِ", "هو", "هما", "هي", "نحن", "أنتما", "أنتم", "أنتن", "هم", "هن"],
    wordForms: ["مفرد", "جمع", "مثنى", "مثنى منصوب/مجرور", "جمع منصوب/مجرور", "جمع"],
    tenses: [
        { name: "الماضي", hint: "Passé" }, 
        { name: "الحاضر", hint: "Présent" }, 
        { name: "المستقبل", hint: "Futur" }, 
        { name: "المضارع المجزوم", hint: "Subjonctif" }, 
        { name: "الأمر", hint: "impératif: أفعل => كُتِبْ / افتعل => اكْتُبْ" }, 
        { name: "الماضي التام", hint: "Plus-que-parfait: كان + passé" }, 
        { name: "الماضي الناقص", hint: "Imparfait: كان + présent" }, 
        { name: "المبني للمجهول الحاضر", hint: "Passif présent: يَكْتُبُ => يُكْتَبُ / يُدَرِّسُ => يُدَرَّسُ" }, 
        { name: "المبني للمجهول الماضي", hint: "Passif passé: كَتَبَ  => كُتِبَ / كان + مَفْعُول" }, 
        { name: "الشرط الماضي", hint: "Conditionel passé: لَوْ درستُ، لَنَجَحْتُ" }, 
        { name: "الشرط المضارع", hint: "Conditionel présent: إذا درسَ، سيَنجَحُ" }, 
        { name: "المصدر", hint: "Nom verbale: دَرَسَ => دِرَاسَة" }
    ],
    words: ARABIC_WORDS
};

// French language data
const FRENCH_DATA = {
    pronouns: ["je", "tu", "il", "elle", "nous", "vous", "ils", "elles"],
    wordForms: [],
    tenses: [
        { name: "présent", hint: "1er groupe: je parle, tu parles, il/elle/on parle, nous parlons, vous parlez, ils/elles parlent\n\n2ème groupe: je finis, tu finis, il/elle/on finit, nous finissons, vous finissez, ils/elles finissent\n\n3ème groupe: je vends, tu vends, il/elle/on vend, nous vendons, vous vendez, ils/elles vendent" },
        { name: "imparfait", hint: "1er groupe: je parlais, tu parlais, il/elle/on parlait, nous parlions, vous parliez, ils/elles parlaient\n\n2ème groupe: je finissais, tu finissais, il/elle/on finissait, nous finissions, vous finissiez, ils/elles finissaient\n\n3ème groupe: je vendais, tu vendais, il/elle/on vendait, nous vendions, vous vendiez, ils/elles vendaient" },
        { name: "futur simple", hint: "1er groupe: je parlerai, tu parleras, il/elle/on parlera, nous parlerons, vous parlerez, ils/elles parleront\n\n2ème groupe: je finirai, tu finiras, il/elle/on finira, nous finirons, vous finirez, ils/elles finiront\n\n3ème groupe: je vendrai, tu vendras, il/elle/on vendra, nous vendrons, vous vendrez, ils/elles vendront" },
        { name: "passé composé", hint: "1er groupe: j'ai parlé, tu as parlé, il/elle/on a parlé, nous avons parlé, vous avez parlé, ils/elles ont parlé\n\n2ème groupe: j'ai fini, tu as fini, il/elle/on a fini, nous avons fini, vous avez fini, ils/elles ont fini\n\n3ème groupe: j'ai vendu, tu as vendu, il/elle/on a vendu, nous avons vendu, vous avez vendu, ils/elles ont vendu" },
        { name: "infinitif", hint: "1er groupe: parler\n\n2ème groupe: finir\n\n3ème groupe: vendre" }
    ],
    words: [
        { "tense1": "Uno", "tense2": "Un", "type": "word" }
    ]
};
