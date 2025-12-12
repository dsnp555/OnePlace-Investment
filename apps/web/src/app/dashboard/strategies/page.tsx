'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, PieChart, Plus, ArrowLeft, Trash2, Eye, BarChart3 } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';

export default function StrategiesListPage() {
    const router = useRouter();
    const [strategies, setStrategies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            const { data } = await supabase
                .from('strategies')
                .select('*, allocations(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            setStrategies(data || []);
            setLoading(false);
        };

        loadData();
    }, [router]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this strategy?')) return;

        await supabase.from('strategies').delete().eq('id', id);
        setStrategies(strategies.filter(s => s.id !== id));
    };

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
                                My Strategies
                            </h1>
                        </div>
                        <Link href="/dashboard/strategies/new" className="btn-primary">
                            <Plus className="w-5 h-5" />
                            New Strategy
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {strategies.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6">
                            <PieChart className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            No strategies yet
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Create your first investment strategy to start planning your financial future.
                        </p>
                        <Link href="/dashboard/strategies/new" className="btn-primary">
                            <Plus className="w-5 h-5" />
                            Create Your First Strategy
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {strategies.map((strategy) => (
                            <div key={strategy.id} className="card p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <span className="badge-primary">{strategy.mode?.toUpperCase()}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    {strategy.name}
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                                    ₹{Number(strategy.amount).toLocaleString('en-IN')} • {strategy.duration_years} years
                                </p>
                                <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    {strategy.allocations?.length || 0} allocation categories
                                </div>
                                <div className="flex items-center gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <Link
                                        href={`/dashboard/strategies/${strategy.id}`}
                                        className="btn-secondary flex-1 text-center"
                                    >
                                        <Eye className="w-4 h-4" />
                                        View
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(strategy.id)}
                                        className="btn-ghost text-danger-600 hover:bg-danger-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
