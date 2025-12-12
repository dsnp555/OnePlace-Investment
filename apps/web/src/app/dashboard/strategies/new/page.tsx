'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Save, Calculator, TrendingUp, BarChart3,
    PieChart as PieChartIcon, Clock, Percent, Target, Loader2
} from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { projectPortfolio, ProjectionParams, PortfolioProjection } from '@oneplace/calc';
import PortfolioSplit from '@/components/PortfolioSplit';
import ProjectionResults from '@/components/ProjectionResults';

interface AllocationItem {
    id: string;
    category: string;
    percent: number;
    expectedReturn: number;
    color: string;
}

type InvestmentMode = 'lumpsum' | 'sip' | 'goal' | 'withdrawal';
type CompoundingFrequency = 'monthly' | 'quarterly' | 'annually';

export default function NewStrategyPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState('');

    // Strategy settings
    const [name, setName] = useState('');
    const [mode, setMode] = useState<InvestmentMode>('lumpsum');
    const [amount, setAmount] = useState<number>(100000);
    const [duration, setDuration] = useState<number>(10);
    const [compounding, setCompounding] = useState<CompoundingFrequency>('monthly');
    const [inflationRate, setInflationRate] = useState<number>(5);
    const [normalizeMode, setNormalizeMode] = useState(true);

    // Allocations
    const [allocations, setAllocations] = useState<AllocationItem[]>([]);

    // Projection result
    const [projection, setProjection] = useState<PortfolioProjection | null>(null);

    const totalPercent = useMemo(() =>
        allocations.reduce((sum, a) => sum + a.percent, 0),
        [allocations]
    );

    const canCalculate = allocations.length > 0 && (normalizeMode || Math.abs(totalPercent - 100) < 0.01);
    const canSave = name.trim() && canCalculate && projection;

    const handleCalculate = () => {
        if (!canCalculate) return;
        setCalculating(true);
        setError('');

        try {
            const params: ProjectionParams = {
                mode,
                amount,
                durationYears: duration,
                compounding,
                normalize: normalizeMode,
                inflationRate: inflationRate / 100,
                allocations: allocations.map(a => ({
                    category: a.category,
                    percent: a.percent,
                    expectedAnnualReturn: a.expectedReturn,
                })),
            };

            const result = projectPortfolio(params);
            setProjection(result);
            setStep(3);
        } catch (err: any) {
            setError(err.message || 'Failed to calculate projection');
        } finally {
            setCalculating(false);
        }
    };

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        setError('');

        try {
            const { user } = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            // Create strategy
            const { data: strategy, error: strategyError } = await supabase
                .from('strategies')
                .insert({
                    user_id: user.id,
                    name,
                    mode,
                    amount,
                    duration_years: duration,
                    compounding,
                    normalize_mode: normalizeMode,
                    inflation_rate: inflationRate / 100,
                })
                .select()
                .single();

            if (strategyError) throw strategyError;

            // Create allocations
            const allocRows = allocations.map(a => ({
                strategy_id: strategy.id,
                category: a.category,
                percent: a.percent,
                percent_normalized: normalizeMode ? (a.percent / totalPercent) * 100 : a.percent,
                amount: (amount * (normalizeMode ? a.percent / totalPercent : a.percent / 100)),
                expected_annual_return: a.expectedReturn,
            }));

            const { error: allocError } = await supabase
                .from('allocations')
                .insert(allocRows);

            if (allocError) throw allocError;

            // Save projection
            if (projection) {
                await supabase.from('projections').insert({
                    strategy_id: strategy.id,
                    snapshot: projection,
                    aggregate_fv: projection.aggregate.futureValue,
                    aggregate_cagr: projection.aggregate.cagr,
                });
            }

            router.push(`/dashboard/strategies/${strategy.id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to save strategy');
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="btn-ghost p-2">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                                Create Strategy
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {step > 1 && (
                                <button onClick={() => setStep(step - 1)} className="btn-ghost">
                                    Back
                                </button>
                            )}
                            {step < 3 && (
                                <button
                                    onClick={step === 2 ? handleCalculate : () => setStep(2)}
                                    disabled={step === 2 && !canCalculate}
                                    className="btn-primary"
                                >
                                    {step === 2 ? (
                                        calculating ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Calculating...</>
                                        ) : (
                                            <><Calculator className="w-4 h-4" /> Calculate Projection</>
                                        )
                                    ) : (
                                        <>Next: Set Allocations</>
                                    )}
                                </button>
                            )}
                            {step === 3 && (
                                <button
                                    onClick={handleSave}
                                    disabled={!canSave || saving}
                                    className="btn-primary"
                                >
                                    {saving ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                    ) : (
                                        <><Save className="w-4 h-4" /> Save Strategy</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress Steps */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        {[
                            { num: 1, label: 'Settings', icon: Clock },
                            { num: 2, label: 'Allocations', icon: PieChartIcon },
                            { num: 3, label: 'Results', icon: BarChart3 },
                        ].map((s, idx) => (
                            <div key={s.num} className="flex items-center">
                                {idx > 0 && <div className={`w-12 h-0.5 mx-2 ${step >= s.num ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                                <button
                                    onClick={() => s.num < step && setStep(s.num)}
                                    disabled={s.num > step}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${step === s.num
                                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                            : step > s.num
                                                ? 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                                                : 'text-slate-400 cursor-not-allowed'
                                        }`}
                                >
                                    <s.icon className="w-4 h-4" />
                                    <span className="font-medium">{s.label}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-600 dark:text-danger-400 px-4 py-3 rounded-xl">
                        {error}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Step 1: Settings */}
                {step === 1 && (
                    <div className="card p-8 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-6">
                            Strategy Settings
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Strategy Name
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Retirement Fund 2040"
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Investment Mode
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'lumpsum', label: 'Lumpsum', desc: 'One-time investment' },
                                        { id: 'sip', label: 'SIP', desc: 'Monthly recurring' },
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => setMode(m.id as InvestmentMode)}
                                            className={`p-4 rounded-xl border-2 text-left transition-all ${mode === m.id
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-primary-200'
                                                }`}
                                        >
                                            <div className="font-medium text-slate-900 dark:text-white">{m.label}</div>
                                            <div className="text-sm text-slate-500">{m.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    {mode === 'sip' ? 'Monthly Amount' : 'Investment Amount'}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                                        className="input pl-8"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Duration (Years)
                                    </label>
                                    <input
                                        type="number"
                                        value={duration}
                                        onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
                                        className="input"
                                        min="1"
                                        max="50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Inflation Rate (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={inflationRate}
                                        onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                                        className="input"
                                        min="0"
                                        max="20"
                                        step="0.5"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Compounding Frequency
                                </label>
                                <select
                                    value={compounding}
                                    onChange={(e) => setCompounding(e.target.value as CompoundingFrequency)}
                                    className="input"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="annually">Annually</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Allocations */}
                {step === 2 && (
                    <div className="card p-8">
                        <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-6">
                            Portfolio Allocation
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8">
                            Add investment categories and set your desired allocation percentages.
                            {mode === 'sip'
                                ? ` Your monthly SIP of ₹${amount.toLocaleString('en-IN')} will be split accordingly.`
                                : ` Your ₹${amount.toLocaleString('en-IN')} investment will be split accordingly.`}
                        </p>
                        <PortfolioSplit
                            allocations={allocations}
                            onChange={setAllocations}
                            totalAmount={amount}
                            normalizeMode={normalizeMode}
                            onNormalizeModeChange={setNormalizeMode}
                        />
                    </div>
                )}

                {/* Step 3: Results */}
                {step === 3 && projection && (
                    <ProjectionResults
                        projection={projection}
                        mode={mode}
                        amount={amount}
                        duration={duration}
                        inflationRate={inflationRate}
                    />
                )}
            </main>
        </div>
    );
}
