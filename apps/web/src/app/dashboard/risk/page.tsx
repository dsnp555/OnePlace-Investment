'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Shield, Check } from 'lucide-react';
import { RISK_QUESTIONS, assessRisk, ALLOCATION_PRESETS } from '@oneplace/calc';
import { supabase, getCurrentUser } from '@/lib/supabase';

// Define types locally for the UI
interface RiskResult {
    profile: 'conservative' | 'balanced' | 'aggressive';
    score: number;
}

export default function RiskAssessmentPage() {
    const router = useRouter();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<{ questionId: string; score: number }[]>([]);
    const [result, setResult] = useState<RiskResult | null>(null);
    const [saving, setSaving] = useState(false);

    const questions = RISK_QUESTIONS;

    const handleAnswer = (value: number) => {
        const questionId = questions[currentQuestion].id;
        const newAnswers = [...answers.filter(a => a.questionId !== questionId)];
        newAnswers.push({ questionId, score: value });
        setAnswers(newAnswers);
    };

    const getCurrentAnswer = () => {
        const questionId = questions[currentQuestion].id;
        return answers.find(a => a.questionId === questionId)?.score;
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            // Calculate result
            const assessment = assessRisk(answers);
            setResult({ profile: assessment.profile, score: assessment.score });
        }
    };

    const handlePrev = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setSaving(true);

        const { user } = await getCurrentUser();
        if (!user) {
            router.push('/auth/login');
            return;
        }

        // Save to profile (if table exists)
        try {
            await supabase.from('profiles').upsert({
                user_id: user.id,
                risk_profile: result.profile,
                risk_score: result.score,
            });
        } catch (e) {
            console.log('Could not save profile - table may not exist');
        }

        router.push('/dashboard');
    };

    const allocation = result ? ALLOCATION_PRESETS[result.profile] : null;

    if (result) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
                <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center h-16">
                            <Link href="/dashboard" className="btn-ghost p-2">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <h1 className="text-xl font-display font-bold text-slate-900 dark:text-white ml-4">
                                Risk Assessment Results
                            </h1>
                        </div>
                    </div>
                </header>

                <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="card p-8 text-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
                            <Shield className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            Your Risk Profile
                        </h2>
                        <div className="text-4xl font-bold gradient-text mb-2">
                            {result.profile.charAt(0).toUpperCase() + result.profile.slice(1)}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400">
                            Risk Score: {result.score} / 100
                        </p>
                    </div>

                    {allocation && (
                        <div className="card p-6 mb-8">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                Recommended Allocation
                            </h3>
                            <div className="space-y-3">
                                {allocation.map((a, idx) => (
                                    <div key={idx} className="flex items-center justify-between">
                                        <span className="text-slate-700 dark:text-slate-300">{a.category}</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{a.percent}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                        {saving ? 'Saving...' : 'Save & Continue to Dashboard'}
                    </button>
                </main>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];
    const currentAnswer = getCurrentAnswer();

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
                                Risk Assessment
                            </h1>
                        </div>
                        <div className="text-sm text-slate-500">
                            {currentQuestion + 1} / {questions.length}
                        </div>
                    </div>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-200 dark:bg-slate-700">
                <div
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
            </div>

            <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="card p-8">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-8">
                        {currentQ.question}
                    </h2>

                    <div className="space-y-3 mb-8">
                        {currentQ.options.map((option, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(option.value)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${currentAnswer === option.value
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-primary-200'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${currentAnswer === option.value
                                            ? 'border-primary-500 bg-primary-500'
                                            : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {currentAnswer === option.value && (
                                            <Check className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <span className="text-slate-900 dark:text-white">{option.label}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={handlePrev}
                            disabled={currentQuestion === 0}
                            className="btn-secondary"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentAnswer === undefined}
                            className="btn-primary"
                        >
                            {currentQuestion === questions.length - 1 ? 'See Results' : 'Next'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
