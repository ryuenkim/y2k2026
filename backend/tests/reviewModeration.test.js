const test = require('node:test');
const assert = require('node:assert/strict');
const { maskProfanity } = require('../utils/reviewModeration');

test('review moderation masks English and Tagalog profanity and phrases', () => {
    const review = maskProfanity('Bobo, tanga, tangina mo, putangina mo, fuck you, bitch, what the fuck, gago, tarantado, inutil.');
    for (const word of ['Bobo', 'tanga', 'tangina', 'putangina', 'fuck', 'bitch', 'gago', 'tarantado', 'inutil']) {
        assert.doesNotMatch(review.toLowerCase(), new RegExp(word));
    }
    assert.match(review, /\*{8,}/);
    assert.doesNotMatch(review, /what the/i);
});

test('review moderation keeps clean text readable', () => {
    const review = 'The delivery was fast and the product works well.';
    assert.equal(maskProfanity(review), review);
});

test('review moderation masks the requested Filipino and English words and phrases', () => {
    const terms = [
        'gago',
        'Tangina mo',
        'Tangina',
        'gaga',
        'putangina mo',
        'bitch',
        'tanga',
        'bobo',
        'fuck you',
        'motherfucker',
        'wtf'
    ];

    for (const term of terms) {
        assert.equal(maskProfanity(term), '*'.repeat(term.length), `Expected "${term}" to be fully masked`);
    }
});

test('review moderation masks requested words regardless of capitalization and punctuation', () => {
    const review = maskProfanity('GAGA! TANGINA, WtF? Motherfucker.');

    assert.doesNotMatch(review, /gaga|tangina|wtf|motherfucker/i);
});
