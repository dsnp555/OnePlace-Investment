'use client';

import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
            <div className="max-w-md w-full text-center">
                <div className="card p-8">
                    <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
                        <Mail className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>

                    <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">
                        Check your email
                    </h1>

                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                        We've sent you a verification link to your email address.
                        Please click the link to verify your account and continue.
                    </p>

                    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-6">
                        <p className="text-sm text-primary-700 dark:text-primary-300">
                            Didn't receive the email? Check your spam folder or wait a few minutes.
                        </p>
                    </div>

                    <Link href="/auth/login" className="btn-secondary w-full">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
