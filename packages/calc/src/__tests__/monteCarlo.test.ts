/**
 * Monte Carlo Simulation Tests
 */

import {
    runMonteCarloSimulation,
    getDefaultVolatility,
    calculatePortfolioVolatility,
    DEFAULT_VOLATILITY,
    MonteCarloParams,
} from '../monteCarlo';

describe('Monte Carlo Simulation', () => {
    describe('runMonteCarloSimulation', () => {
        it('should run lumpsum simulation with correct structure', () => {
            const params: MonteCarloParams = {
                mode: 'lumpsum',
                amount: 100000,
                durationYears: 10,
                expectedReturn: 0.12,
                volatility: 0.15,
                simulations: 100,
            };

            const result = runMonteCarloSimulation(params);

            expect(result.simulationCount).toBe(100);
            expect(result.finalValues).toHaveLength(100);
            expect(result.statistics).toBeDefined();
            expect(result.percentiles).toBeDefined();
            expect(result.confidenceIntervals).toHaveLength(7);
            expect(result.yearlyBands).toHaveLength(10);
        });

        it('should run SIP simulation correctly', () => {
            const params: MonteCarloParams = {
                mode: 'sip',
                amount: 10000,
                durationYears: 5,
                expectedReturn: 0.12,
                volatility: 0.15,
                simulations: 100,
            };

            const result = runMonteCarloSimulation(params);

            expect(result.simulationCount).toBe(100);
            expect(result.yearlyBands).toHaveLength(5);
            // Median should be roughly near expected (with variance)
            expect(result.percentiles.p50).toBeGreaterThan(0);
        });

        it('should have sorted final values', () => {
            const params: MonteCarloParams = {
                mode: 'lumpsum',
                amount: 100000,
                durationYears: 5,
                expectedReturn: 0.10,
                volatility: 0.15,
                simulations: 100,
            };

            const result = runMonteCarloSimulation(params);

            // Verify sorting
            for (let i = 1; i < result.finalValues.length; i++) {
                expect(result.finalValues[i]).toBeGreaterThanOrEqual(result.finalValues[i - 1]);
            }
        });

        it('should have correct percentile ordering', () => {
            const params: MonteCarloParams = {
                mode: 'lumpsum',
                amount: 100000,
                durationYears: 10,
                expectedReturn: 0.12,
                volatility: 0.18,
                simulations: 500,
            };

            const result = runMonteCarloSimulation(params);
            const { p10, p25, p50, p75, p90 } = result.percentiles;

            expect(p10).toBeLessThanOrEqual(p25);
            expect(p25).toBeLessThanOrEqual(p50);
            expect(p50).toBeLessThanOrEqual(p75);
            expect(p75).toBeLessThanOrEqual(p90);
        });

        it('should calculate probability metrics', () => {
            const params: MonteCarloParams = {
                mode: 'lumpsum',
                amount: 100000,
                durationYears: 10,
                expectedReturn: 0.12,
                volatility: 0.15,
                simulations: 500,
            };

            const result = runMonteCarloSimulation(params);

            // Probability metrics should be percentages (0-100)
            expect(result.probabilityMetrics.probDouble).toBeGreaterThanOrEqual(0);
            expect(result.probabilityMetrics.probDouble).toBeLessThanOrEqual(100);
            expect(result.probabilityMetrics.probLoss).toBeGreaterThanOrEqual(0);
            expect(result.probabilityMetrics.probLoss).toBeLessThanOrEqual(100);
        });

        it('should apply inflation adjustment when specified', () => {
            const paramsNoInflation: MonteCarloParams = {
                mode: 'lumpsum',
                amount: 100000,
                durationYears: 10,
                expectedReturn: 0.12,
                volatility: 0.10,
                simulations: 100,
            };

            const paramsWithInflation: MonteCarloParams = {
                ...paramsNoInflation,
                inflationRate: 0.05,
            };

            const resultNoInflation = runMonteCarloSimulation(paramsNoInflation);
            const resultWithInflation = runMonteCarloSimulation(paramsWithInflation);

            // Inflation-adjusted values should be lower
            expect(resultWithInflation.statistics.median).toBeLessThan(
                resultNoInflation.statistics.median
            );
        });

        it('should generate yearly bands for visualization', () => {
            const params: MonteCarloParams = {
                mode: 'sip',
                amount: 10000,
                durationYears: 5,
                expectedReturn: 0.12,
                volatility: 0.15,
                simulations: 100,
            };

            const result = runMonteCarloSimulation(params);

            expect(result.yearlyBands).toHaveLength(5);
            result.yearlyBands.forEach((band, idx) => {
                expect(band.year).toBe(idx + 1);
                expect(band.p10).toBeLessThanOrEqual(band.p25);
                expect(band.p25).toBeLessThanOrEqual(band.p50);
                expect(band.p50).toBeLessThanOrEqual(band.p75);
                expect(band.p75).toBeLessThanOrEqual(band.p90);
            });
        });

        it('should use default 1000 simulations when not specified', () => {
            const params: MonteCarloParams = {
                mode: 'lumpsum',
                amount: 100000,
                durationYears: 5,
                expectedReturn: 0.10,
                volatility: 0.15,
            };

            const result = runMonteCarloSimulation(params);
            expect(result.simulationCount).toBe(1000);
        });
    });

    describe('getDefaultVolatility', () => {
        it('should return correct volatility for known categories', () => {
            expect(getDefaultVolatility('stocks')).toBe(0.20);
            expect(getDefaultVolatility('bonds')).toBe(0.06);
            expect(getDefaultVolatility('gold')).toBe(0.12);
            expect(getDefaultVolatility('crypto')).toBe(0.60);
            expect(getDefaultVolatility('fixed_deposits')).toBe(0.01);
        });

        it('should be case-insensitive', () => {
            expect(getDefaultVolatility('STOCKS')).toBe(0.20);
            expect(getDefaultVolatility('Bonds')).toBe(0.06);
        });

        it('should handle spaces in category names', () => {
            expect(getDefaultVolatility('fixed deposits')).toBe(0.01);
            expect(getDefaultVolatility('real estate')).toBe(0.10);
        });

        it('should return default volatility for unknown categories', () => {
            expect(getDefaultVolatility('unknown_category')).toBe(0.15);
            expect(getDefaultVolatility('xyz')).toBe(0.15);
        });
    });

    describe('calculatePortfolioVolatility', () => {
        it('should calculate weighted average volatility', () => {
            const allocations = [
                { category: 'stocks', percent: 60 },
                { category: 'bonds', percent: 40 },
            ];

            const volatility = calculatePortfolioVolatility(allocations);

            // Expected: 0.60 * 0.20 + 0.40 * 0.06 = 0.12 + 0.024 = 0.144
            expect(volatility).toBeCloseTo(0.144, 2);
        });

        it('should handle non-normalized percentages', () => {
            const allocations = [
                { category: 'stocks', percent: 30 },
                { category: 'bonds', percent: 20 },
            ];

            // Should normalize: 30/50 = 0.6, 20/50 = 0.4
            const volatility = calculatePortfolioVolatility(allocations);
            expect(volatility).toBeCloseTo(0.144, 2);
        });

        it('should return default for empty allocations', () => {
            expect(calculatePortfolioVolatility([])).toBe(0.15);
        });

        it('should handle single allocation', () => {
            const allocations = [{ category: 'stocks', percent: 100 }];
            expect(calculatePortfolioVolatility(allocations)).toBe(0.20);
        });
    });

    describe('DEFAULT_VOLATILITY', () => {
        it('should have entries for common asset classes', () => {
            expect(DEFAULT_VOLATILITY.stocks).toBeDefined();
            expect(DEFAULT_VOLATILITY.bonds).toBeDefined();
            expect(DEFAULT_VOLATILITY.gold).toBeDefined();
            expect(DEFAULT_VOLATILITY.mutual_funds).toBeDefined();
            expect(DEFAULT_VOLATILITY.crypto).toBeDefined();
        });

        it('should have volatilities between 0 and 1', () => {
            Object.values(DEFAULT_VOLATILITY).forEach((vol) => {
                expect(vol).toBeGreaterThan(0);
                expect(vol).toBeLessThanOrEqual(1);
            });
        });

        it('should have crypto as highest volatility', () => {
            const maxVol = Math.max(...Object.values(DEFAULT_VOLATILITY));
            expect(DEFAULT_VOLATILITY.crypto).toBe(maxVol);
        });
    });
});
