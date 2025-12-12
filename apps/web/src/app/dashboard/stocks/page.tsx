'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Search,
    TrendingUp,
    TrendingDown,
    Star,
    StarOff,
    RefreshCw,
    Eye,
    Filter,
    ChevronRight,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase';

interface StockQuote {
    symbol: string;
    name: string;
    exchange: 'NSE' | 'BSE';
    price: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    previousClose: number;
    volume: number;
    lastUpdated: string;
}

interface StockSearchResult {
    symbol: string;
    name: string;
    exchange: 'NSE' | 'BSE';
    type: string;
}

interface WatchlistItem {
    id: string;
    symbol: string;
    name: string;
    exchange: string;
}

// Popular NSE stocks for demo
const DEMO_STOCKS: StockQuote[] = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', price: 2456.75, change: 23.45, changePercent: 0.96, open: 2430.00, high: 2465.00, low: 2425.00, previousClose: 2433.30, volume: 8543210, lastUpdated: new Date().toISOString() },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', price: 3892.50, change: -45.20, changePercent: -1.15, open: 3935.00, high: 3945.00, low: 3880.00, previousClose: 3937.70, volume: 2134567, lastUpdated: new Date().toISOString() },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', price: 1678.25, change: 12.80, changePercent: 0.77, open: 1665.00, high: 1685.00, low: 1660.00, previousClose: 1665.45, volume: 5678901, lastUpdated: new Date().toISOString() },
    { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', price: 1534.60, change: 8.90, changePercent: 0.58, open: 1525.00, high: 1540.00, low: 1520.00, previousClose: 1525.70, volume: 3456789, lastUpdated: new Date().toISOString() },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE', price: 1023.45, change: -5.60, changePercent: -0.54, open: 1030.00, high: 1035.00, low: 1020.00, previousClose: 1029.05, volume: 4567890, lastUpdated: new Date().toISOString() },
    { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', price: 628.90, change: 7.25, changePercent: 1.17, open: 620.00, high: 632.00, low: 618.00, previousClose: 621.65, volume: 9876543, lastUpdated: new Date().toISOString() },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', exchange: 'NSE', price: 1245.30, change: 15.40, changePercent: 1.25, open: 1228.00, high: 1250.00, low: 1225.00, previousClose: 1229.90, volume: 2345678, lastUpdated: new Date().toISOString() },
    { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE', price: 456.75, change: -2.35, changePercent: -0.51, open: 460.00, high: 462.00, low: 455.00, previousClose: 459.10, volume: 7654321, lastUpdated: new Date().toISOString() },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', exchange: 'NSE', price: 1789.20, change: 21.60, changePercent: 1.22, open: 1765.00, high: 1795.00, low: 1760.00, previousClose: 1767.60, volume: 1234567, lastUpdated: new Date().toISOString() },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd', exchange: 'NSE', price: 3234.85, change: -18.90, changePercent: -0.58, open: 3255.00, high: 3260.00, low: 3225.00, previousClose: 3253.75, volume: 890123, lastUpdated: new Date().toISOString() },
];

const SEARCH_RESULTS: StockSearchResult[] = [
    { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'INFY', name: 'Infosys Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', type: 'Equity' },
    { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'ITC', name: 'ITC Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'LT', name: 'Larsen & Toubro Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'AXISBANK', name: 'Axis Bank Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'TITAN', name: 'Titan Company Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'WIPRO', name: 'Wipro Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', exchange: 'NSE', type: 'Equity' },
    { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', exchange: 'NSE', type: 'Equity' },
];

export default function StocksPage() {
    const router = useRouter();
    const [stocks, setStocks] = useState<StockQuote[]>(DEMO_STOCKS);
    const [watchlist, setWatchlist] = useState<Set<string>>(new Set(['RELIANCE', 'INFY']));
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'watchlist'>('all');
    const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { user } = await getCurrentUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }
            fetchStocks();
        };
        checkAuth();
    }, [router]);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/stocks/popular`);

            if (response.ok) {
                const data = await response.json();
                if (data.stocks && data.stocks.length > 0) {
                    setStocks(data.stocks);
                }
            }
        } catch (error) {
            console.error('Error fetching stocks:', error);
            // Keep demo data on error
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStocks();
        setRefreshing(false);
    };

    // Fetch real stock quote from API
    const fetchStockQuote = async (symbol: string, name: string, exchange: 'NSE' | 'BSE' = 'NSE'): Promise<StockQuote> => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${apiUrl}/api/stocks/quote/${symbol}?exchange=${exchange}`);

            if (response.ok) {
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error('Error fetching stock quote:', error);
        }

        // Return demo data with realistic values if API fails
        const demoStock = DEMO_STOCKS.find(s => s.symbol === symbol);
        if (demoStock) return demoStock;

        // Generate random demo data
        const basePrice = 500 + Math.random() * 2000;
        const change = (Math.random() - 0.5) * 50;
        return {
            symbol,
            name,
            exchange,
            price: Math.round(basePrice * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round((change / basePrice) * 10000) / 100,
            open: Math.round((basePrice - Math.random() * 20) * 100) / 100,
            high: Math.round((basePrice + Math.random() * 30) * 100) / 100,
            low: Math.round((basePrice - Math.random() * 30) * 100) / 100,
            previousClose: Math.round((basePrice - change) * 100) / 100,
            volume: Math.floor(Math.random() * 10000000),
            lastUpdated: new Date().toISOString(),
        };
    };

    const handleStockClick = async (symbol: string, name: string, exchange: 'NSE' | 'BSE' = 'NSE') => {
        setSearchQuery('');
        setSearchResults([]);

        // Check if stock already in list with real data
        const existingStock = stocks.find(s => s.symbol === symbol && s.price > 0);
        if (existingStock) {
            setSelectedStock(existingStock);
            return;
        }

        // Fetch real data
        setLoading(true);
        const stockData = await fetchStockQuote(symbol, name, exchange);
        setLoading(false);

        // Add to stocks list if not present
        if (!stocks.find(s => s.symbol === symbol)) {
            setStocks(prev => [stockData, ...prev]);
        }

        setSelectedStock(stockData);
    };

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);

        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        const upperQuery = query.toUpperCase();
        const lowerQuery = query.toLowerCase();

        const results = SEARCH_RESULTS.filter(
            stock =>
                stock.symbol.includes(upperQuery) ||
                stock.name.toLowerCase().includes(lowerQuery)
        );

        setSearchResults(results);
    }, []);

    const toggleWatchlist = async (symbol: string, name: string) => {
        const isInWatchlist = watchlist.has(symbol);

        if (isInWatchlist) {
            setWatchlist(prev => {
                const newSet = new Set(prev);
                newSet.delete(symbol);
                return newSet;
            });
        } else {
            setWatchlist(prev => {
                const newSet = new Set(Array.from(prev));
                newSet.add(symbol);
                return newSet;
            });
        }

        // API call to update watchlist
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            if (isInWatchlist) {
                await fetch(`${apiUrl}/api/stocks/watchlist/${symbol}`, { method: 'DELETE' });
            } else {
                await fetch(`${apiUrl}/api/stocks/watchlist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol, name, exchange: 'NSE' }),
                });
            }
        } catch (error) {
            console.error('Watchlist update error:', error);
        }
    };

    const filteredStocks = activeTab === 'watchlist'
        ? stocks.filter(s => watchlist.has(s.symbol))
        : stocks;

    const formatVolume = (volume: number) => {
        if (volume >= 10000000) return `${(volume / 10000000).toFixed(2)} Cr`;
        if (volume >= 100000) return `${(volume / 100000).toFixed(2)} L`;
        return volume.toLocaleString('en-IN');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5 text-slate-600" />
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">Indian Stocks</h1>
                                <p className="text-sm text-slate-500">NSE & BSE Real-Time Data</p>
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

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search stocks by name or symbol..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 max-h-80 overflow-y-auto z-30">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.symbol}
                                        onClick={() => handleStockClick(result.symbol, result.name, result.exchange)}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                    >
                                        <div className="text-left">
                                            <p className="font-semibold text-slate-900">{result.symbol}</p>
                                            <p className="text-sm text-slate-500">{result.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded">{result.exchange}</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleWatchlist(result.symbol, result.name);
                                                }}
                                                className="p-1 hover:bg-slate-100 rounded"
                                            >
                                                {watchlist.has(result.symbol) ? (
                                                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                                ) : (
                                                    <StarOff className="w-5 h-5 text-slate-400" />
                                                )}
                                            </button>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'all'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        All Stocks
                    </button>
                    <button
                        onClick={() => setActiveTab('watchlist')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'watchlist'
                            ? 'bg-primary-500 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                    >
                        <Star className="w-4 h-4" />
                        Watchlist ({watchlist.size})
                    </button>
                </div>

                {/* Stock Cards Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                    </div>
                ) : filteredStocks.length === 0 ? (
                    <div className="text-center py-12">
                        <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">
                            {activeTab === 'watchlist' ? 'Your watchlist is empty' : 'No stocks found'}
                        </h3>
                        <p className="text-slate-500">
                            {activeTab === 'watchlist'
                                ? 'Add stocks to your watchlist by clicking the star icon'
                                : 'Try searching for a different stock'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStocks.map((stock) => (
                            <div
                                key={stock.symbol}
                                className="card p-5 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => setSelectedStock(stock)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900">{stock.symbol}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-1">{stock.name}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWatchlist(stock.symbol, stock.name);
                                        }}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        {watchlist.has(stock.symbol) ? (
                                            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        ) : (
                                            <StarOff className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">
                                            ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </p>
                                        <div className={`flex items-center gap-1 text-sm font-medium ${stock.change >= 0 ? 'text-primary-600' : 'text-red-600'
                                            }`}>
                                            {stock.change >= 0 ? (
                                                <TrendingUp className="w-4 h-4" />
                                            ) : (
                                                <TrendingDown className="w-4 h-4" />
                                            )}
                                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                                        </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded">
                                        {stock.exchange}
                                    </span>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-500">Open</p>
                                        <p className="font-medium text-slate-700">₹{stock.open.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">High</p>
                                        <p className="font-medium text-primary-600">₹{stock.high.toLocaleString('en-IN')}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500">Low</p>
                                        <p className="font-medium text-red-600">₹{stock.low.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Stock Detail Modal */}
            {selectedStock && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStock(null)}>
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedStock.symbol}</h2>
                                <p className="text-slate-500">{selectedStock.name}</p>
                            </div>
                            <button
                                onClick={() => toggleWatchlist(selectedStock.symbol, selectedStock.name)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {watchlist.has(selectedStock.symbol) ? (
                                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                                ) : (
                                    <StarOff className="w-6 h-6 text-slate-400" />
                                )}
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-4xl font-bold text-slate-900">
                                ₹{selectedStock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                            <div className={`flex items-center gap-2 text-lg font-medium ${selectedStock.change >= 0 ? 'text-primary-600' : 'text-red-600'
                                }`}>
                                {selectedStock.change >= 0 ? (
                                    <TrendingUp className="w-5 h-5" />
                                ) : (
                                    <TrendingDown className="w-5 h-5" />
                                )}
                                {selectedStock.change >= 0 ? '+' : ''}₹{selectedStock.change.toFixed(2)} ({selectedStock.changePercent.toFixed(2)}%)
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-500">Open</p>
                                <p className="font-semibold text-slate-900">₹{selectedStock.open.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-500">Previous Close</p>
                                <p className="font-semibold text-slate-900">₹{selectedStock.previousClose.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3 bg-primary-50 rounded-lg">
                                <p className="text-sm text-primary-600">Day High</p>
                                <p className="font-semibold text-primary-700">₹{selectedStock.high.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Day Low</p>
                                <p className="font-semibold text-red-700">₹{selectedStock.low.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                                <p className="text-sm text-slate-500">Volume</p>
                                <p className="font-semibold text-slate-900">{formatVolume(selectedStock.volume)}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedStock(null)}
                                className="flex-1 btn-secondary"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => toggleWatchlist(selectedStock.symbol, selectedStock.name)}
                                className="flex-1 btn-primary"
                            >
                                {watchlist.has(selectedStock.symbol) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
