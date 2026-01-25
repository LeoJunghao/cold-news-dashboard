import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NewsItem } from '@/lib/news';
import { MarketStats } from '@/lib/stats';

export async function POST(request: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not defined in environment variables' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { news, stats } = body as { news: { us: NewsItem[], intl: NewsItem[], geo: NewsItem[], tw: NewsItem[], crypto: NewsItem[] }, stats: MarketStats };

        // Construct the prompt
        let prompt = `請擔任一位專業的全球總體經濟分析師，根據以下提供的即時財經新聞與市場數據，撰寫一份「市場總結分析報告」。

**風格要求：**
1.  **冷靜、客觀、專業**：使用財經專業術語，語氣簡潔有力。
2.  **注重數據與事實**：分析需基於提供的數據，避免空泛的形容。
3.  **結構嚴謹**：分為「綜合分析摘要」、「核心市場動態」、「國際視野與地緣政治」、「台灣市場觀察」與「投資建議與展望」四個段落。
4.  **字數控制**：約 500-600 字。
5.  **繁體中文** (Traditional Chinese)。

**提供的市場數據 (Market Stats):**
- 恐懼與貪婪指數 (Fear & Greed): ${stats.stockFnG}
- VIX 波動率: ${stats.vix?.toFixed(2)}
- 美元指數: ${stats.dollarIndex?.price.toFixed(2)}
- 10年期公債殖利率: ${stats.us10Y?.price.toFixed(2)}%
- 比特幣價格: $${stats.bitcoin?.price.toFixed(0)}

**提供的即時新聞重點 (News Highlights):**
`;

        // Helper to add news to prompt
        const addNews = (category: string, items: NewsItem[], limit: number = 3) => {
            prompt += `\n[${category}]:\n`;
            items.slice(0, limit).forEach(item => {
                prompt += `- ${item.title} (來源: ${item.source})\n`;
            });
        };

        addNews('美國財經焦點', news.us);
        addNews('國際財經視野', news.intl);
        addNews('全球地緣政治', news.geo, 2);
        addNews('台灣財經要聞', news.tw);

        prompt += `\n請根據以上資訊，開始撰寫分析報告：`;

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using 'gemini-2.0-flash' as confirmed available in User's model list
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ summary: text });

    } catch (error: any) {
        console.error('Error generating summary:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate summary' },
            { status: 500 }
        );
    }
}
