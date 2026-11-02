import { describe, expect, it } from 'vitest';
import { maskReviewProfanity } from './reviewModeration';

describe('maskReviewProfanity', () => {
    it('replaces English and Tagalog profanity with asterisks', () => {
        const result = maskReviewProfanity('Bobo, tangina mo, fuck you, gago.');

        expect(result).not.toMatch(/bobo|tangina|fuck|gago/i);
        expect(result).toMatch(/\*{4,}/);
    });

    it('keeps clean review text unchanged', () => {
        const review = 'The delivery was fast and the product works well.';

        expect(maskReviewProfanity(review)).toBe(review);
    });

    it('masks full profane phrases including connective words', () => {
        expect(maskReviewProfanity('what the fuck')).toBe('*'.repeat('what the fuck'.length));
        expect(maskReviewProfanity('putangina mo')).toBe('*'.repeat('putangina mo'.length));
    });

    it('masks all requested Filipino and English words and phrases', () => {
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
            expect(maskReviewProfanity(term)).toBe('*'.repeat(term.length));
        }
    });
});
