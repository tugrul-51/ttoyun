import { useCallback, useState } from 'react';

function extractJsonArray(rawText = '') {
  const cleaned = String(rawText || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const directArrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (directArrayMatch) {
    return JSON.parse(directArrayMatch[0]);
  }

  const directObjectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (directObjectMatch) {
    const parsedObject = JSON.parse(directObjectMatch[0]);
    if (Array.isArray(parsedObject)) return parsedObject;
    if (Array.isArray(parsedObject.questions)) return parsedObject.questions;
    if (Array.isArray(parsedObject.items)) return parsedObject.items;
  }

  throw new Error('Groq geçerli JSON soru listesi döndürmedi.');
}

export function useQuestionGenerator({ topic, setTopic, normalizeQuestion, notifyError, onQuestionsReady, onBeforeGenerate, onAfterGenerate, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dots, setDots] = useState('');

  const generateQuestions = useCallback(async (forcedTopic = '') => {
    const normalizedForcedTopic = typeof forcedTopic === 'string' ? forcedTopic : '';
    const targetTopic = String(normalizedForcedTopic || topic || '').trim();
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
      'Yalnızca geçerli JSON döndür.',
      'Üst açıklama, markdown, kod bloğu veya ekstra metin ekleme.',
      'Çıktı bir JSON dizisi olsun.',
      'Her öğe şu alanlara sahip olsun: q, o, a, hint, explanation, topicTag.',
      'o alanı tam 4 seçenek içersin, a alanı 0 ile 3 arasında sayı olsun.',
      'Türkçe yaz.'
    ].join(' ');

    const userPrompt = `${targetTopic} konusunda 15 soruluk çoktan seçmeli test üret. Zorluk dengeli olsun. Tam olarak bu şemaya uy: [{"q":"Soru","o":["A","B","C","D"],"a":0,"hint":"kısa ipucu","explanation":"öğretici açıklama","topicTag":"alt konu"}]`;

    try {
      if (!groqKey || groqKey.includes('BURAYA_GROQ_API_KEY_YAZ')) {
        throw new Error('.env içindeki VITE_GROQ_API_KEY değeri eksik veya örnek değer olarak kalmış. Anahtarı yapıştırıp dev sunucuyu yeniden başlat.');
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          temperature: 0.5,
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

      const rawText = data?.choices?.[0]?.message?.content || '';
      const parsedQuestions = extractJsonArray(rawText).map(normalizeQuestion).filter(Boolean);

      if (!parsedQuestions.length) {
        throw new Error('Soru üretildi ama liste boş geldi. Başka bir konu deneyebilirsin.');
      }

      if (normalizedForcedTopic) setTopic?.(targetTopic);
      onQuestionsReady?.(parsedQuestions, targetTopic);
      onSuccess?.();
      return parsedQuestions;
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
  }, [normalizeQuestion, notifyError, onAfterGenerate, onBeforeGenerate, onQuestionsReady, onSuccess, setTopic, topic]);

  return { loading, error, setError, dots, setDots, generateQuestions };
}
