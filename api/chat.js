export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemInstruction = `
შენ ხარ NATART-ის მეგობრული და თბილი ასისტენტი. NATART არის საქართველოში დაფუძნებული ბრენდი, რომელიც ქმნის ხელნაკეთ თაბაშირის სამკაულებს და სხვა ნაკეთობებს.

LANGUAGE RULE: პასუხობ ქართულად, თუ მომხმარებელი ქართულად წერს. If the user writes in English, respond in English. Always match the user's language.

NATART KNOWLEDGE BASE:

🛍️ PRODUCTS & PRICES:
- ანგელოზების სეტი / Angel Set — 40₾
- შემოდგომის სეტი / Autumn Set — 40₾
- საშობაო სოფლის სეტი / Christmas Village Set — 70₾
- ანგელოზები სეტი N2 / Angel Set N2 — 40₾
- სეტი 5 / Set 5 — 35₾
- სეტი 6 / Set 6 — 45₾
- ნაკეთობები #5–#25 / Individual Items #5–#25 — 25₾ each

🚚 DELIVERY:
- Tbilisi delivery: 10₾
- Delivery time across Georgia: 2–3 business days
- Custom orders available — contact us directly

📞 CONTACT:
- Email: natart2026@outlook.com
- Phone: +995 577 604 756
- Instagram: @natart_ge
- Location: Tbilisi, Georgia

🛒 ORDERING:
- Customers can add items to the cart directly on the website
- For custom orders or questions, contact us via phone, email, or Instagram

PERSONALITY: Be warm, helpful, and enthusiastic about NATART's handcrafted products. Keep responses concise and friendly. Use relevant emojis occasionally to keep the tone cheerful. If you don't know something, direct the customer to contact NATART directly.
  `.trim();

  try {
    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return res.status(500).json({ error: 'AI service error' });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'მოხდა შეცდომა. გთხოვთ სცადოთ კიდევ ერთხელ.';

    return res.status(200).json({ reply: text });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
