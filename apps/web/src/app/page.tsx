'use client';

import Link from 'next/link';
import { ArrowRight, TrendingUp, Shield, PieChart, Bell, Zap, Target } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-display font-bold gradient-text">OnePlace Invest</span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors">Features</a>
                            <a href="#how-it-works" className="text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 transition-colors">How it Works</a>
                            <Link href="/auth/login" className="btn-ghost text-sm">Log In</Link>
                            <Link href="/auth/signup" className="btn-primary text-sm">Get Started</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in">
                            <Zap className="w-4 h-4" />
                            AI-Powered Investment Planning
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-slate-900 dark:text-white mb-6 animate-slide-up">
                            Plan Your Wealth,{' '}
                            <span className="gradient-text">Achieve FIRE</span>
                        </h1>

                        <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
                            Create custom portfolio allocations, project your returns, get AI-personalized recommendations,
                            and track your journey to financial independence.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                            <Link href="/auth/signup" className="btn-primary text-lg px-8 py-4 group">
                                Start Planning Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/calculator" className="btn-secondary text-lg px-8 py-4">
                                Try Calculator
                            </Link>
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div className="mt-20 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />
                        <div className="glass-card p-8 max-w-5xl mx-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Investment Summary */}
                                <div className="card p-6">
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Total Portfolio Value</div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white">₹24,56,789</div>
                                    <div className="flex items-center gap-1 text-success-500 text-sm mt-1">
                                        <TrendingUp className="w-4 h-4" />
                                        +12.5% this year
                                    </div>
                                </div>

                                {/* FIRE Progress */}
                                <div className="card p-6">
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">FIRE Progress</div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white">48%</div>
                                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: '48%' }} />
                                    </div>
                                </div>

                                {/* Monthly SIP */}
                                <div className="card p-6">
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-2">Monthly SIP</div>
                                    <div className="text-3xl font-bold text-slate-900 dark:text-white">₹50,000</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        Across 5 categories
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">
                            Everything You Need to Plan
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Powerful tools designed for both beginners and experienced investors
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                icon: PieChart,
                                title: 'Custom Portfolio Split',
                                description: 'Create your ideal allocation across stocks, mutual funds, gold, bonds, and more with intuitive sliders.',
                                color: 'primary',
                            },
                            {
                                icon: TrendingUp,
                                title: 'Projection Engine',
                                description: 'Calculate future value for lumpsum and SIP investments with inflation-adjusted returns.',
                                color: 'accent',
                            },
                            {
                                icon: Shield,
                                title: 'Risk Assessment',
                                description: 'Take our questionnaire to understand your risk profile and get personalized allocation presets.',
                                color: 'success',
                            },
                            {
                                icon: Target,
                                title: 'FIRE Calculator',
                                description: 'Set your financial independence target and track your progress to early retirement.',
                                color: 'warning',
                            },
                            {
                                icon: Bell,
                                title: 'Smart Alerts',
                                description: 'Get notified about milestones, market changes, and rebalancing opportunities.',
                                color: 'danger',
                            },
                            {
                                icon: Zap,
                                title: 'AI Recommendations',
                                description: 'Receive personalized investment suggestions based on your goals and market conditions.',
                                color: 'primary',
                            },
                        ].map((feature, idx) => (
                            <div key={idx} className="card-hover p-6">
                                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 dark:bg-${feature.color}-900/30 flex items-center justify-center mb-4`}>
                                    <feature.icon className={`w-6 h-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                                <p className="text-slate-600 dark:text-slate-400">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="glass-card p-12 text-center">
                        <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">
                            Start Your Investment Journey Today
                        </h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                            Join thousands of investors who are planning their path to financial independence.
                        </p>
                        <Link href="/auth/signup" className="btn-primary text-lg px-8 py-4">
                            Create Free Account
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-display font-bold">OnePlace Invest</span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            © 2024 OnePlace Invest. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
