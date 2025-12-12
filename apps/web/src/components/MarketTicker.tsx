'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface MarketQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
}

interface MarketTickerProps {
    apiUrl?: string;
}

const DEFAULT_QUOTES: MarketQuote[] = [
    { symbol: 'SENSEX', name: 'BSE Sensex', price: 65890.50, change: 0.52 },
    { symbol: 'NIFTY50', name: 'Nifty 50', price: 19750.25, change: 0.45 },
    { symbol: 'GOLD', name: 'Gold (₹/10g)', price: 62500, change: -0.15 },
    { symbol: 'BTC', name: 'Bitcoin', price: 3700000, change: 2.15 },
];

export default function MarketTicker({ apiUrl }: MarketTickerProps) {
    const [quotes, setQuotes] = useState<MarketQuote[]>(DEFAULT_QUOTES);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rateLimitInfo, setRateLimitInfo] = useState<{
        used: number;
        remaining: number;
        limit: number;
    } | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const fetchMarketData = async () => {
        if (!apiUrl) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/api/markets/summary`);
            if (!response.ok) throw new Error('Failed to fetch market data');

            const data = await response.json();

            const newQuotes: MarketQuote[] = [];

            // Add indices
            if (data.indices) {
                data.indices.forEach((item: any) => {
                    newQuotes.push({
                        symbol: item.symbol,
                        name: item.name,
                        price: item.price,
                        change: item.change,
                    });
                });
            }

            // Add commodities
            if (data.commodities) {
                data.commodities.forEach((item: any) => {
                    newQuotes.push({
                        symbol: item.symbol,
                        name: item.name,
                        price: item.price,
                        change: item.change,
                    });
                });
            }

            // Add crypto
            if (data.crypto) {
                data.crypto.forEach((item: any) => {
                    newQuotes.push({
                        symbol: item.symbol,
                        name: item.name,
                        price: item.price,
                        change: item.change,
                    });
                });
            }

            if (newQuotes.length > 0) {
                setQuotes(newQuotes);
            }
        } catch (err) {
            setError('Unable to fetch live data');
            console.error('Market fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMarketData();
        // Refresh every 5 minutes
        const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [apiUrl]);

    // Auto-scroll through quotes
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % quotes.length);
        }, 4000);
        return () => clearInterval(timer);
    }, [quotes.length]);

    const formatPrice = (price: number) => {
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)}Cr`;
        if (price >= 100000) return `₹${(price / 100000).toFixed(2)}L`;
        if (price >= 1000) return `₹${price.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
        return `₹${price.toFixed(2)}`;
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length);
    };

    const visibleQuotes = [
        quotes[currentIndex],
        quotes[(currentIndex + 1) % quotes.length],
        quotes[(currentIndex + 2) % quotes.length],
        quotes[(currentIndex + 3) % quotes.length],
    ];

    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
                {/* Left Arrow */}
                <button
                    onClick={handlePrev}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Previous"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>

                {/* Ticker Items */}
                <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-around gap-6">
                        {visibleQuotes.map((quote, idx) => (
                            <div
                                key={`${quote.symbol}-${idx}`}
                                className="flex items-center gap-3 min-w-0 transition-all duration-500"
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs text-slate-500 truncate font-medium">
                                        {quote.name}
                                    </span>
                                    <span className="text-sm font-bold text-slate-900">
                                        {formatPrice(quote.price)}
                                    </span>
                                </div>
                                <div
                                    className={`flex items-center gap-0.5 px-2 py-1 rounded-md text-xs font-semibold ${quote.change >= 0
                                            ? 'bg-primary-50 text-primary-600'
                                            : 'bg-red-50 text-red-600'
                                        }`}
                                >
                                    {quote.change >= 0 ? (
                                        <TrendingUp className="w-3 h-3" />
                                    ) : (
                                        <TrendingDown className="w-3 h-3" />
                                    )}
                                    {Math.abs(quote.change).toFixed(2)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Arrow */}
                <button
                    onClick={handleNext}
                    className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Next"
                >
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                {/* Refresh Button */}
                <button
                    onClick={fetchMarketData}
                    disabled={loading}
                    className="ml-3 p-1.5 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 text-primary-500 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Error indicator */}
            {error && (
                <div className="flex items-center justify-center gap-1 pb-2 text-xs text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    {error} - showing cached data
                </div>
            )}

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1 pb-2">
                {quotes.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-primary-500' : 'bg-slate-200'
                            }`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
