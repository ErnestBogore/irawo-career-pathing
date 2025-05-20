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

  const systemPrompt = `Tu es un expert en orientation de carrière. Tu parles uniquement en français.\nTu reçois le texte d'un CV et quelques aspirations.\nRetourne un objet JSON avec un tableau \"suggestions\" (max 5).\nChaque suggestion doit contenir :\n- title (intitulé du métier)\n- description (brève description du métier en français)\n- fitScore (0-100)\n- strengths (tableau de 3 à 5 points forts du candidat par rapport au rôle)\n- weaknesses (tableau de 2 à 4 faiblesses ou écarts)\n- skillsToAcquire (tableau de compétences clés à acquérir pour progresser vers ce rôle).`;

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

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('OpenAI response empty');
    }
    const json = JSON.parse(content);

    return res.status(200).json(json);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate' });
  }
} 