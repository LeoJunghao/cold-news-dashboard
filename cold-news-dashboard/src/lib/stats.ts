import { parseStringPromise } from 'xml2js';

export interface MarketQuote {
    price: number;
    changePercent: number;
}

export interface MarketStats {
    vix: number;
    stockFnG: number;
    cryptoFnG: number;
    goldSentiment: number;
    // New Macro Indicators
    us10Y: number;
    us2Y: number;      // New
    dollarIndex: number;
    brentCrude: number;
    goldPrice: number;
    copper: number;    // New
    bdi: number;       // New
    crb: number;       // New
    // Major Indices
    sox: MarketQuote;
    sp500: MarketQuote;
    dji: MarketQuote;
    twii: MarketQuote;
}

// Generic helper to fetch price from Yahoo Finance Chart API
async function getYahooPrice(symbol: string, fallback: number): Promise<number> {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { next: { revalidate: 300 } });
        if (!res.ok) return fallback;
        const data = await res.json();
        const quote = data.chart?.result?.[0]?.meta?.regularMarketPrice;
        return quote !== undefined ? quote : fallback;
    } catch (e) {
        console.error(`Fetch Error for ${symbol}`, e);
        return fallback;
    }
}

// Helper to fetch full quote (price + change%)
async function getYahooQuote(symbol: string): Promise<MarketQuote> {
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { next: { revalidate: 300 } });
        if (!res.ok) return { price: 0, changePercent: 0 };
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice || 0;
        const prevClose = meta?.chartPreviousClose || price;
        const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

        return { price, changePercent };
    } catch (e) {
        console.error(`Quote Fetch Error for ${symbol}`, e);
        return { price: 0, changePercent: 0 };
    }
}

// Helper to fetch from CNBC (better for US Yields & BDI)
async function getCNBCPrice(symbol: string, fallback: number): Promise<number> {
    try {
        const res = await fetch(`https://quote.cnbc.com/quote-html-webservice/quote.htm?partnerId=2&requestMethod=quick&exthrs=1&noform=1&fund=1&output=json&symbols=${symbol}`, { next: { revalidate: 300 } });
        if (!res.ok) return fallback;
        const text = await res.text();
        // CNBC sometimes returns JSONP-like or varying formats, but efficient cleaning:
        const data = JSON.parse(text);
        const quote = data.QuickQuoteResult?.QuickQuote;

        // Handle array or single object
        const target = Array.isArray(quote) ? quote[0] : quote;
        const last = target?.last;

        return last ? parseFloat(last) : fallback;
    } catch (e) {
        console.error(`CNBC Fetch Error for ${symbol}`, e);
        return fallback;
    }
}

// 1. VIX
async function getVIX(): Promise<number> {
    return getYahooPrice('%5EVIX', 20);
}

// New: US 10Y Treasury Yield (^TNX)
async function getUS10Y(): Promise<number> {
    return getYahooPrice('%5ETNX', 4.0);
}

// New: US 2Y Treasury Bond (Source: CNBC US2Y)
async function getUS2Y(): Promise<number> {
    return getCNBCPrice('US2Y', 4.0);
}

// New: Dollar Index (DX-Y.NYB)
async function getDollarIndex(): Promise<number> {
    return getYahooPrice('DX-Y.NYB', 100);
}

// New: Brent Crude Oil (BZ=F)
async function getBrentCrude(): Promise<number> {
    return getYahooPrice('BZ=F', 80);
}

// New: Gold Price (GC=F)
async function getGoldPrice(): Promise<number> {
    return getYahooPrice('GC=F', 2000);
}

// New: Copper Price (HG=F)
async function getCopper(): Promise<number> {
    return getYahooPrice('HG=F', 3.8);
}

// New: BDI Shipping (Source: CNBC .BADI)
async function getBDI(): Promise<number> {
    return getCNBCPrice('.BADI', 1500);
}

// New: CRB Index (^TRCCRB)
async function getCRB(): Promise<number> {
    return getYahooPrice('%5ETRCCRB', 270);
}

// Indices Fetchers
async function getSOX(): Promise<MarketQuote> { return getYahooQuote('%5ESOX'); }
async function getSP500(): Promise<MarketQuote> { return getYahooQuote('%5EGSPC'); }
async function getDJI(): Promise<MarketQuote> { return getYahooQuote('%5EDJI'); }
async function getTWII(): Promise<MarketQuote> { return getYahooQuote('%5ETWII'); }

// 2. Crypto Fear & Greed from Alternative.me
async function getCryptoFnG(): Promise<number> {
    try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1', { next: { revalidate: 3600 } });
        const data = await res.json();
        return parseInt(data.data[0].value) || 50;
    } catch (e) {
        console.error("Crypto FnG Error", e);
        return 50;
    }
}

// 3. Stock Fear & Greed (CNN Proxy)
async function getStockFnG(currentVIX: number): Promise<number> {
    try {
        const res = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 3600 }
        });
        if (res.ok) {
            const data = await res.json();
            const today = data.fear_and_greed?.score;
            if (today) return Math.round(today);
        }
    } catch (e) {
        // Silently fail to fallback
    }

    // Fallback: VIX Proxy
    let proxy = 110 - (3 * currentVIX);
    return Math.max(0, Math.min(100, proxy));
}

// 4. MM Gold Sentiment (Proxy: Gold Trend)
async function getGoldSentiment(): Promise<number> {
    try {
        // GC=F
        const res = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d', { next: { revalidate: 3600 } });
        const data = await res.json();
        const meta = data.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice;
        const prevClose = meta?.chartPreviousClose;

        if (!price || !prevClose) return 50;

        const changePercent = ((price - prevClose) / prevClose) * 100;
        let sentiment = 50 + (changePercent * 10);
        return Math.max(10, Math.min(90, sentiment));
    } catch (e) {
        return 50;
    }
}

export async function getMarketStats(): Promise<MarketStats> {
    // Parallel fetch
    const [vix, cryptoData, us10Y, us2Y, dxy, brent, goldPrice, copper, bdi, crb, sox, sp500, dji, twii] = await Promise.all([
        getVIX(),
        getCryptoFnG(),
        getUS10Y(),
        getUS2Y(),
        getDollarIndex(),
        getBrentCrude(),
        getGoldPrice(),
        getCopper(),
        getBDI(),
        getCRB(),
        getSOX(),
        getSP500(),
        getDJI(),
        getTWII()
    ]);

    // Dependent stats
    const [stockData, goldData] = await Promise.all([
        getStockFnG(vix),
        getGoldSentiment()
    ]);

    return {
        vix,
        stockFnG: stockData,
        cryptoFnG: cryptoData,
        goldSentiment: goldData,
        us10Y,
        us2Y,
        dollarIndex: dxy,
        brentCrude: brent,
        goldPrice,
        copper,
        bdi,
        crb,
        sox,
        sp500,
        dji,
        twii
    };
}
