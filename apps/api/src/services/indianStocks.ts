/**
 * Indian Stock Market Data Service
 * 
 * Provides real-time stock data for NSE and BSE listed stocks
 * Uses Yahoo Finance as the data source
 * NSE stocks: symbol.NS (e.g., RELIANCE.NS)
 * BSE stocks: symbol.BO (e.g., RELIANCE.BO)
 */

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
    marketCap?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    lastUpdated: Date;
}

interface StockSearchResult {
    symbol: string;
    name: string;
    exchange: 'NSE' | 'BSE';
    type: string;
}

// Popular NSE stocks with full names
const POPULAR_NSE_STOCKS: Record<string, string> = {
    'RELIANCE': 'Reliance Industries Ltd',
    'TCS': 'Tata Consultancy Services Ltd',
    'HDFCBANK': 'HDFC Bank Ltd',
    'INFY': 'Infosys Ltd',
    'ICICIBANK': 'ICICI Bank Ltd',
    'HINDUNILVR': 'Hindustan Unilever Ltd',
    'SBIN': 'State Bank of India',
    'BHARTIARTL': 'Bharti Airtel Ltd',
    'ITC': 'ITC Ltd',
    'KOTAKBANK': 'Kotak Mahindra Bank Ltd',
    'LT': 'Larsen & Toubro Ltd',
    'AXISBANK': 'Axis Bank Ltd',
    'BAJFINANCE': 'Bajaj Finance Ltd',
    'ASIANPAINT': 'Asian Paints Ltd',
    'MARUTI': 'Maruti Suzuki India Ltd',
    'SUNPHARMA': 'Sun Pharmaceutical Industries Ltd',
    'TITAN': 'Titan Company Ltd',
    'WIPRO': 'Wipro Ltd',
    'ULTRACEMCO': 'UltraTech Cement Ltd',
    'NESTLEIND': 'Nestle India Ltd',
    'TATAMOTORS': 'Tata Motors Ltd',
    'POWERGRID': 'Power Grid Corporation of India Ltd',
    'ONGC': 'Oil and Natural Gas Corporation Ltd',
    'NTPC': 'NTPC Ltd',
    'COALINDIA': 'Coal India Ltd',
    'ADANIENT': 'Adani Enterprises Ltd',
    'ADANIPORTS': 'Adani Ports and SEZ Ltd',
    'HCLTECH': 'HCL Technologies Ltd',
    'BAJAJFINSV': 'Bajaj Finserv Ltd',
    'TECHM': 'Tech Mahindra Ltd',
    'TATASTEEL': 'Tata Steel Ltd',
    'JSWSTEEL': 'JSW Steel Ltd',
    'DIVISLAB': "Divi's Laboratories Ltd",
    'DRREDDY': "Dr. Reddy's Laboratories Ltd",
    'CIPLA': 'Cipla Ltd',
    'APOLLOHOSP': 'Apollo Hospitals Enterprise Ltd',
    'EICHERMOT': 'Eicher Motors Ltd',
    'HEROMOTOCO': 'Hero MotoCorp Ltd',
    'BAJAJ-AUTO': 'Bajaj Auto Ltd',
    'M&M': 'Mahindra & Mahindra Ltd',
    'BPCL': 'Bharat Petroleum Corporation Ltd',
    'GRASIM': 'Grasim Industries Ltd',
    'TATACONSUM': 'Tata Consumer Products Ltd',
    'HINDALCO': 'Hindalco Industries Ltd',
    'INDUSINDBK': 'IndusInd Bank Ltd',
    'SBILIFE': 'SBI Life Insurance Company Ltd',
    'HDFCLIFE': 'HDFC Life Insurance Company Ltd',
    'BRITANNIA': 'Britannia Industries Ltd',
    'DABUR': 'Dabur India Ltd',
    'PIDILITIND': 'Pidilite Industries Ltd',
};

// All stock list for search (can be extended)
const ALL_STOCKS: StockSearchResult[] = Object.entries(POPULAR_NSE_STOCKS).map(([symbol, name]) => ({
    symbol,
    name,
    exchange: 'NSE' as const,
    type: 'Equity',
}));

// Cache for stock quotes
const quoteCache = new Map<string, { quote: StockQuote; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Fetch stock quote from Yahoo Finance
 */
async function fetchYahooQuote(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): Promise<StockQuote | null> {
    const yahooSymbol = `${symbol}.${exchange === 'NSE' ? 'NS' : 'BO'}`;

    try {
        // Yahoo Finance quote endpoint
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        if (!response.ok) {
            console.error(`Yahoo Finance API error: ${response.status}`);
            return null;
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (!result) {
            return null;
        }

        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];

        const currentPrice = meta.regularMarketPrice || quote?.close?.[quote.close.length - 1] || 0;
        const previousClose = meta.previousClose || meta.chartPreviousClose || currentPrice;
        const change = currentPrice - previousClose;
        const changePercent = previousClose ? (change / previousClose) * 100 : 0;

        return {
            symbol,
            name: POPULAR_NSE_STOCKS[symbol] || meta.longName || symbol,
            exchange,
            price: Math.round(currentPrice * 100) / 100,
            change: Math.round(change * 100) / 100,
            changePercent: Math.round(changePercent * 100) / 100,
            open: meta.regularMarketOpen || quote?.open?.[0] || 0,
            high: meta.regularMarketDayHigh || Math.max(...(quote?.high || [0])),
            low: meta.regularMarketDayLow || Math.min(...(quote?.low?.filter((l: number) => l > 0) || [0])),
            previousClose,
            volume: meta.regularMarketVolume || 0,
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
            lastUpdated: new Date(),
        };
    } catch (error) {
        console.error(`Error fetching quote for ${symbol}:`, error);
        return null;
    }
}

/**
 * Get stock quote with caching
 */
export async function getStockQuote(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): Promise<StockQuote | null> {
    const cacheKey = `${symbol}.${exchange}`;
    const cached = quoteCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.quote;
    }

    const quote = await fetchYahooQuote(symbol, exchange);

    if (quote) {
        quoteCache.set(cacheKey, { quote, timestamp: Date.now() });
    }

    return quote;
}

/**
 * Get multiple stock quotes
 */
export async function getMultipleQuotes(symbols: string[], exchange: 'NSE' | 'BSE' = 'NSE'): Promise<StockQuote[]> {
    const promises = symbols.map(symbol => getStockQuote(symbol, exchange));
    const results = await Promise.all(promises);
    return results.filter((q): q is StockQuote => q !== null);
}

/**
 * Search for stocks by name or symbol
 */
export function searchStocks(query: string, limit: number = 20): StockSearchResult[] {
    if (!query || query.length < 2) {
        return [];
    }

    const upperQuery = query.toUpperCase();
    const lowerQuery = query.toLowerCase();

    return ALL_STOCKS
        .filter(stock =>
            stock.symbol.includes(upperQuery) ||
            stock.name.toLowerCase().includes(lowerQuery)
        )
        .slice(0, limit);
}

/**
 * Get popular/trending stocks
 */
export async function getPopularStocks(): Promise<StockQuote[]> {
    const popularSymbols = [
        'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
        'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT'
    ];

    return getMultipleQuotes(popularSymbols, 'NSE');
}

/**
 * Get NIFTY 50 index stocks
 */
export function getNifty50Symbols(): string[] {
    return Object.keys(POPULAR_NSE_STOCKS).slice(0, 50);
}

/**
 * Get all available stock symbols
 */
export function getAllStockSymbols(): StockSearchResult[] {
    return ALL_STOCKS;
}

/**
 * Get stock details including company info
 */
export async function getStockDetails(symbol: string, exchange: 'NSE' | 'BSE' = 'NSE'): Promise<{
    quote: StockQuote | null;
    companyInfo: { sector?: string; industry?: string; website?: string; description?: string };
}> {
    const quote = await getStockQuote(symbol, exchange);

    // Basic company info (could be expanded with additional API calls)
    const companyInfo = {
        sector: 'Financial Services', // Would come from additional data source
        industry: 'Banking',
        website: `https://www.google.com/search?q=${symbol}+stock+india`,
        description: POPULAR_NSE_STOCKS[symbol] || symbol,
    };

    return { quote, companyInfo };
}

export type { StockQuote, StockSearchResult };
export { POPULAR_NSE_STOCKS, ALL_STOCKS };
