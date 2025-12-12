'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Newspaper,
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    ExternalLink,
    Clock,
    Filter,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase';

interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    imageUrl?: string;
    publishedAt: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
    tickers?: string[];
    topics?: string[];
}

interface MarketSentiment {
    positive: number;
    neutral: number;
    negative: number;
    overall: 'bullish' | 'neutral' | 'bearish';
}

// Demo news data
const DEMO_NEWS: NewsArticle[] = [
    {
        id: 'demo_1',
        title: 'Sensex Gains 300 Points, Nifty Above 19,800 on Strong FII Inflows',
        summary: 'Indian equity markets opened higher on Friday, with the BSE Sensex gaining over 300 points in early trade. Foreign institutional investors continue to show confidence in the Indian market.',
        source: 'Economic Times',
        url: 'https://economictimes.indiatimes.com/markets',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        tickers: ['SENSEX', 'NIFTY50'],
        topics: ['Markets', 'FII'],
    },
    {
        id: 'demo_2',
        title: 'RBI Keeps Repo Rate Unchanged at 6.5%, GDP Growth Forecast at 7%',
        summary: 'The Reserve Bank of India maintained its repo rate at 6.5% for the fifth consecutive time, citing elevated inflation concerns while projecting robust GDP growth.',
        source: 'Mint',
        url: 'https://www.livemint.com/economy',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        sentiment: 'neutral',
        tickers: ['SBIN', 'HDFCBANK', 'ICICIBANK'],
        topics: ['Economy', 'RBI'],
    },
    {
        id: 'demo_3',
        title: 'IT Stocks Rally as TCS, Infosys Report Strong Q3 Deal Wins',
        summary: 'IT sector stocks surged after leading companies reported robust deal pipeline for Q3. TCS announced $7.8 billion in total contract value for the quarter.',
        source: 'Business Standard',
        url: 'https://www.business-standard.com/technology',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        tickers: ['TCS', 'INFY', 'WIPRO'],
        topics: ['Technology', 'Earnings'],
    },
    {
        id: 'demo_4',
        title: 'Reliance Industries Plans ₹75,000 Crore Investment in Green Energy',
        summary: 'Reliance Industries announced plans to invest ₹75,000 crore in renewable energy projects over the next three years, signaling a major shift towards sustainable business.',
        source: 'NDTV Profit',
        url: 'https://www.ndtvprofit.com/business',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        tickers: ['RELIANCE'],
        topics: ['Green Energy'],
    },
    {
        id: 'demo_5',
        title: 'Auto Sector Faces Headwinds as EV Transition Accelerates',
        summary: 'Traditional automakers face challenges as the electric vehicle market grows rapidly. Analysts recommend selective exposure to the auto sector.',
        source: 'Moneycontrol',
        url: 'https://www.moneycontrol.com/news/business/markets',
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        sentiment: 'negative',
        tickers: ['TATAMOTORS', 'MARUTI'],
        topics: ['Auto', 'EV'],
    },
    {
        id: 'demo_6',
        title: 'Gold Prices Hit All-Time High Amid Global Uncertainty',
        summary: 'Gold prices in India touched a new record high of ₹63,500 per 10 grams as investors seek safe-haven assets amid geopolitical tensions.',
        source: 'Financial Express',
        url: 'https://www.financialexpress.com/market/commodities',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        topics: ['Commodities', 'Gold'],
    },
    {
        id: 'demo_7',
        title: 'SEBI Introduces New Rules for F&O Trading to Protect Retail Investors',
        summary: 'SEBI announced stricter regulations for futures and options trading, including higher margin requirements and position limits for retail participants.',
        source: 'Reuters India',
        url: 'https://in.reuters.com/business',
        publishedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        sentiment: 'neutral',
        topics: ['Regulation', 'SEBI'],
    },
    {
        id: 'demo_8',
        title: 'Pharma Stocks Gain on Strong Export Outlook',
        summary: 'Pharmaceutical sector stocks rallied on positive export data. Sun Pharma and Dr. Reddy\'s lead the gains with 3% and 2.5% respectively.',
        source: 'CNBC TV18',
        url: 'https://www.cnbctv18.com/market',
        publishedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
        sentiment: 'positive',
        tickers: ['SUNPHARMA', 'DRREDDY'],
        topics: ['Pharma', 'Exports'],
    },
];

const SENTIMENT_CONFIG = {
    positive: { icon: TrendingUp, color: 'text-primary-600', bgColor: 'bg-primary-50', label: 'Bullish' },
    neutral: { icon: Minus, color: 'text-slate-600', bgColor: 'bg-slate-100', label: 'Neutral' },
    negative: { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-50', label: 'Bearish' },
};

export default function NewsPage() {
    const router = useRouter();
    const [news, setNews] = useState<NewsArticle[]>(DEMO_NEWS);
    const [sentiment, setSentiment] = useState<MarketSentiment>({ positive: 5, neutral: 2, negative: 1, overall: 'bullish' });
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

    useEffect(() => {
        const checkAuth = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            fetchNews();
        };
        checkAuth();
    }, [router]);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/news`);

            if (response.ok) {
                const data = await response.json();
                if (data.articles && data.articles.length > 0) {
                    setNews(data.articles);
                }
                if (data.sentiment) {
                    setSentiment(data.sentiment);
                }
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchNews();
        setRefreshing(false);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    };

    const filteredNews = filter === 'all'
        ? news
        : news.filter(n => n.sentiment === filter);

    const overallConfig = SENTIMENT_CONFIG[sentiment.overall === 'bullish' ? 'positive' : sentiment.overall === 'bearish' ? 'negative' : 'neutral'];
    const OverallIcon = overallConfig.icon;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                    <Newspaper className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">Market News</h1>
                                    <p className="text-sm text-slate-500">Live financial updates</p>
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
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-6">
                {/* Market Sentiment Card */}
                <div className="card p-6 mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-4">Market Sentiment</h2>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-xl ${overallConfig.bgColor} flex items-center justify-center`}>
                                <OverallIcon className={`w-8 h-8 ${overallConfig.color}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${overallConfig.color}`}>
                                    {sentiment.overall.charAt(0).toUpperCase() + sentiment.overall.slice(1)}
                                </p>
                                <p className="text-slate-500">Based on {news.length} articles</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-primary-600">{sentiment.positive}</p>
                                <p className="text-sm text-slate-500">Bullish</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-600">{sentiment.neutral}</p>
                                <p className="text-sm text-slate-500">Neutral</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-red-600">{sentiment.negative}</p>
                                <p className="text-sm text-slate-500">Bearish</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'positive', 'neutral', 'negative'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === f
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {f === 'all' ? 'All News' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* News List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredNews.map((article) => {
                            const sentimentConfig = article.sentiment ? SENTIMENT_CONFIG[article.sentiment] : SENTIMENT_CONFIG.neutral;
                            const SentimentIcon = sentimentConfig.icon;

                            return (
                                <a
                                    key={article.id}
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="card p-5 block hover:shadow-md transition-all group"
                                >
                                    <div className="flex gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors line-clamp-2">
                                                    {article.title}
                                                </h3>
                                                <div className={`flex-shrink-0 p-2 rounded-lg ${sentimentConfig.bgColor}`}>
                                                    <SentimentIcon className={`w-4 h-4 ${sentimentConfig.color}`} />
                                                </div>
                                            </div>
                                            <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                                                {article.summary}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-medium text-slate-500">{article.source}</span>
                                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                                        <Clock className="w-3 h-3" />
                                                        {formatTime(article.publishedAt)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {article.tickers?.slice(0, 3).map((ticker) => (
                                                        <span key={ticker} className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded font-medium">
                                                            {ticker}
                                                        </span>
                                                    ))}
                                                    <ExternalLink className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* Auto-refresh notice */}
                <div className="mt-8 text-center text-sm text-slate-400">
                    <p>News updates every 30 minutes • Last updated: {new Date().toLocaleTimeString()}</p>
                </div>
            </main>
        </div>
    );
}
