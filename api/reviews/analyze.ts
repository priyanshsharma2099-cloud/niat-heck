import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { persona, reviews } = req.body;

  if (!persona || !reviews || !Array.isArray(reviews)) {
    return res.status(400).json({ error: 'Invalid payload. Store persona and reviews array required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const prompt = `
You are the Chief Quality Officer and Customer Sentiment Specialist for an e-commerce boutique store.

STORE PERSONA PROFILE:
- Category: ${persona.category}
- Target Demographic: ${persona.target_demographic}
- Price Tier: ${persona.price_tier}
- Brand Voice: ${persona.brand_tone}
- Acceptable Product Tolerances/Variations: ${persona.acceptable_variations}

TASK:
Analyze the following customer reviews:
1. Determine if each review is NOISE (delivery courier delay, package crushed by delivery carrier, or irrelevant to product craftsmanship/fit).
2. Classify sentiment score (-1.00 to +1.00) and label (positive/neutral/negative).
3. Identify primary attribute: "sizing" | "fabric" | "stitching" | "color" | "value" | "service".
4. Extract 1-3 micro key phrases.
5. Generate 2 to 4 high-leverage operational action checklist items specifically actionable for this seller.
6. Flag any sentiment anomaly alert if complaints for a single attribute exceed standard thresholds.

RAW REVIEWS:
${JSON.stringify(reviews.slice(0, 30))}

OUTPUT FORMAT:
Strictly return a valid JSON object matching this schema:
{
  "analyzed_reviews": [
    {
      "review_id": string,
      "is_noise": boolean,
      "noise_reason": string | null,
      "sentiment_score": number,
      "sentiment_label": "positive" | "neutral" | "negative",
      "primary_attribute": "sizing" | "fabric" | "stitching" | "color" | "value" | "service",
      "key_phrases": string[]
    }
  ],
  "action_items": [
    {
      "title": string,
      "description": string,
      "category": "Manufacturing" | "Sizing / Catalog" | "Packaging" | "Photography" | "Customer Support",
      "priority": "critical" | "medium" | "low",
      "estimated_impact": string
    }
  ],
  "sentiment_alerts": [
    {
      "attribute": string,
      "severity": "high" | "medium" | "info",
      "percentage_surge": number,
      "message": string
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    return res.status(200).json(parsed);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to analyze reviews with Gemini.' });
  }
}
