/**
 * Financial News Service
 * 
 * Fetches live financial news from Alpha Vantage News API
 * and other free news sources for Indian market coverage
 */

interface NewsArticle {
    id: string;
    title: string;
    summary: string;
    source: string;
    url: string;
    imageUrl?: string;
    publishedAt: Date;
    sentiment?: 'positive' | 'neutral' | 'negative';
    tickers?: string[];
    topics?: string[];
}

interface NewsFeed {
    articles: NewsArticle[];
    lastUpdated: Date;
    source: string;
}

// Alpha Vantage API key from environment
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY || '';

// Cache for news to reduce API calls
let newsCache: { articles: NewsArticle[]; timestamp: number } | null = null;
const NEWS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetch news from Alpha Vantage News Sentiment API
 */
async function fetchAlphaVantageNews(
    tickers?: string[],
    topics?: string[],
    limit: number = 20
): Promise<NewsArticle[]> {
    if (!ALPHA_VANTAGE_KEY) {
        console.warn('Alpha Vantage API key not set');
        return getDemoNews();
    }

    try {
        let url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&apikey=${ALPHA_VANTAGE_KEY}`;

        if (tickers && tickers.length > 0) {
            // Add .BSE suffix for Indian stocks
            const formattedTickers = tickers.map(t => `${t}.BSE`).join(',');
            url += `&tickers=${formattedTickers}`;
        }

        if (topics && topics.length > 0) {
            url += `&topics=${topics.join(',')}`;
        }

        url += `&limit=${limit}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Alpha Vantage News API error:', response.status);
            return getDemoNews();
        }

        const data = await response.json();

        if (data.Note || data.Information) {
            // Rate limit hit
            console.warn('Alpha Vantage rate limit:', data.Note || data.Information);
            return getDemoNews();
        }

        if (!data.feed || !Array.isArray(data.feed)) {
            return getDemoNews();
        }

        return data.feed.map((item: any, index: number) => ({
            id: `av_${index}_${Date.now()}`,
            title: item.title || 'Untitled',
            summary: item.summary || '',
            source: item.source || 'Alpha Vantage',
            url: item.url || '#',
            imageUrl: item.banner_image,
            publishedAt: new Date(item.time_published || Date.now()),
            sentiment: mapSentiment(item.overall_sentiment_label),
            tickers: item.ticker_sentiment?.map((t: any) => t.ticker) || [],
            topics: item.topics?.map((t: any) => t.topic) || [],
        }));
    } catch (error) {
        console.error('Error fetching Alpha Vantage news:', error);
        return getDemoNews();
    }
}

/**
 * Map Alpha Vantage sentiment to our format
 */
function mapSentiment(sentiment?: string): 'positive' | 'neutral' | 'negative' {
    if (!sentiment) return 'neutral';
    const lower = sentiment.toLowerCase();
    if (lower.includes('bullish') || lower.includes('positive')) return 'positive';
    if (lower.includes('bearish') || lower.includes('negative')) return 'negative';
    return 'neutral';
}

/**
 * Get demo news for when API is unavailable
 */
function getDemoNews(): NewsArticle[] {
    const now = new Date();
    return [
        {
            id: 'demo_1',
            title: 'Sensex Gains 300 Points, Nifty Above 19,800 on Strong FII Inflows',
            summary: 'Indian equity markets opened higher on Friday, with the BSE Sensex gaining over 300 points in early trade. Foreign institutional investors continue to show confidence in the Indian market.',
            source: 'Economic Times',
            url: 'https://economictimes.indiatimes.com/markets',
            publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
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
            publishedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
            sentiment: 'neutral',
            tickers: ['SBIN', 'HDFCBANK', 'ICICIBANK'],
            topics: ['Economy', 'RBI', 'Interest Rates'],
        },
        {
            id: 'demo_3',
            title: 'IT Stocks Rally as TCS, Infosys Report Strong Q3 Deal Wins',
            summary: 'IT sector stocks surged after leading companies reported robust deal pipeline for Q3. TCS announced $7.8 billion in total contract value for the quarter.',
            source: 'Business Standard',
            url: 'https://www.business-standard.com/technology',
            publishedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
            sentiment: 'positive',
            tickers: ['TCS', 'INFY', 'WIPRO', 'HCLTECH'],
            topics: ['Technology', 'Earnings'],
        },
        {
            id: 'demo_4',
            title: 'Reliance Industries Plans ₹75,000 Crore Investment in Green Energy',
            summary: 'Reliance Industries announced plans to invest ₹75,000 crore in renewable energy projects over the next three years, signaling a major shift towards sustainable business.',
            source: 'NDTV Profit',
            url: 'https://www.ndtvprofit.com/business',
            publishedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
            sentiment: 'positive',
            tickers: ['RELIANCE'],
            topics: ['Green Energy', 'Investments'],
        },
        {
            id: 'demo_5',
            title: 'Auto Sector Faces Headwinds as EV Transition Accelerates',
            summary: 'Traditional automakers face challenges as the electric vehicle market grows rapidly. Analysts recommend selective exposure to the auto sector.',
            source: 'Moneycontrol',
            url: 'https://www.moneycontrol.com/news/business/markets',
            publishedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
            sentiment: 'negative',
            tickers: ['TATAMOTORS', 'MARUTI', 'BAJAJ-AUTO'],
            topics: ['Auto', 'EV'],
        },
        {
            id: 'demo_6',
            title: 'Gold Prices Hit All-Time High Amid Global Uncertainty',
            summary: 'Gold prices in India touched a new record high of ₹63,500 per 10 grams as investors seek safe-haven assets amid geopolitical tensions.',
            source: 'Financial Express',
            url: 'https://www.financialexpress.com/market/commodities',
            publishedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
            sentiment: 'positive',
            tickers: ['GOLD'],
            topics: ['Commodities', 'Gold'],
        },
        {
            id: 'demo_7',
            title: 'SEBI Introduces New Rules for F&O Trading to Protect Retail Investors',
            summary: 'SEBI announced stricter regulations for futures and options trading, including higher margin requirements and position limits for retail participants.',
            source: 'Reuters India',
            url: 'https://in.reuters.com/business',
            publishedAt: new Date(now.getTime() - 14 * 60 * 60 * 1000),
            sentiment: 'neutral',
            tickers: [],
            topics: ['Regulation', 'SEBI'],
        },
        {
            id: 'demo_8',
            title: 'Pharma Stocks Gain on Strong Export Outlook',
            summary: 'Pharmaceutical sector stocks rallied on positive export data and favorable currency movements. Sun Pharma and Dr. Reddy\'s lead the gains.',
            source: 'CNBC TV18',
            url: 'https://www.cnbctv18.com/market',
            publishedAt: new Date(now.getTime() - 16 * 60 * 60 * 1000),
            sentiment: 'positive',
            tickers: ['SUNPHARMA', 'DRREDDY', 'CIPLA'],
            topics: ['Pharma', 'Exports'],
        },
    ];
}

/**
 * Get market news with caching
 */
export async function getMarketNews(limit: number = 10): Promise<NewsFeed> {
    // Check cache
    if (newsCache && Date.now() - newsCache.timestamp < NEWS_CACHE_TTL) {
        return {
            articles: newsCache.articles.slice(0, limit),
            lastUpdated: new Date(newsCache.timestamp),
            source: 'cached',
        };
    }

    const articles = await fetchAlphaVantageNews(undefined, ['finance', 'economy'], limit);

    // Update cache
    newsCache = {
        articles,
        timestamp: Date.now(),
    };

    return {
        articles: articles.slice(0, limit),
        lastUpdated: new Date(),
        source: ALPHA_VANTAGE_KEY ? 'Alpha Vantage' : 'demo',
    };
}

/**
 * Get news for specific stocks
 */
export async function getStockNews(tickers: string[], limit: number = 5): Promise<NewsFeed> {
    const articles = await fetchAlphaVantageNews(tickers, undefined, limit);

    return {
        articles,
        lastUpdated: new Date(),
        source: ALPHA_VANTAGE_KEY ? 'Alpha Vantage' : 'demo',
    };
}

/**
 * Get news by topic
 */
export async function getTopicNews(
    topic: 'technology' | 'finance' | 'economy' | 'earnings' | 'ipo' | 'mergers',
    limit: number = 10
): Promise<NewsFeed> {
    const articles = await fetchAlphaVantageNews(undefined, [topic], limit);

    return {
        articles,
        lastUpdated: new Date(),
        source: ALPHA_VANTAGE_KEY ? 'Alpha Vantage' : 'demo',
    };
}

/**
 * Get market sentiment summary
 */
export function getMarketSentiment(articles: NewsArticle[]): {
    positive: number;
    neutral: number;
    negative: number;
    overall: 'bullish' | 'neutral' | 'bearish';
} {
    const counts = {
        positive: 0,
        neutral: 0,
        negative: 0,
    };

    articles.forEach(article => {
        if (article.sentiment) {
            counts[article.sentiment]++;
        }
    });

    const total = counts.positive + counts.neutral + counts.negative;
    const positiveRatio = total > 0 ? counts.positive / total : 0;
    const negativeRatio = total > 0 ? counts.negative / total : 0;

    let overall: 'bullish' | 'neutral' | 'bearish' = 'neutral';
    if (positiveRatio > 0.5) overall = 'bullish';
    else if (negativeRatio > 0.4) overall = 'bearish';

    return { ...counts, overall };
}

export type { NewsArticle, NewsFeed };
