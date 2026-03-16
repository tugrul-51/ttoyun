import { useCallback, useState } from 'react';

function removeCodeFences(rawText = '') {
  return String(rawText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
}

function findBalancedJsonSlice(source = '', openChar = '[', closeChar = ']') {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === openChar) {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === closeChar && depth > 0) {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return '';
}

function escapeRawLineBreaksInStrings(source = '') {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];

    if (inString) {
      if (escaped) {
        result += char;
        escaped = false;
        continue;
      }

      if (char === '\\') {
        result += char;
        escaped = true;
        continue;
      }

      if (char === '"') {
        result += char;
        inString = false;
        continue;
      }

      if (char === '\n') {
        result += '\\n';
        continue;
      }

      if (char === '\r') {
        result += '\\r';
        continue;
      }
    } else if (char === '"') {
      inString = true;
    }

    result += char;
  }

  return result;
}

function repairJsonText(source = '') {
  return escapeRawLineBreaksInStrings(String(source || ''))
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, '$1')
    .trim();
}

function tryParseQuestionPayload(candidate = '') {
  const attempts = [String(candidate || ''), repairJsonText(candidate)];

  for (const current of attempts) {
    if (!current) continue;
    try {
      const parsed = JSON.parse(current);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.questions)) return parsed.questions;
      if (Array.isArray(parsed?.items)) return parsed.items;
    } catch {
      // keep trying
    }
  }

  return null;
}

function extractJsonArray(rawText = '') {
  const cleaned = removeCodeFences(rawText);
  const candidates = [
    findBalancedJsonSlice(cleaned, '[', ']'),
    findBalancedJsonSlice(cleaned, '{', '}'),
    cleaned.match(/\[[\s\S]*\]/)?.[0] || '',
    cleaned.match(/\{[\s\S]*\}/)?.[0] || '',
  ].filter(Boolean);

  for (const candidate of candidates) {
    const parsed = tryParseQuestionPayload(candidate);
    if (parsed) return parsed;
  }

  throw new Error('Groq geçerli JSON soru listesi döndürmedi. Lütfen tekrar dene.');
}

function coerceQuestionCount(rawValue) {
  const parsed = Number.parseInt(String(rawValue ?? '').trim(), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 10;
  return parsed;
}

async function requestGroqQuestions({ groqKey, groqModel, systemPrompt, userPrompt }) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: groqModel,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const apiMessage = data?.error?.message || data?.message || `Groq API bağlantı hatası (${res.status}).`;
    throw new Error(apiMessage);
  }

  return data?.choices?.[0]?.message?.content || '';
}

export function useQuestionGenerator({ topic, setTopic, normalizeQuestion, notifyError, onQuestionsReady, onBeforeGenerate, onAfterGenerate, onSuccess, defaultQuestionCount = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dots, setDots] = useState('');

  const generateQuestions = useCallback(async (forcedTopic = '', countOverride = null) => {
    const normalizedForcedTopic = typeof forcedTopic === 'string' ? forcedTopic : '';
    const targetTopic = String(normalizedForcedTopic || topic || '').trim();
    const targetCount = coerceQuestionCount(countOverride ?? defaultQuestionCount);

    if (!targetTopic) {
      const message = 'Lütfen önce bir konu yaz.';
      setError(message);
      notifyError?.(message);
      return null;
    }

    setLoading(true);
    setError('');
    onBeforeGenerate?.();

    const groqKey = import.meta.env.VITE_GROQ_API_KEY;
    const groqModel = import.meta.env.VITE_GROQ_MODEL || 'llama-3.3-70b-versatile';

    const systemPrompt = [
      'Sen bir öğretmen yardımcısısın.',
      'Sadece geçerli JSON döndür.',
      'Üst açıklama, markdown, kod bloğu, not, ön söz veya son söz ekleme.',
      'Çıktı tek başına bir JSON dizisi olsun.',
      'Her öğe şu alanlara sahip olsun: q, o, a, hint, explanation, topicTag.',
      'o alanı tam 4 seçenek içersin, a alanı 0 ile 3 arasında sayı olsun.',
      'Tüm string alanlarda satır sonu karakteri kullanma.',
      'Türkçe yaz.'
    ].join(' ');

    const basePrompt = `${targetTopic} konusunda ${targetCount} soruluk çoktan seçmeli test üret. Zorluk dengeli olsun. Tam olarak bu şemaya uy: [{"q":"Soru","o":["A","B","C","D"],"a":0,"hint":"kısa ipucu","explanation":"öğretici açıklama","topicTag":"alt konu"}]`;

    try {
      if (!groqKey || groqKey.includes('BURAYA_GROQ_API_KEY_YAZ')) {
        throw new Error('.env içindeki VITE_GROQ_API_KEY değeri eksik veya örnek değer olarak kalmış. Anahtarı yapıştırıp dev sunucuyu yeniden başlat.');
      }

      let rawText = await requestGroqQuestions({
        groqKey,
        groqModel,
        systemPrompt,
        userPrompt: `${basePrompt} Sadece JSON döndür.`,
      });

      let parsedQuestions;
      try {
        parsedQuestions = extractJsonArray(rawText);
      } catch {
        rawText = await requestGroqQuestions({
          groqKey,
          groqModel,
          systemPrompt,
          userPrompt: `${basePrompt} Önceki yanıt bozuk JSON üretmiş olabilir. Bu kez kesinlikle sadece geçerli JSON dizisi döndür. String alanlarda satır sonu kullanma, sonda virgül bırakma, açıklama veya markdown ekleme.`,
        });
        parsedQuestions = extractJsonArray(rawText);
      }

      const exactQuestions = parsedQuestions.map(normalizeQuestion).filter(Boolean).slice(0, targetCount);

      if (!exactQuestions.length) {
        throw new Error('Soru üretildi ama liste boş geldi. Başka bir konu deneyebilirsin.');
      }

      if (normalizedForcedTopic) setTopic?.(targetTopic);
      onQuestionsReady?.(exactQuestions, targetTopic);
      onSuccess?.();
      return exactQuestions;
    } catch (e) {
      const message = `YZ Hatası: ${e.message}`;
      console.error('[Groq Question Generator]', e);
      setError(message);
      notifyError?.(message);
      return null;
    } finally {
      setLoading(false);
      onAfterGenerate?.();
    }
  }, [defaultQuestionCount, normalizeQuestion, notifyError, onAfterGenerate, onBeforeGenerate, onQuestionsReady, onSuccess, setTopic, topic]);

  return { loading, error, setError, dots, setDots, generateQuestions };
}
