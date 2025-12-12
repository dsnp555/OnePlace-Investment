'use client';

import { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, Target, BarChart3, Download, IndianRupee } from 'lucide-react';
import { PortfolioProjection } from '@oneplace/calc';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import MonteCarloChart from './MonteCarloChart';

interface ProjectionResultsProps {
    projection: PortfolioProjection;
    mode: 'lumpsum' | 'sip' | 'goal' | 'withdrawal';
    amount: number;
    duration: number;
    inflationRate: number;
    allocations?: { category: string; percent: number; expectedReturn: number }[];
}

const COLORS = [
    '#0ea5e9', '#d946ef', '#22c55e', '#eab308', '#ef4444',
    '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#ec4899',
];

const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function ProjectionResults({
    projection,
    mode,
    amount,
    duration,
    inflationRate,
    allocations,
}: ProjectionResultsProps) {
    const { aggregate, normalizedAllocations, yearlyBreakdown } = projection;

    const totalReturnsPercent = aggregate.totalContributions > 0
        ? ((aggregate.totalReturns / aggregate.totalContributions) * 100).toFixed(1)
        : '0';

    const pieData = normalizedAllocations.map((alloc, idx) => ({
        name: alloc.category,
        value: alloc.projectedFV,
        color: COLORS[idx % COLORS.length],
    }));

    const growthData = yearlyBreakdown.map((y) => ({
        year: `Year ${y.year}`,
        balance: y.endBalance,
        contributions: mode === 'sip'
            ? y.contributions * y.year
            : aggregate.totalContributions,
        inflationAdjusted: y.inflationAdjusted,
    }));

    const handleExportCSV = () => {
        const lines: string[] = [];
        lines.push('Year,End Balance,Contributions,Interest,Inflation-Adjusted');
        yearlyBreakdown.forEach(y => {
            lines.push(`${y.year},${y.endBalance.toFixed(2)},${y.contributions.toFixed(2)},${y.interest.toFixed(2)},${y.inflationAdjusted?.toFixed(2) || ''}`);
        });

        const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'projection_results.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(aggregate.futureValue)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Projected Future Value</div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <IndianRupee className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {formatCurrency(aggregate.totalContributions)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total Investment</div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                            <ArrowUpRight className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-success-600">
                        {formatCurrency(aggregate.totalReturns)}
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Total Returns ({totalReturnsPercent}%)
                    </div>
                </div>

                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-warning-600 dark:text-warning-400" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                        {(aggregate.cagr * 100).toFixed(2)}%
                    </div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Portfolio CAGR</div>
                </div>
            </div>

            {/* Inflation Adjusted */}
            {aggregate.realFutureValue && (
                <div className="card p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 border-primary-200 dark:border-primary-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-primary-600 dark:text-primary-400 mb-1">
                                Inflation-Adjusted Value (@ {inflationRate}% p.a.)
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                {formatCurrency(aggregate.realFutureValue)}
                            </div>
                        </div>
                        <Target className="w-12 h-12 text-primary-500/30" />
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Growth Chart */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Wealth Growth Over Time
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={growthData}>
                                <defs>
                                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatCurrency(v)} />
                                <Tooltip
                                    formatter={(value: number) => [formatCurrency(value), '']}
                                    labelStyle={{ color: '#0f172a' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#0ea5e9"
                                    fill="url(#balanceGradient)"
                                    strokeWidth={2}
                                    name="Portfolio Value"
                                />
                                {growthData[0]?.inflationAdjusted && (
                                    <Area
                                        type="monotone"
                                        dataKey="inflationAdjusted"
                                        stroke="#d946ef"
                                        fill="none"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        name="Inflation-Adjusted"
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Allocation Breakdown */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                        Category-wise Final Value
                    </h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Yearly Breakdown Table */}
            <div className="card overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Yearly Breakdown
                    </h3>
                    <button onClick={handleExportCSV} className="btn-ghost text-sm">
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Year</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Start Balance</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Contributions</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Interest Earned</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">End Balance</th>
                                {yearlyBreakdown[0]?.inflationAdjusted && (
                                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Inflation-Adjusted</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {yearlyBreakdown.map((row) => (
                                <tr key={row.year} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                                        Year {row.year}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-400">
                                        {formatCurrency(row.startBalance)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-600 dark:text-slate-400">
                                        {formatCurrency(row.contributions)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-success-600">
                                        +{formatCurrency(row.interest)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900 dark:text-white">
                                        {formatCurrency(row.endBalance)}
                                    </td>
                                    {row.inflationAdjusted && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-accent-600">
                                            {formatCurrency(row.inflationAdjusted)}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Category Details */}
            <div className="card p-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                    Category-wise Projection Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {normalizedAllocations.map((alloc, idx) => (
                        <div
                            key={alloc.category}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                />
                                <span className="font-medium text-slate-900 dark:text-white">{alloc.category}</span>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Allocation</span>
                                    <span className="font-medium">{alloc.percentNormalized.toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Invested</span>
                                    <span className="font-medium">{formatCurrency(alloc.amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Final Value</span>
                                    <span className="font-medium text-success-600">{formatCurrency(alloc.projectedFV)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Returns</span>
                                    <span className="font-medium text-success-600">+{formatCurrency(alloc.totalReturns)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">CAGR</span>
                                    <span className="font-medium">{(alloc.cagr * 100).toFixed(2)}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monte Carlo Simulation */}
            {allocations && allocations.length > 0 && (mode === 'lumpsum' || mode === 'sip') && (
                <MonteCarloChart
                    mode={mode}
                    amount={amount}
                    durationYears={duration}
                    expectedReturn={aggregate.cagr}
                    allocations={allocations}
                    inflationRate={inflationRate / 100}
                />
            )}
        </div>
    );
}
