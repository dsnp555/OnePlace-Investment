'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Wallet, PieChart, TrendingUp, Plus } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0ea5e9', '#d946ef', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#f97316'];

export default function PortfolioPage() {
    const [allocations, setAllocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Get all allocations from all strategies
            const { data: strategies } = await supabase
                .from('strategies')
                .select('*, allocations(*)')
                .eq('user_id', user.id);

            // Aggregate allocations by category
            const categoryTotals: Record<string, number> = {};
            strategies?.forEach(s => {
                s.allocations?.forEach((a: any) => {
                    const cat = a.category;
                    categoryTotals[cat] = (categoryTotals[cat] || 0) + (a.amount || 0);
                });
            });

            const data = Object.entries(categoryTotals).map(([name, value], idx) => ({
                name,
                value,
                color: COLORS[idx % COLORS.length],
            }));

            setAllocations(data);
            setLoading(false);
        };

        loadData();
    }, []);

    const totalValue = allocations.reduce((sum, a) => sum + a.value, 0);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

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
                                Portfolio Overview
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {allocations.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6">
                            <Wallet className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            No Portfolio Data
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Create investment strategies to see your portfolio breakdown here.
                        </p>
                        <Link href="/dashboard/strategies/new" className="btn-primary">
                            <Plus className="w-5 h-5" />
                            Create Strategy
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Total Value Card */}
                        <div className="card p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Total Portfolio Value</div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white">
                                        ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>

                            {/* Allocation Breakdown */}
                            <div className="space-y-4">
                                {allocations.map((alloc, idx) => (
                                    <div key={alloc.name} className="flex items-center gap-4">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: alloc.color }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-slate-900 dark:text-white">{alloc.name}</span>
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    {((alloc.value / totalValue) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${(alloc.value / totalValue) * 100}%`,
                                                        backgroundColor: alloc.color,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-sm font-medium text-slate-900 dark:text-white w-24 text-right">
                                            ₹{alloc.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pie Chart */}
                        <div className="card p-8">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                                Asset Allocation
                            </h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPie>
                                        <Pie
                                            data={allocations}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {allocations.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                                        />
                                        <Legend />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
