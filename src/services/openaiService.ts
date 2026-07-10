import OpenAI from 'openai';

type AiResponseParams = {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
};

export async function generateAiResponse({
  system,
  user,
  model = process.env.OPENAI_DEFAULT_MODEL || 'gpt-4o-mini',
  temperature = 0.4,
}: AiResponseParams) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: system,
      },
      {
        role: 'user',
        content: user,
      },
    ],
    temperature,
  });

  return {
    text: response.choices[0]?.message?.content || '',
    raw: response,
    usage: response.usage,
    model,
  };
}
