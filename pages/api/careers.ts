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

  const systemPrompt = `Tu es un expert en recrutement et en optimisation de CV, avec une connaissance approfondie des attentes des entreprises technologiques de premier plan (type FAANG). Ton rôle est d'analyser un CV fourni, d'identifier ses points faibles ou les aspects qui pourraient être améliorés pour attirer l'attention des recruteurs de ces entreprises, et de proposer des suggestions concrètes pour y remédier. Tu dois fournir la réponse au format JSON, uniquement en français.\n\nLa réponse JSON doit contenir les champs suivants :\n- weaknesses (tableau d'objets, chaque objet représentant un point faible)\n- suggestions (tableau d'objets, chaque objet représentant une suggestion d'amélioration)\n\nChaque objet dans le tableau 'weaknesses' doit contenir :\n- description (description du point faible identifié)\n\nChaque objet dans le tableau 'suggestions' doit contenir :\n- description (description de la suggestion pour améliorer le CV)\n- correspondingWeakness (optionnel, pour lier une suggestion à un point faible spécifique, si pertinent)`;

  const userPrompt = `Analyse ce CV et fournis une réponse JSON identifiant ses faiblesses et proposant des suggestions pour l'améliorer afin qu'il soit attrayant pour les recruteurs d'entreprises type FAANG :\n\nCV:\n${resumeText}`;

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
    };

    return res.status(200).json(responseData);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to generate' });
  }
} 