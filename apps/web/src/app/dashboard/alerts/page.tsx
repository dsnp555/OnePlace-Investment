'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Plus, Trash2, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabase';

export default function AlertsPage() {
    const router = useRouter();
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            const { data } = await supabase
                .from('alerts')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            setAlerts(data || []);
            setLoading(false);
        };

        loadData();
    }, [router]);

    const handleToggle = async (id: string, active: boolean) => {
        await supabase.from('alerts').update({ active: !active }).eq('id', id);
        setAlerts(alerts.map(a => a.id === id ? { ...a, active: !active } : a));
    };

    const handleDelete = async (id: string) => {
        await supabase.from('alerts').delete().eq('id', id);
        setAlerts(alerts.filter(a => a.id !== id));
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
                                Price Alerts
                            </h1>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {alerts.length === 0 ? (
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-6">
                            <Bell className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            No Alerts Yet
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Price alerts help you get notified when your investments reach target values.
                            This feature will be available soon!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {alerts.map((alert) => (
                            <div key={alert.id} className="card p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${alert.type === 'above'
                                                ? 'bg-success-100 dark:bg-success-900/30'
                                                : 'bg-danger-100 dark:bg-danger-900/30'
                                            }`}>
                                            {alert.type === 'above'
                                                ? <TrendingUp className="w-6 h-6 text-success-600" />
                                                : <TrendingDown className="w-6 h-6 text-danger-600" />
                                            }
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-slate-900 dark:text-white">
                                                {alert.asset_name}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                Alert when price goes {alert.type} ₹{alert.target_price?.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => handleToggle(alert.id, alert.active)}
                                            className={`w-12 h-6 rounded-full transition-colors ${alert.active ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${alert.active ? 'translate-x-6' : 'translate-x-0.5'
                                                }`} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(alert.id)}
                                            className="btn-ghost text-danger-500 hover:bg-danger-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
