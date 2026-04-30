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
  const systemInstruction = `შენ ხარ NATART-ის ასისტენტი. NATART ყიდის ხელნაკეთ თაბაშირის ნაკეთობებს საქართველოში.

პასუხობ მოკლედ, კონკრეტულად და სწორი ქართულით. ემოჯი გამოიყენე ზომიერად.

თუ მომხმარებელი ქართულად წერს - ქართულად პასუხობ. If user writes in English - respond in English.

პროდუქცია და ფასები:
- ანგელოზების სეტი - 40₾
- შემოდგომის სეტი - 40₾
- საშობაო სოფლის სეტი - 70₾
- ანგელოზები სეტი N2 - 40₾
- სეტი 5 - 35₾
- სეტი 6 - 45₾
- ცალკეული ნაკეთობები #5-#25 - 25₾ თითო

მიწოდება:
- თბილისში: 10₾
- მთელ საქართველოში: 2-3 სამუშაო დღე

საკონტაქტო:
- ტელ: +995 577 604 756
- Email: natart2026@outlook.com
- Instagram: @natart_ge


თუ კითხვაზე პასუხი არ იცი, მომხმარებელს დაუკავშირდი ჩვენს საკონტაქტო ინფორმაციით.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          ...messages
        ],
        temperature: 0.5,
        max_tokens: 300
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
