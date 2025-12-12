'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, TrendingUp, IndianRupee, Calendar } from 'lucide-react';
import { calculateSIPFV, calculateLumpsumFV, calculateCAGR } from '@oneplace/calc';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type CalcMode = 'sip' | 'lumpsum' | 'cagr';

export default function CalculatorPage() {
    const [mode, setMode] = useState<CalcMode>('sip');

    // SIP
    const [sipAmount, setSipAmount] = useState(10000);
    const [sipRate, setSipRate] = useState(12);
    const [sipYears, setSipYears] = useState(10);

    // Lumpsum
    const [lsAmount, setLsAmount] = useState(100000);
    const [lsRate, setLsRate] = useState(12);
    const [lsYears, setLsYears] = useState(10);

    // CAGR
    const [cagrStart, setCagrStart] = useState(100000);
    const [cagrEnd, setCagrEnd] = useState(200000);
    const [cagrYears, setCagrYears] = useState(5);

    // Calculate results - functions return numbers directly
    const sipFutureValue = calculateSIPFV(sipAmount, sipRate / 100, sipYears, 'monthly');
    const sipTotalContributions = sipAmount * 12 * sipYears;
    const sipTotalReturns = sipFutureValue - sipTotalContributions;

    const lsFutureValue = calculateLumpsumFV(lsAmount, lsRate / 100, lsYears, 'monthly');
    const lsTotalReturns = lsFutureValue - lsAmount;

    const cagrResult = calculateCAGR(cagrStart, cagrEnd, cagrYears);

    // Generate chart data
    const generateChartData = () => {
        const data = [];
        if (mode === 'sip') {
            for (let year = 0; year <= sipYears; year++) {
                const balance = year === 0 ? 0 : calculateSIPFV(sipAmount, sipRate / 100, year, 'monthly');
                data.push({ year: `Year ${year}`, value: balance, invested: sipAmount * 12 * year });
            }
        } else if (mode === 'lumpsum') {
            for (let year = 0; year <= lsYears; year++) {
                const value = year === 0 ? lsAmount : calculateLumpsumFV(lsAmount, lsRate / 100, year, 'monthly');
                data.push({ year: `Year ${year}`, value, invested: lsAmount });
            }
        }
        return data;
    };

    const chartData = generateChartData();

    const formatCurrency = (value: number) => {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
        return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="btn-ghost p-2">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                                Investment Calculator
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Mode Selector */}
                <div className="card p-2 mb-8 inline-flex gap-2">
                    {[
                        { id: 'sip', label: 'SIP Calculator', icon: Calendar },
                        { id: 'lumpsum', label: 'Lumpsum', icon: IndianRupee },
                        { id: 'cagr', label: 'CAGR', icon: TrendingUp },
                    ].map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMode(m.id as CalcMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${mode === m.id
                                ? 'bg-primary-500 text-white'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <m.icon className="w-4 h-4" />
                            {m.label}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Input Card */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                            {mode === 'sip' ? 'SIP Calculator' : mode === 'lumpsum' ? 'Lumpsum Calculator' : 'CAGR Calculator'}
                        </h2>

                        {mode === 'sip' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Monthly Investment
                                    </label>
                                    <input
                                        type="range"
                                        min="1000"
                                        max="100000"
                                        step="1000"
                                        value={sipAmount}
                                        onChange={(e) => setSipAmount(Number(e.target.value))}
                                    />
                                    <div className="text-2xl font-bold text-primary-600 mt-2">₹{sipAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Expected Return (% p.a.)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        step="0.5"
                                        value={sipRate}
                                        onChange={(e) => setSipRate(Number(e.target.value))}
                                    />
                                    <div className="text-2xl font-bold text-primary-600 mt-2">{sipRate}%</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Investment Period (Years)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="40"
                                        value={sipYears}
                                        onChange={(e) => setSipYears(Number(e.target.value))}
                                    />
                                    <div className="text-2xl font-bold text-primary-600 mt-2">{sipYears} years</div>
                                </div>
                            </div>
                        )}

                        {mode === 'lumpsum' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Investment Amount
                                    </label>
                                    <input
                                        type="range"
                                        min="10000"
                                        max="10000000"
                                        step="10000"
                                        value={lsAmount}
                                        onChange={(e) => setLsAmount(Number(e.target.value))}
                                    />
                                    <div className="text-2xl font-bold text-primary-600 mt-2">{formatCurrency(lsAmount)}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Expected Return (% p.a.)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        step="0.5"
                                        value={lsRate}
                                        onChange={(e) => setLsRate(Number(e.target.value))}
                                    />
                                    <div className="text-2xl font-bold text-primary-600 mt-2">{lsRate}%</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Investment Period (Years)
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="40"
                                        value={lsYears}
                                        onChange={(e) => setLsYears(Number(e.target.value))}
                                    />
                                    <div className="text-2xl font-bold text-primary-600 mt-2">{lsYears} years</div>
                                </div>
                            </div>
                        )}

                        {mode === 'cagr' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Initial Value
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                        <input
                                            type="number"
                                            value={cagrStart}
                                            onChange={(e) => setCagrStart(Number(e.target.value))}
                                            className="input"
                                            style={{ paddingLeft: '2.5rem' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Final Value
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                        <input
                                            type="number"
                                            value={cagrEnd}
                                            onChange={(e) => setCagrEnd(Number(e.target.value))}
                                            className="input"
                                            style={{ paddingLeft: '2.5rem' }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Duration (Years)
                                    </label>
                                    <input
                                        type="number"
                                        value={cagrYears}
                                        onChange={(e) => setCagrYears(Number(e.target.value))}
                                        className="input"
                                        min="1"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results Card */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Results</h2>

                        {mode === 'sip' && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <div className="text-sm text-slate-500 mb-1">Invested Amount</div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(sipTotalContributions)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-xl">
                                        <div className="text-sm text-success-600 mb-1">Returns</div>
                                        <div className="text-xl font-bold text-success-600">
                                            +{formatCurrency(sipTotalReturns)}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white text-center mb-6">
                                    <div className="text-sm text-white/70 mb-1">Total Value</div>
                                    <div className="text-3xl font-bold">{formatCurrency(sipFutureValue)}</div>
                                </div>
                            </>
                        )}

                        {mode === 'lumpsum' && (
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <div className="text-sm text-slate-500 mb-1">Invested Amount</div>
                                        <div className="text-xl font-bold text-slate-900 dark:text-white">
                                            {formatCurrency(lsAmount)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-xl">
                                        <div className="text-sm text-success-600 mb-1">Returns</div>
                                        <div className="text-xl font-bold text-success-600">
                                            +{formatCurrency(lsTotalReturns)}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white text-center mb-6">
                                    <div className="text-sm text-white/70 mb-1">Total Value</div>
                                    <div className="text-3xl font-bold">{formatCurrency(lsFutureValue)}</div>
                                </div>
                            </>
                        )}

                        {mode === 'cagr' && (
                            <div className="p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl text-white text-center">
                                <div className="text-sm text-white/70 mb-1">CAGR</div>
                                <div className="text-4xl font-bold">{(cagrResult * 100).toFixed(2)}%</div>
                                <div className="text-sm text-white/70 mt-2">per annum</div>
                            </div>
                        )}

                        {/* Chart */}
                        {mode !== 'cagr' && chartData.length > 0 && (
                            <div className="h-64 mt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                                        <Tooltip formatter={(v: number) => formatCurrency(v)} />
                                        <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
