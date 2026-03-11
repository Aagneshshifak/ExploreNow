import axios from 'axios';
import { Request, Response } from 'express';

const allowedLanguages = ['fr', 'de', 'hi', 'es', 'ru', 'zh', 'ar', 'pt'];

export const translateText = async (req: Request, res: Response) => {
  const { text, target } = req.body;

  if (!text || !target) {
    return res.status(400).json({ 
      success: false,
      data: null,
      message: 'Text and target language required' 
    });
  }

  if (!allowedLanguages.includes(target)) {
    return res.status(400).json({ 
      success: false,
      data: null,
      message: `Unsupported target language. Allowed: ${allowedLanguages.join(', ')}` 
    });
  }

  try {
    const response = await axios.post(
      'https://libretranslate.de/translate',
      {
        q: text,
        source: 'en',
        target,
        format: 'text',
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000, // 10 second timeout
      }
    );

    return res.status(200).json({ 
      success: true,
      data: {
        original: text,
        translated: response.data.translatedText,
        sourceLanguage: 'en',
        targetLanguage: target
      },
      message: 'Translation successful'
    });
  } catch (err: any) {
    console.error('Translation error:', err.message || err);
    return res.status(500).json({ 
      success: false,
      data: null,
      message: 'Translation service temporarily unavailable'
    });
  }
};