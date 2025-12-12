'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, TrendingUp, Calculator, Flame, Wallet } from 'lucide-react';
import { calculateFIRENumber, estimateYearsToFIRE } from '@oneplace/calc';

export default function FIRETrackerPage() {
    const [monthlyExpenses, setMonthlyExpenses] = useState(50000);
    const [currentSavings, setCurrentSavings] = useState(500000);
    const [monthlySavings, setMonthlySavings] = useState(25000);
    const [withdrawalRate, setWithdrawalRate] = useState(4);
    const [expectedReturn, setExpectedReturn] = useState(10);

    const fireNumber = calculateFIRENumber(monthlyExpenses * 12, withdrawalRate / 100);
    const yearsToFIRE = estimateYearsToFIRE(
        currentSavings,
        monthlySavings,
        expectedReturn / 100,
        fireNumber
    );
    const progress = Math.min((currentSavings / fireNumber) * 100, 100);

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
                                FIRE Tracker
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* FIRE Progress Card */}
                <div className="card p-8 mb-8 bg-gradient-to-br from-primary-500 to-accent-500 text-white">
                    <div className="flex items-center gap-3 mb-6">
                        <Flame className="w-8 h-8" />
                        <h2 className="text-2xl font-bold">Your FIRE Journey</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div>
                            <div className="text-white/70 text-sm mb-1">FIRE Number</div>
                            <div className="text-3xl font-bold">₹{(fireNumber / 10000000).toFixed(2)} Cr</div>
                        </div>
                        <div>
                            <div className="text-white/70 text-sm mb-1">Current Progress</div>
                            <div className="text-3xl font-bold">{progress.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div className="text-white/70 text-sm mb-1">Years to FIRE</div>
                            <div className="text-3xl font-bold">
                                {yearsToFIRE === Infinity ? '∞' : yearsToFIRE.toFixed(1)} years
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-4 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-white rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-white/70">
                        <span>₹{(currentSavings / 100000).toFixed(1)} L</span>
                        <span>₹{(fireNumber / 10000000).toFixed(2)} Cr</span>
                    </div>
                </div>

                {/* Input Fields */}
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                        Adjust Your Parameters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Monthly Expenses
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                <input
                                    type="number"
                                    value={monthlyExpenses}
                                    onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                                    className="input"
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Current Savings
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                <input
                                    type="number"
                                    value={currentSavings}
                                    onChange={(e) => setCurrentSavings(Number(e.target.value))}
                                    className="input"
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Monthly Savings
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                <input
                                    type="number"
                                    value={monthlySavings}
                                    onChange={(e) => setMonthlySavings(Number(e.target.value))}
                                    className="input"
                                    style={{ paddingLeft: '2.5rem' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Expected Annual Return (%)
                            </label>
                            <input
                                type="number"
                                value={expectedReturn}
                                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                                className="input"
                                step="0.5"
                                min="0"
                                max="30"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Safe Withdrawal Rate (%)
                            </label>
                            <input
                                type="number"
                                value={withdrawalRate}
                                onChange={(e) => setWithdrawalRate(Number(e.target.value))}
                                className="input"
                                step="0.5"
                                min="2"
                                max="6"
                            />
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="card p-6 mt-6 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
                    <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2">
                        What is FIRE?
                    </h4>
                    <p className="text-sm text-primary-700 dark:text-primary-300">
                        FIRE stands for Financial Independence, Retire Early. Your FIRE number is
                        calculated as 25× your annual expenses (using a 4% withdrawal rate). Once
                        your investments reach this amount, you can theoretically live off the returns
                        indefinitely.
                    </p>
                </div>
            </main>
        </div>
    );
}
