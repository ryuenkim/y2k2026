const { Filter } = require('bad-words');

const bannedWords = [
    'bobo',
    'tanga',
    'tangina',
    'putangina',
    'gago',
    'gaga',
    'tarantado',
    'inutil',
    'fuck',
    'bitch',
    'motherfucker',
    'wtf'
];
const bannedPhrases = ['tangina mo', 'putangina mo', 'fuck you', 'what the fuck'];
const filter = new Filter();
filter.addWords(...bannedWords);

const phrasePatterns = bannedPhrases.map((phrase) => new RegExp(
    `\\b${phrase.split(/\s+/).map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+')}\\b`,
    'gi'
));

const maskProfanity = (comment) => {
    let cleaned = comment;
    for (const pattern of phrasePatterns) {
        cleaned = cleaned.replace(pattern, (phrase) => '*'.repeat(phrase.length));
    }
    return filter.clean(cleaned);
};

module.exports = { maskProfanity };
