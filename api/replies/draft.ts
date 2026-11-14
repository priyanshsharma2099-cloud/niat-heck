import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { persona, review, tone } = req.body;

  if (!persona || !review) {
    return res.status(400).json({ error: 'Store persona and review data are required.' });
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
        temperature: 0.6,
      },
    });

    const prompt = `
You are the Head of Customer Experience for "${persona.name}", an e-commerce boutique store specializing in "${persona.category}".
Brand Voice: "${tone || persona.brand_tone}"

Write a public customer response for this review:
- Customer Rating: ${review.rating} / 5 Stars
- Product Name: ${review.product_name}
- Review Title: ${review.review_title || 'N/A'}
- Review Text: "${review.review_text}"

INSTRUCTIONS:
1. Address the customer warmly.
2. Directly address their specific feedback (garment fit, fabric feel, or dye).
3. Offer a clear, actionable resolution path (exchange, replacement, or customer support touchpoint).
4. Keep it concise (under 75 words) and ready to be posted publicly on Shopify or Meesho.
5. Return ONLY the final reply text.
`;

    const result = await model.generateContent(prompt);
    return res.status(200).json({ reply: result.response.text().trim() });
  } catch (error: any) {
    console.error('Gemini Reply Draft Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to draft reply with Gemini.' });
  }
}
