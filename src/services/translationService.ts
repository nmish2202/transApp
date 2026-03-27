import axios from 'axios';
import {env} from '@utils/env';

interface TranslateParams {
  apiKey: string;
  text: string;
}

export const translationService = {
  async translateNepaliToHindi({text}: TranslateParams): Promise<string> {
    const groqKey = env.groqApiKey;
    if (!groqKey) {
      return 'Translation unavailable (no Groq key).';
    }

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Translate Nepali to casual Hindi (UP style). Rules:\n- Use आम बोलचाल वाली हिंदी like people speak in Lucknow/Kanpur\n- Use तुम/तू instead of आप, बोलो instead of कहिए, ये instead of यह\n- No formal/literary words. No Sanskrit-heavy words.\n- Write in Devanagari script\n- Give ONLY ONE translation. No explanations, no alternatives, no notes.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 1024
      },
      {
        headers: {
          Authorization: `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return (
      response.data?.choices?.[0]?.message?.content?.trim() ??
      'Translation unavailable.'
    );
  }
};