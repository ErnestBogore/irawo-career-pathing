import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Instance OpenAI (clé à fournir via variable env OPENAI_API_KEY)
const openai = new OpenAI();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeText, aspirations } = req.body as {
    resumeText?: string;
    aspirations?: Record<string, string>;
  };

  if (!resumeText) {
    return res.status(400).json({ error: 'Missing resumeText' });
  }

  const systemPrompt = `Tu es un expert en orientation de carrière. Tu reçois le texte d'un CV et quelques aspirations. Tu dois retourner un JSON avec un tableau suggestions. Chaque élément doit contenir: title, description, fitScore (0-100) et adjacencyScore (0-100). Max 5 suggestions.`;

  const userPrompt = `CV:\n${resumeText}\n---\nAspirations:\n${JSON.stringify(
    aspirations,
    null,
    2
  )}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const json = JSON.parse(completion.choices[0].message.content);

    return res.status(200).json(json);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate' });
  }
} 