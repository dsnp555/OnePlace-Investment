'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    TrendingUp, PieChart, Target, Bell, Settings, LogOut, Plus,
    BarChart3, Wallet, ArrowUpRight, ArrowDownRight, Calendar, Sparkles, Newspaper
} from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase';
import MarketTicker from '@/components/MarketTicker';

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [strategies, setStrategies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Calculated stats
    const [totalInvested, setTotalInvested] = useState(0);
    const [projectedValue, setProjectedValue] = useState(0);
    const [fireProgress, setFireProgress] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setUser(user);

            // Fetch strategies
            const { data: strategiesData } = await supabase
                .from('strategies')
                .select('*, allocations(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            setStrategies(strategiesData || []);

            // Calculate totals from strategies
            if (strategiesData && strategiesData.length > 0) {
                let investedSum = 0;
                let projectedSum = 0;

                strategiesData.forEach((strategy: any) => {
                    // Calculate invested amount based on mode and duration
                    const amount = strategy.amount || 0;
                    const duration = strategy.duration_years || 0;
                    const mode = strategy.mode || 'lumpsum';

                    if (mode === 'sip') {
                        investedSum += amount * 12 * duration; // Monthly SIP * 12 months * years
                    } else {
                        investedSum += amount; // Lumpsum one-time
                    }

                    // Use projected_value if available, otherwise estimate
                    if (strategy.projected_value) {
                        projectedSum += strategy.projected_value;
                    } else {
                        // Rough estimate: 12% annual return compounded
                        const rate = 0.12;
                        if (mode === 'sip') {
                            // SIP FV formula approximation
                            projectedSum += amount * 12 * ((Math.pow(1 + rate, duration) - 1) / rate);
                        } else {
                            // Lumpsum FV
                            projectedSum += amount * Math.pow(1 + rate, duration);
                        }
                    }
                });

                setTotalInvested(Math.round(investedSum));
                setProjectedValue(Math.round(projectedSum));
            }

            // Fetch FIRE goal for progress calculation
            const { data: fireData } = await supabase
                .from('fire_goals')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (fireData && fireData.fire_number && fireData.current_savings) {
                const progress = Math.min(100, Math.round((fireData.current_savings / fireData.fire_number) * 100));
                setFireProgress(progress);
            }

            setLoading(false);
        };

        loadData();
    }, [router]);

    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Sidebar */}
            <aside className="fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 hidden lg:block">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-lg font-display font-bold gradient-text">OnePlace</span>
                </div>

                <nav className="space-y-1">
                    {[
                        { icon: BarChart3, label: 'Dashboard', href: '/dashboard', active: true },
                        { icon: PieChart, label: 'Strategies', href: '/dashboard/strategies' },
                        { icon: TrendingUp, label: 'Stocks', href: '/dashboard/stocks' },
                        { icon: Newspaper, label: 'News', href: '/dashboard/news' },
                        { icon: Target, label: 'FIRE Tracker', href: '/dashboard/fire' },
                        { icon: Wallet, label: 'Portfolio', href: '/dashboard/portfolio' },
                        { icon: Sparkles, label: 'AI Insights', href: '/dashboard/insights' },
                        { icon: Bell, label: 'Alerts', href: '/dashboard/alerts' },
                        { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${item.active
                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 px-4 py-3 w-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="lg:ml-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Investor'}!
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">
                            Here's an overview of your investment journey
                        </p>
                    </div>
                    <Link href="/dashboard/strategies/new" className="btn-primary">
                        <Plus className="w-5 h-5" />
                        New Strategy
                    </Link>
                </div>

                {/* Market Ticker */}
                <div className="mb-8">
                    <MarketTicker apiUrl={process.env.NEXT_PUBLIC_API_URL} />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            label: 'Total Invested',
                            value: totalInvested > 0
                                ? `₹${totalInvested.toLocaleString('en-IN')}`
                                : '₹0',
                            change: strategies.length > 0 ? `${strategies.length} strategies` : 'No strategies',
                            positive: true,
                            icon: Wallet
                        },
                        {
                            label: 'Projected Value',
                            value: projectedValue > 0
                                ? `₹${projectedValue.toLocaleString('en-IN')}`
                                : '₹0',
                            change: totalInvested > 0
                                ? `+${Math.round(((projectedValue - totalInvested) / totalInvested) * 100)}%`
                                : '0%',
                            positive: projectedValue >= totalInvested,
                            icon: TrendingUp
                        },
                        {
                            label: 'FIRE Progress',
                            value: `${fireProgress}%`,
                            change: fireProgress > 0 ? 'On track' : 'Set goal',
                            positive: fireProgress > 0,
                            icon: Target
                        },
                        { label: 'Active Strategies', value: strategies.length.toString(), change: 'View all', positive: true, icon: PieChart },
                    ].map((stat, idx) => (
                        <div key={idx} className="card p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${idx === 0 ? 'bg-primary-100 dark:bg-primary-900/30' :
                                    idx === 1 ? 'bg-success-100 dark:bg-success-900/30' :
                                        idx === 2 ? 'bg-accent-100 dark:bg-accent-900/30' :
                                            'bg-warning-100 dark:bg-warning-900/30'
                                    }`}>
                                    <stat.icon className={`w-6 h-6 ${idx === 0 ? 'text-primary-600 dark:text-primary-400' :
                                        idx === 1 ? 'text-success-600 dark:text-success-400' :
                                            idx === 2 ? 'text-accent-600 dark:text-accent-400' :
                                                'text-warning-600 dark:text-warning-400'
                                        }`} />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${stat.positive ? 'text-success-600' : 'text-danger-600'
                                    }`}>
                                    {stat.positive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                    {stat.change}
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Recent Strategies */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Strategies</h2>
                            <Link href="/dashboard/strategies" className="text-sm text-primary-600 hover:text-primary-700">
                                View All
                            </Link>
                        </div>

                        {strategies.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                                    <PieChart className="w-8 h-8 text-slate-400" />
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mb-4">No strategies yet</p>
                                <Link href="/dashboard/strategies/new" className="btn-primary">
                                    Create Your First Strategy
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {strategies.map((strategy) => (
                                    <Link
                                        key={strategy.id}
                                        href={`/dashboard/strategies/${strategy.id}`}
                                        className="block p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-slate-900 dark:text-white">{strategy.name}</h3>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {strategy.mode.toUpperCase()} • ₹{Number(strategy.amount).toLocaleString('en-IN')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {strategy.allocations?.length || 0} categories
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                                    {strategy.duration_years} years
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: PieChart, label: 'New Strategy', href: '/dashboard/strategies/new', color: 'primary' },
                                { icon: Target, label: 'Set FIRE Goal', href: '/dashboard/fire', color: 'accent' },
                                { icon: Calendar, label: 'SIP Calculator', href: '/calculator', color: 'success' },
                                { icon: BarChart3, label: 'Risk Assessment', href: '/dashboard/risk', color: 'warning' },
                            ].map((action, idx) => (
                                <Link
                                    key={idx}
                                    href={action.href}
                                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all hover:-translate-y-1 hover:shadow-lg text-center"
                                >
                                    <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-${action.color}-100 dark:bg-${action.color}-900/30`}>
                                        <action.icon className={`w-6 h-6 text-${action.color}-600 dark:text-${action.color}-400`} />
                                    </div>
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{action.label}</div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}
