import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Instance OpenAI (clé à fournir via variable env OPENAI_API_KEY)
const openai = new OpenAI();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resumeText } = req.body as {
    resumeText?: string;
  };

  if (!resumeText) {
    return res.status(400).json({ error: 'Missing resumeText' });
  }

  const systemPrompt = `Tu es un recruteur faang, tu connais le type de cv qui marche et que les ATS veulent. Analyze le cv et decortique le et suggere des modifications pour ameliorer les faiblesses. quand tu finis, re-ecris le cv pour l'utilisateur. Tu dois fournir la réponse au format JSON, uniquement en français.\n\nLa réponse JSON doit contenir les champs suivants :\n- weaknesses (tableau d'objets, chaque objet représentant un point faible détaillé)\n- suggestions (tableau d'objets, chaque objet représentant une suggestion d'amélioration très concrète et actionable)\n- rewritten_cv (une chaîne de caractères contenant le CV réécrit et optimisé)`;

  const userPrompt = `CV:\n${resumeText}`; // Simplified user prompt

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

    // Adjusting the response structure to match the new prompt
    const responseData = {
      weaknesses: json.weaknesses || [],
      suggestions: json.suggestions || [],
      rewritten_cv: json.rewritten_cv || '', // Include rewritten_cv in the response
    };

    return res.status(200).json(responseData);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate' });
  }
} 