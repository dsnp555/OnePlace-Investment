'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    Target,
    RefreshCw,
    ChevronRight,
    Sparkles,
    Shield,
    Zap,
    BarChart3,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase';

interface Recommendation {
    id: string;
    type: 'rebalance' | 'allocation' | 'goal' | 'risk' | 'opportunity' | 'warning';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action?: string;
    actionLink?: string;
    impact?: string;
    createdAt: string;
}

interface InsightsSummary {
    total: number;
    highPriority: number;
    opportunities: number;
    warnings: number;
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
    rebalance: { icon: BarChart3, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    allocation: { icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    goal: { icon: TrendingUp, color: 'text-primary-600', bgColor: 'bg-primary-50' },
    risk: { icon: Shield, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    opportunity: { icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    warning: { icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-50' },
};

const PRIORITY_STYLES: Record<string, string> = {
    high: 'border-l-4 border-l-red-500',
    medium: 'border-l-4 border-l-yellow-500',
    low: 'border-l-4 border-l-green-500',
};

export default function InsightsPage() {
    const router = useRouter();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [summary, setSummary] = useState<InsightsSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchRecommendations = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/recommendations`);

            if (response.ok) {
                const data = await response.json();
                setRecommendations(data.recommendations || []);
                setSummary(data.summary || null);
            } else {
                // If API is not available, show demo data
                setRecommendations(getDemoRecommendations());
                setSummary({ total: 4, highPriority: 1, opportunities: 2, warnings: 1 });
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            // Show demo data on error
            setRecommendations(getDemoRecommendations());
            setSummary({ total: 4, highPriority: 1, opportunities: 2, warnings: 1 });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchRecommendations();
        setRefreshing(false);
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            fetchRecommendations();
        };
        checkAuth();
    }, [router]);

    function getDemoRecommendations(): Recommendation[] {
        return [
            {
                id: '1',
                type: 'opportunity',
                priority: 'high',
                title: 'Market Opportunity',
                description: 'Markets have corrected 8% this month. Consider increasing your SIP amount to take advantage of lower prices.',
                action: 'Increase SIP',
                actionLink: '/dashboard/strategies/new',
                impact: 'Potentially 15-20% higher returns over 5 years',
                createdAt: new Date().toISOString(),
            },
            {
                id: '2',
                type: 'rebalance',
                priority: 'medium',
                title: 'Rebalance Your Portfolio',
                description: 'Your equity allocation has drifted to 75% from your target of 60%. Consider rebalancing to maintain your risk profile.',
                action: 'Rebalance Now',
                actionLink: '/dashboard/portfolio',
                impact: 'Reduces risk, locks in gains',
                createdAt: new Date().toISOString(),
            },
            {
                id: '3',
                type: 'goal',
                priority: 'medium',
                title: 'FIRE Progress Update',
                description: 'You are 35% towards your FIRE goal. At your current pace, you will reach financial independence in 12 years.',
                action: 'View FIRE Tracker',
                actionLink: '/dashboard/fire',
                impact: 'Stay on track for early retirement',
                createdAt: new Date().toISOString(),
            },
            {
                id: '4',
                type: 'allocation',
                priority: 'low',
                title: 'Add International Exposure',
                description: 'Consider adding 10-15% international equity funds to benefit from global growth and reduce India-specific risk.',
                action: 'Explore Options',
                actionLink: '/dashboard/strategies/new',
                impact: 'Access to 60% of global market cap',
                createdAt: new Date().toISOString(),
            },
        ];
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">AI Insights</h1>
                                <p className="text-sm text-slate-500">Personalized recommendations</p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="btn-secondary"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                                    <Lightbulb className="w-5 h-5 text-primary-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
                                    <p className="text-sm text-slate-500">Total Insights</p>
                                </div>
                            </div>
                        </div>
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{summary.highPriority}</p>
                                    <p className="text-sm text-slate-500">High Priority</p>
                                </div>
                            </div>
                        </div>
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                                    <Zap className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{summary.opportunities}</p>
                                    <p className="text-sm text-slate-500">Opportunities</p>
                                </div>
                            </div>
                        </div>
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{summary.warnings}</p>
                                    <p className="text-sm text-slate-500">Warnings</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recommendations List */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-slate-900">Recommendations</h2>

                    {recommendations.length === 0 ? (
                        <div className="card p-8 text-center">
                            <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">No Recommendations Yet</h3>
                            <p className="text-slate-500 mb-4">Create strategies and set goals to receive personalized insights.</p>
                            <Link href="/dashboard/strategies/new" className="btn-primary">
                                Create Your First Strategy
                            </Link>
                        </div>
                    ) : (
                        recommendations.map((rec) => {
                            const config = TYPE_CONFIG[rec.type] || TYPE_CONFIG.goal;
                            const Icon = config.icon;

                            return (
                                <div
                                    key={rec.id}
                                    className={`card p-5 ${PRIORITY_STYLES[rec.priority]} hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-6 h-6 ${config.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="font-semibold text-slate-900">{rec.title}</h3>
                                                    <p className="text-slate-600 mt-1">{rec.description}</p>
                                                    {rec.impact && (
                                                        <p className="text-sm text-primary-600 mt-2 font-medium">
                                                            💡 {rec.impact}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-green-100 text-green-700'
                                                    }`}>
                                                    {rec.priority}
                                                </span>
                                            </div>
                                            {rec.action && rec.actionLink && (
                                                <Link
                                                    href={rec.actionLink}
                                                    className="inline-flex items-center gap-1 mt-4 text-primary-600 font-medium hover:text-primary-700 transition-colors"
                                                >
                                                    {rec.action}
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* AI Disclaimer */}
                <div className="mt-8 p-4 bg-slate-100 rounded-xl text-center">
                    <p className="text-sm text-slate-500">
                        <Sparkles className="w-4 h-4 inline-block mr-1" />
                        AI-powered recommendations based on your portfolio, goals, and market conditions.
                        Always consult a financial advisor for major investment decisions.
                    </p>
                </div>
            </main>
        </div>
    );
}
