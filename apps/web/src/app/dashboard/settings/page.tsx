'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Bell, Shield, Palette, Save, Loader2 } from 'lucide-react';
import { supabase, getCurrentUser, signOut } from '@/lib/supabase';

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Settings
    const [fullName, setFullName] = useState('');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            setUser(user);
            setFullName(user.user_metadata?.full_name || '');
            setLoading(false);
        };

        loadData();
    }, [router]);

    const handleSave = async () => {
        setSaving(true);
        setMessage('');

        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName },
        });

        if (error) {
            setMessage('Failed to save settings');
        } else {
            setMessage('Settings saved successfully!');
        }
        setSaving(false);
    };

    const handleDeleteAccount = async () => {
        if (!confirm('Are you sure you want to delete your account? This cannot be undone.')) return;

        // In a real app, you'd call a server function to delete the account
        await signOut();
        router.push('/');
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
                                Settings
                            </h1>
                        </div>
                        <button onClick={handleSave} disabled={saving} className="btn-primary">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {message && (
                    <div className={`mb-6 px-4 py-3 rounded-xl ${message.includes('success') ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>
                        {message}
                    </div>
                )}

                {/* Profile Section */}
                <div className="card p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="w-5 h-5 text-slate-500" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profile</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="input bg-slate-100 dark:bg-slate-700 cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="card p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-5 h-5 text-slate-500" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-slate-900 dark:text-white">Email Notifications</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Receive updates about your portfolio and strategies
                            </div>
                        </div>
                        <button
                            onClick={() => setEmailNotifications(!emailNotifications)}
                            className={`w-12 h-6 rounded-full transition-colors ${emailNotifications ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                </div>

                {/* Appearance Section */}
                <div className="card p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Palette className="w-5 h-5 text-slate-500" />
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-slate-900 dark:text-white">Dark Mode</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                Use dark theme across the app
                            </div>
                        </div>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="card p-6 border-danger-200 dark:border-danger-800">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield className="w-5 h-5 text-danger-500" />
                        <h2 className="text-lg font-semibold text-danger-600">Danger Zone</h2>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <button onClick={handleDeleteAccount} className="btn bg-danger-500 text-white hover:bg-danger-600">
                        Delete Account
                    </button>
                </div>
            </main>
        </div>
    );
}
