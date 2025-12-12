'use client';

import { useState, useMemo } from 'react';
import { Plus, Minus, RotateCcw, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { DEFAULT_ASSET_CATEGORIES, getDefaultExpectedReturn } from '@oneplace/calc';

interface AllocationItem {
    id: string;
    category: string;
    percent: number;
    expectedReturn: number;
    color: string;
}

interface PortfolioSplitProps {
    allocations: AllocationItem[];
    onChange: (allocations: AllocationItem[]) => void;
    totalAmount: number;
    normalizeMode: boolean;
    onNormalizeModeChange: (value: boolean) => void;
}

const COLORS = [
    '#0ea5e9', '#d946ef', '#22c55e', '#eab308', '#ef4444',
    '#8b5cf6', '#f97316', '#06b6d4', '#84cc16', '#ec4899',
    '#14b8a6', '#a855f7', '#f59e0b', '#6366f1', '#10b981',
];

const PREDEFINED_CATEGORIES = DEFAULT_ASSET_CATEGORIES.map((cat, idx) => ({
    id: cat.id,
    name: cat.name,
    defaultReturn: cat.defaultExpectedReturn,
    color: COLORS[idx % COLORS.length],
}));

export default function PortfolioSplit({
    allocations,
    onChange,
    totalAmount,
    normalizeMode,
    onNormalizeModeChange,
}: PortfolioSplitProps) {
    const [customCategory, setCustomCategory] = useState('');

    const totalPercent = useMemo(() =>
        allocations.reduce((sum, a) => sum + a.percent, 0),
        [allocations]
    );

    const isValidTotal = Math.abs(totalPercent - 100) < 0.01;
    const isOverAllocated = totalPercent > 100;

    const normalizedAllocations = useMemo(() => {
        if (totalPercent === 0) return allocations;
        return allocations.map(a => ({
            ...a,
            normalizedPercent: (a.percent / totalPercent) * 100,
            normalizedAmount: (totalAmount * (a.percent / totalPercent)),
        }));
    }, [allocations, totalPercent, totalAmount]);

    const addCategory = (category: typeof PREDEFINED_CATEGORIES[0]) => {
        if (allocations.some(a => a.category === category.name)) return;

        onChange([
            ...allocations,
            {
                id: crypto.randomUUID(),
                category: category.name,
                percent: 0,
                expectedReturn: category.defaultReturn,
                color: category.color,
            },
        ]);
    };

    const addCustomCategory = () => {
        if (!customCategory.trim() || allocations.some(a => a.category === customCategory)) return;

        onChange([
            ...allocations,
            {
                id: crypto.randomUUID(),
                category: customCategory.trim(),
                percent: 0,
                expectedReturn: 0.08,
                color: COLORS[allocations.length % COLORS.length],
            },
        ]);
        setCustomCategory('');
    };

    const updateAllocation = (id: string, updates: Partial<AllocationItem>) => {
        onChange(allocations.map(a => a.id === id ? { ...a, ...updates } : a));
    };

    const removeAllocation = (id: string) => {
        onChange(allocations.filter(a => a.id !== id));
    };

    const resetAllocations = () => {
        onChange([]);
    };

    const distributeEqually = () => {
        if (allocations.length === 0) return;
        const equalPercent = 100 / allocations.length;
        onChange(allocations.map(a => ({ ...a, percent: Math.round(equalPercent * 100) / 100 })));
    };

    const chartData = normalizedAllocations
        .filter(a => a.percent > 0)
        .map(a => ({
            name: a.category,
            value: normalizeMode ? (a as any).normalizedPercent : a.percent,
            amount: normalizeMode ? (a as any).normalizedAmount : (totalAmount * a.percent / 100),
            color: a.color,
        }));

    return (
        <div className="space-y-6">
            {/* Controls Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={normalizeMode}
                            onChange={(e) => onNormalizeModeChange(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Auto-normalize to 100%</span>
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={distributeEqually} className="btn-ghost text-sm">
                        Distribute Equally
                    </button>
                    <button onClick={resetAllocations} className="btn-ghost text-sm text-danger-600">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                    </button>
                </div>
            </div>

            {/* Total Indicator */}
            <div className={`p-4 rounded-xl border ${isValidTotal
                    ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                    : isOverAllocated
                        ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                        : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                }`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {!isValidTotal && <AlertCircle className={`w-5 h-5 ${isOverAllocated ? 'text-danger-500' : 'text-warning-500'}`} />}
                        <span className="font-medium">
                            Total Allocation: <span className="text-lg">{totalPercent.toFixed(1)}%</span>
                        </span>
                    </div>
                    {normalizeMode && totalPercent !== 100 && (
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            Will be normalized to 100%
                        </span>
                    )}
                </div>
                {!normalizeMode && !isValidTotal && (
                    <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">
                        {isOverAllocated
                            ? 'Total exceeds 100%. Please reduce allocations or enable auto-normalize.'
                            : 'Allocations must sum to 100%.'}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Allocations List */}
                <div className="space-y-4">
                    <h3 className="font-medium text-slate-900 dark:text-white">Your Allocations</h3>

                    {allocations.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            <p className="text-slate-500 dark:text-slate-400 mb-4">Add categories below to start</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allocations.map((alloc) => {
                                const normalized = normalizedAllocations.find(a => a.id === alloc.id);
                                const displayAmount = normalizeMode
                                    ? (normalized as any)?.normalizedAmount
                                    : (totalAmount * alloc.percent / 100);

                                return (
                                    <div key={alloc.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-4 h-4 rounded-full"
                                                    style={{ backgroundColor: alloc.color }}
                                                />
                                                <span className="font-medium text-slate-900 dark:text-white">{alloc.category}</span>
                                            </div>
                                            <button
                                                onClick={() => removeAllocation(alloc.id)}
                                                className="text-slate-400 hover:text-danger-500 transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Percentage Slider */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-slate-500">Allocation</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={alloc.percent}
                                                        onChange={(e) => updateAllocation(alloc.id, {
                                                            percent: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0))
                                                        })}
                                                        className="w-20 px-2 py-1 text-right text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                                                        min="0"
                                                        max="100"
                                                        step="0.5"
                                                    />
                                                    <span className="text-sm text-slate-500">%</span>
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                value={alloc.percent}
                                                onChange={(e) => updateAllocation(alloc.id, { percent: parseFloat(e.target.value) })}
                                                min="0"
                                                max="100"
                                                step="0.5"
                                                className="w-full"
                                            />
                                        </div>

                                        {/* Expected Return */}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-slate-500">Expected Return</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={(alloc.expectedReturn * 100).toFixed(1)}
                                                    onChange={(e) => updateAllocation(alloc.id, {
                                                        expectedReturn: parseFloat(e.target.value) / 100 || 0
                                                    })}
                                                    className="w-16 px-2 py-1 text-right text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
                                                    step="0.1"
                                                />
                                                <span className="text-slate-500">% p.a.</span>
                                            </div>
                                        </div>

                                        {/* Amount Display */}
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-500">Amount</span>
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    ₹{displayAmount?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Add Category */}
                    <div className="mt-6">
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Add Category</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {PREDEFINED_CATEGORIES.filter(c => !allocations.some(a => a.category === c.name))
                                .slice(0, 8)
                                .map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => addCategory(cat)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-full transition-colors"
                                    >
                                        <Plus className="w-3 h-3" />
                                        {cat.name}
                                    </button>
                                ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customCategory}
                                onChange={(e) => setCustomCategory(e.target.value)}
                                placeholder="Custom category..."
                                className="flex-1 input text-sm py-2"
                                onKeyDown={(e) => e.key === 'Enter' && addCustomCategory()}
                            />
                            <button onClick={addCustomCategory} className="btn-secondary px-4">
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pie Chart */}
                <div>
                    <h3 className="font-medium text-slate-900 dark:text-white mb-4">Allocation Breakdown</h3>
                    {chartData.length > 0 ? (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number, name: string, props: any) => [
                                            `${value.toFixed(1)}% (₹${props.payload.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })})`,
                                            name,
                                        ]}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value) => <span className="text-sm">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-80 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                            <p className="text-slate-500 dark:text-slate-400">Add allocations to see chart</p>
                        </div>
                    )}

                    {/* Summary Table */}
                    {chartData.length > 0 && (
                        <div className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
                            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Summary</h4>
                            <div className="space-y-2">
                                {chartData.map((item) => (
                                    <div key={item.name} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                            <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            ₹{item.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                ))}
                                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                    <span className="font-medium text-slate-900 dark:text-white">Total</span>
                                    <span className="font-bold text-lg text-slate-900 dark:text-white">
                                        ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
