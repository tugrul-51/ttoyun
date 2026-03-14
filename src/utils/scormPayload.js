export function getInjectedScormData() {
  if (typeof window === "undefined") return null;

  const data = window.__SCORM_DATA__;

  if (!data) return null;
  if (!Array.isArray(data.questions)) return null;
  if (data.questions.length === 0) return null;

  return {
    topic: data.topic || "SCORM İçeriği",
    questions: data.questions,
  };
}