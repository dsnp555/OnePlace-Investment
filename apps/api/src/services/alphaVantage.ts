/**
 * Alpha Vantage API Service
 * 
 * Provides real-time and historical market data
 * Free tier: 25 API calls per day
 */

const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Rate limiting - track calls per day
let dailyCalls = 0;
let lastResetDate = new Date().toDateString();
const DAILY_LIMIT = 25;

interface QuoteData {
    symbol: string;
    name?: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    volume: number;
    previousClose: number;
    timestamp: string;
}

interface SearchResult {
    symbol: string;
    name: string;
    type: string;
    region: string;
    currency: string;
}

interface HistoricalDataPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

interface AlphaVantageError {
    error: string;
    message: string;
    rateLimitRemaining?: number;
}

/**
 * Get API key from environment
 */
function getApiKey(): string {
    const key = process.env.ALPHA_VANTAGE_API_KEY;
    if (!key || key === 'your_api_key_here') {
        throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }
    return key;
}

/**
 * Check and update rate limit
 */
function checkRateLimit(): { allowed: boolean; remaining: number } {
    const today = new Date().toDateString();

    // Reset counter if new day
    if (today !== lastResetDate) {
        dailyCalls = 0;
        lastResetDate = today;
    }

    if (dailyCalls >= DAILY_LIMIT) {
        return { allowed: false, remaining: 0 };
    }

    return { allowed: true, remaining: DAILY_LIMIT - dailyCalls };
}

/**
 * Make API request with rate limiting
 */
async function makeRequest<T>(params: Record<string, string>): Promise<T> {
    const { allowed, remaining } = checkRateLimit();

    if (!allowed) {
        throw {
            error: 'Rate Limit Exceeded',
            message: `Daily API limit (${DAILY_LIMIT}) reached. Resets at midnight.`,
            rateLimitRemaining: 0,
        } as AlphaVantageError;
    }

    const apiKey = getApiKey();
    const queryParams = new URLSearchParams({
        ...params,
        apikey: apiKey,
    });

    const url = `${ALPHA_VANTAGE_BASE_URL}?${queryParams}`;

    try {
        const response = await fetch(url);
        dailyCalls++;

        if (!response.ok) {
            throw {
                error: 'API Error',
                message: `Alpha Vantage returned ${response.status}`,
                rateLimitRemaining: remaining - 1,
            } as AlphaVantageError;
        }

        const data = await response.json();

        // Check for Alpha Vantage error responses
        if (data['Error Message']) {
            throw {
                error: 'Invalid Request',
                message: data['Error Message'],
                rateLimitRemaining: remaining - 1,
            } as AlphaVantageError;
        }

        if (data['Note']) {
            // Rate limit message from Alpha Vantage
            throw {
                error: 'Rate Limited',
                message: data['Note'],
                rateLimitRemaining: remaining - 1,
            } as AlphaVantageError;
        }

        return data as T;
    } catch (error) {
        if ((error as AlphaVantageError).error) {
            throw error;
        }
        throw {
            error: 'Network Error',
            message: String(error),
            rateLimitRemaining: remaining,
        } as AlphaVantageError;
    }
}

/**
 * Get current quote for a symbol
 * @example getQuote('RELIANCE.BSE') for Indian stocks
 */
export async function getQuote(symbol: string): Promise<QuoteData> {
    const data = await makeRequest<any>({
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
    });

    const quote = data['Global Quote'];
    if (!quote || Object.keys(quote).length === 0) {
        throw {
            error: 'Not Found',
            message: `No data found for symbol: ${symbol}`,
        } as AlphaVantageError;
    }

    return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent']?.replace('%', '') || '0'),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        volume: parseInt(quote['06. volume'], 10),
        previousClose: parseFloat(quote['08. previous close']),
        timestamp: quote['07. latest trading day'],
    };
}

/**
 * Search for symbols
 */
export async function searchSymbols(query: string): Promise<SearchResult[]> {
    const data = await makeRequest<any>({
        function: 'SYMBOL_SEARCH',
        keywords: query,
    });

    const matches = data['bestMatches'] || [];

    return matches.map((match: any) => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region'],
        currency: match['8. currency'],
    }));
}

/**
 * Get daily historical prices
 * @param symbol - Stock symbol
 * @param outputSize - 'compact' (last 100 days) or 'full' (20+ years)
 */
export async function getDailyPrices(
    symbol: string,
    outputSize: 'compact' | 'full' = 'compact'
): Promise<{ symbol: string; data: HistoricalDataPoint[] }> {
    const rawData = await makeRequest<any>({
        function: 'TIME_SERIES_DAILY',
        symbol: symbol,
        outputsize: outputSize,
    });

    const timeSeries = rawData['Time Series (Daily)'];
    if (!timeSeries) {
        throw {
            error: 'Not Found',
            message: `No historical data for symbol: ${symbol}`,
        } as AlphaVantageError;
    }

    const data: HistoricalDataPoint[] = Object.entries(timeSeries)
        .map(([date, values]: [string, any]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'], 10),
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
        symbol,
        data,
    };
}

/**
 * Get rate limit status
 */
export function getRateLimitStatus(): { used: number; remaining: number; limit: number; resetsAt: string } {
    const { remaining } = checkRateLimit();

    // Calculate next midnight
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    return {
        used: dailyCalls,
        remaining,
        limit: DAILY_LIMIT,
        resetsAt: tomorrow.toISOString(),
    };
}

/**
 * Popular Indian stock symbols for Alpha Vantage
 */
export const POPULAR_INDIAN_SYMBOLS = [
    { symbol: 'RELIANCE.BSE', name: 'Reliance Industries' },
    { symbol: 'TCS.BSE', name: 'Tata Consultancy Services' },
    { symbol: 'HDFCBANK.BSE', name: 'HDFC Bank' },
    { symbol: 'INFY.BSE', name: 'Infosys' },
    { symbol: 'ICICIBANK.BSE', name: 'ICICI Bank' },
    { symbol: 'HINDUNILVR.BSE', name: 'Hindustan Unilever' },
    { symbol: 'SBIN.BSE', name: 'State Bank of India' },
    { symbol: 'BHARTIARTL.BSE', name: 'Bharti Airtel' },
    { symbol: 'ITC.BSE', name: 'ITC Limited' },
    { symbol: 'KOTAKBANK.BSE', name: 'Kotak Mahindra Bank' },
];

export type { QuoteData, SearchResult, HistoricalDataPoint, AlphaVantageError };
