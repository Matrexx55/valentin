export default async function handler(req, res) {
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
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  const systemInstruction = `შენ ხარ NATART-ის მეგობრული და თბილი ასისტენტი. NATART არის საქართველოში დაფუძნებული ბრენდი, რომელიც ქმნის ხელნაკეთ თაბაშირის სამკაულებს და სხვა ნაკეთობებს. LANGUAGE RULE: პასუხობ ქართულად, თუ მომხმარებელი ქართულად წერს. If the user writes in English, respond in English. Always match the user language. PRODUCTS AND PRICES: ანგელოზების სეტი 40 lari, შემოდგომის სეტი 40 lari, საშობაო სოფლის სეტი 70 lari, ანგელოზები სეტი N2 40 lari, სეტი 5 35 lari, სეტი 6 45 lari, ნაკეთობები 5-25 თითო 25 lari. DELIVERY: თბილისში 10 lari, 2-3 სამუშაო დღე საქართველოში. CONTACT: natart2026@outlook.com, +995 577 604 756, Instagram @natart_ge. Be warm friendly and helpful. Use emojis occasionally.`;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemInstruction },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 512
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return res.status(500).json({ error: 'AI service error' });
    }
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'მოხდა შეცდომა. გთხოვთ სცადოთ კიდევ ერთხელ.';
    return res.status(200).json({ reply: text });
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}