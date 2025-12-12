'use client';

import { useState, useMemo } from 'react';
import { Loader2, TrendingUp, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
    runMonteCarloSimulation,
    calculatePortfolioVolatility,
    MonteCarloResult,
    MonteCarloParams,
} from '@oneplace/calc';

interface MonteCarloChartProps {
    mode: 'lumpsum' | 'sip';
    amount: number;
    durationYears: number;
    expectedReturn: number;
    allocations: { category: string; percent: number }[];
    inflationRate?: number;
}

const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function MonteCarloChart({
    mode,
    amount,
    durationYears,
    expectedReturn,
    allocations,
    inflationRate,
}: MonteCarloChartProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [result, setResult] = useState<MonteCarloResult | null>(null);
    const [simCount, setSimCount] = useState(1000);

    const portfolioVolatility = useMemo(() =>
        calculatePortfolioVolatility(allocations),
        [allocations]
    );

    const runSimulation = () => {
        setIsRunning(true);

        // Use setTimeout to allow UI to update
        setTimeout(() => {
            const params: MonteCarloParams = {
                mode,
                amount,
                durationYears,
                expectedReturn,
                volatility: portfolioVolatility,
                simulations: simCount,
                inflationRate,
            };

            const simResult = runMonteCarloSimulation(params);
            setResult(simResult);
            setIsRunning(false);
        }, 100);
    };

    // Chart data from yearly bands
    const chartData = result?.yearlyBands.map(band => ({
        year: `Year ${band.year}`,
        p10: band.p10,
        p25: band.p25,
        p50: band.p50,
        p75: band.p75,
        p90: band.p90,
    })) || [];

    // Add year 0
    if (chartData.length > 0) {
        chartData.unshift({
            year: 'Year 0',
            p10: mode === 'lumpsum' ? amount : 0,
            p25: mode === 'lumpsum' ? amount : 0,
            p50: mode === 'lumpsum' ? amount : 0,
            p75: mode === 'lumpsum' ? amount : 0,
            p90: mode === 'lumpsum' ? amount : 0,
        });
    }

    return (
        <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Monte Carlo Simulation
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Probabilistic projection with {(portfolioVolatility * 100).toFixed(0)}% estimated volatility
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={simCount}
                        onChange={(e) => setSimCount(Number(e.target.value))}
                        className="input py-1 px-2 text-sm w-auto"
                    >
                        <option value={500}>500 runs</option>
                        <option value={1000}>1,000 runs</option>
                        <option value={5000}>5,000 runs</option>
                    </select>
                    <button
                        onClick={runSimulation}
                        disabled={isRunning}
                        className="btn-primary text-sm"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Running...
                            </>
                        ) : result ? (
                            'Re-run Simulation'
                        ) : (
                            'Run Simulation'
                        )}
                    </button>
                </div>
            </div>

            {!result && !isRunning && (
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <div className="text-center">
                        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">
                            Click "Run Simulation" to see probabilistic outcomes
                        </p>
                    </div>
                </div>
            )}

            {isRunning && (
                <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400">
                            Running {simCount.toLocaleString()} simulations...
                        </p>
                    </div>
                </div>
            )}

            {result && !isRunning && (
                <>
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl">
                            <div className="text-xs text-danger-600 mb-1">Worst Case (10%)</div>
                            <div className="text-lg font-bold text-danger-700 dark:text-danger-400">
                                {formatCurrency(result.percentiles.p10)}
                            </div>
                        </div>
                        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl">
                            <div className="text-xs text-warning-600 mb-1">Conservative (25%)</div>
                            <div className="text-lg font-bold text-warning-700 dark:text-warning-400">
                                {formatCurrency(result.percentiles.p25)}
                            </div>
                        </div>
                        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
                            <div className="text-xs text-primary-600 mb-1">Median (50%)</div>
                            <div className="text-lg font-bold text-primary-700 dark:text-primary-400">
                                {formatCurrency(result.percentiles.p50)}
                            </div>
                        </div>
                        <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-xl">
                            <div className="text-xs text-success-600 mb-1">Best Case (90%)</div>
                            <div className="text-lg font-bold text-success-700 dark:text-success-400">
                                {formatCurrency(result.percentiles.p90)}
                            </div>
                        </div>
                    </div>

                    {/* Confidence Band Chart */}
                    <div className="h-72 mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="p90Gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="p50Gradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                                <Tooltip
                                    formatter={(value: number, name: string) => [
                                        formatCurrency(value),
                                        name === 'p90' ? '90th percentile' :
                                            name === 'p75' ? '75th percentile' :
                                                name === 'p50' ? 'Median' :
                                                    name === 'p25' ? '25th percentile' :
                                                        '10th percentile'
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="p90"
                                    stroke="#22c55e"
                                    fill="url(#p90Gradient)"
                                    strokeWidth={1}
                                    strokeDasharray="3 3"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="p75"
                                    stroke="#84cc16"
                                    fill="none"
                                    strokeWidth={1}
                                    strokeDasharray="3 3"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="p50"
                                    stroke="#0ea5e9"
                                    fill="url(#p50Gradient)"
                                    strokeWidth={2}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="p25"
                                    stroke="#eab308"
                                    fill="none"
                                    strokeWidth={1}
                                    strokeDasharray="3 3"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="p10"
                                    stroke="#ef4444"
                                    fill="none"
                                    strokeWidth={1}
                                    strokeDasharray="3 3"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Probability Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-success-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {result.probabilityMetrics.probDouble}%
                                </div>
                                <div className="text-sm text-slate-500">Chance of doubling</div>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-danger-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {result.probabilityMetrics.probLoss}%
                                </div>
                                <div className="text-sm text-slate-500">Chance of loss</div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-[#ef4444]" style={{ borderTop: '1px dashed #ef4444' }}></div>
                                10th percentile (bad case)
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-[#0ea5e9]"></div>
                                50th percentile (median)
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-0.5 bg-[#22c55e]" style={{ borderTop: '1px dashed #22c55e' }}></div>
                                90th percentile (good case)
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
