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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const phrasePatterns = bannedPhrases
    .sort((left, right) => right.length - left.length)
    .map((phrase) => new RegExp(`\\b${phrase.split(/\s+/).map(escapeRegex).join('\\s+')}\\b`, 'gi'));
const wordPatterns = bannedWords.map((word) => new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi'));

export const maskReviewProfanity = (comment) => {
    let masked = comment;
    for (const pattern of phrasePatterns) {
        masked = masked.replace(pattern, (phrase) => '*'.repeat(phrase.length));
    }
    for (const pattern of wordPatterns) {
        masked = masked.replace(pattern, (word) => '*'.repeat(word.length));
    }
    return masked;
};
