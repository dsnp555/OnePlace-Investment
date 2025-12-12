/**
 * Unit tests for risk assessment functions
 */

import {
    calculateRiskScore,
    getRiskProfile,
    assessRisk,
    calculateEmergencyFund,
    calculateFIRENumber,
    estimateYearsToFIRE,
    getDefaultExpectedReturn,
    DEFAULT_ASSET_CATEGORIES,
    ALLOCATION_PRESETS,
    RISK_QUESTIONS,
} from '../risk';
import { RiskQuestionnaireAnswer } from '../types';

describe('DEFAULT_ASSET_CATEGORIES', () => {
    it('should have all expected categories', () => {
        expect(DEFAULT_ASSET_CATEGORIES.length).toBeGreaterThan(10);

        const categoryNames = DEFAULT_ASSET_CATEGORIES.map(c => c.name);
        expect(categoryNames).toContain('Stocks');
        expect(categoryNames).toContain('Mutual Funds');
        expect(categoryNames).toContain('Gold');
        expect(categoryNames).toContain('Bonds');
    });

    it('should have reasonable default returns', () => {
        DEFAULT_ASSET_CATEGORIES.forEach(cat => {
            expect(cat.defaultExpectedReturn).toBeGreaterThan(0);
            expect(cat.defaultExpectedReturn).toBeLessThan(0.25);
        });
    });
});

describe('getDefaultExpectedReturn', () => {
    it('should return correct rate for known category', () => {
        expect(getDefaultExpectedReturn('Stocks')).toBe(0.12);
        expect(getDefaultExpectedReturn('stocks')).toBe(0.12);
        expect(getDefaultExpectedReturn('Gold')).toBe(0.07);
    });

    it('should return 8% default for unknown category', () => {
        expect(getDefaultExpectedReturn('Unknown Category')).toBe(0.08);
    });
});

describe('ALLOCATION_PRESETS', () => {
    it('should have all three risk profiles', () => {
        expect(ALLOCATION_PRESETS.conservative).toBeDefined();
        expect(ALLOCATION_PRESETS.balanced).toBeDefined();
        expect(ALLOCATION_PRESETS.aggressive).toBeDefined();
    });

    it('should have allocations summing to 100% for each profile', () => {
        Object.values(ALLOCATION_PRESETS).forEach(allocations => {
            const sum = allocations.reduce((s, a) => s + a.percent, 0);
            expect(sum).toBe(100);
        });
    });
});

describe('RISK_QUESTIONS', () => {
    it('should have 8 questions', () => {
        expect(RISK_QUESTIONS.length).toBe(8);
    });

    it('should have valid structure for each question', () => {
        RISK_QUESTIONS.forEach(q => {
            expect(q.id).toBeTruthy();
            expect(q.question).toBeTruthy();
            expect(q.options.length).toBeGreaterThan(0);
            expect(q.weight).toBeGreaterThan(0);
        });
    });
});

describe('calculateRiskScore', () => {
    it('should return 50 for empty answers', () => {
        expect(calculateRiskScore([])).toBe(50);
    });

    it('should return high score for aggressive answers', () => {
        const answers: RiskQuestionnaireAnswer[] = RISK_QUESTIONS.map(q => ({
            questionId: q.id,
            score: 5, // Max score
        }));

        const score = calculateRiskScore(answers);
        expect(score).toBe(100);
    });

    it('should return low score for conservative answers', () => {
        const answers: RiskQuestionnaireAnswer[] = RISK_QUESTIONS.map(q => ({
            questionId: q.id,
            score: 1, // Min score
        }));

        const score = calculateRiskScore(answers);
        expect(score).toBe(20);
    });

    it('should return middle score for balanced answers', () => {
        const answers: RiskQuestionnaireAnswer[] = RISK_QUESTIONS.map(q => ({
            questionId: q.id,
            score: 3, // Middle score
        }));

        const score = calculateRiskScore(answers);
        expect(score).toBe(60);
    });
});

describe('getRiskProfile', () => {
    it('should return conservative for low scores', () => {
        expect(getRiskProfile(20)).toBe('conservative');
        expect(getRiskProfile(39)).toBe('conservative');
    });

    it('should return balanced for middle scores', () => {
        expect(getRiskProfile(40)).toBe('balanced');
        expect(getRiskProfile(50)).toBe('balanced');
        expect(getRiskProfile(69)).toBe('balanced');
    });

    it('should return aggressive for high scores', () => {
        expect(getRiskProfile(70)).toBe('aggressive');
        expect(getRiskProfile(100)).toBe('aggressive');
    });
});

describe('assessRisk', () => {
    it('should return complete assessment', () => {
        const answers: RiskQuestionnaireAnswer[] = [
            { questionId: 'age_group', score: 5 },
            { questionId: 'investment_horizon', score: 5 },
        ];

        const assessment = assessRisk(answers);

        expect(assessment.score).toBeGreaterThan(0);
        expect(['conservative', 'balanced', 'aggressive']).toContain(assessment.profile);
        expect(assessment.suggestedAllocations.length).toBeGreaterThan(0);
    });
});

describe('calculateEmergencyFund', () => {
    it('should return higher fund for conservative profile', () => {
        const conservative = calculateEmergencyFund(50000, 'conservative');
        const aggressive = calculateEmergencyFund(50000, 'aggressive');

        expect(conservative.minimum).toBeGreaterThan(aggressive.minimum);
        expect(conservative.recommended).toBeGreaterThan(aggressive.recommended);
    });

    it('should calculate correct amounts', () => {
        const fund = calculateEmergencyFund(50000, 'balanced');

        expect(fund.minimum).toBe(50000 * 6);
        expect(fund.recommended).toBe(50000 * 8);
        expect(fund.ideal).toBe(50000 * 10);
    });
});

describe('calculateFIRENumber', () => {
    it('should calculate FIRE number with 4% rule', () => {
        // Annual expenses of ₹6,00,000
        const fire = calculateFIRENumber(600000);
        expect(fire).toBe(15000000); // 1.5 crore
    });

    it('should calculate with custom withdrawal rate', () => {
        const fire = calculateFIRENumber(600000, 0.03);
        expect(fire).toBe(20000000);
    });

    it('should return Infinity for 0 withdrawal rate', () => {
        expect(calculateFIRENumber(600000, 0)).toBe(Infinity);
    });
});

describe('estimateYearsToFIRE', () => {
    it('should return 0 if already at FIRE number', () => {
        const years = estimateYearsToFIRE(15000000, 50000, 0.10, 15000000);
        expect(years).toBe(0);
    });

    it('should estimate reasonable years', () => {
        const years = estimateYearsToFIRE(
            1000000, // Current savings: 10 lakh
            50000,   // Monthly contribution: 50k
            0.10,    // 10% expected return
            15000000 // Target: 1.5 crore
        );

        expect(years).toBeGreaterThan(5);
        expect(years).toBeLessThan(20);
    });

    it('should return Infinity if impossible', () => {
        const years = estimateYearsToFIRE(0, 0, 0, 15000000);
        expect(years).toBe(Infinity);
    });
});
