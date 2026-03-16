import { useEffect } from 'react';
import { commitScorm, finishScorm, flushQueuedData, getScormDebugInfo, initScorm, setScormLocation, setScormProgressData, setScormScore, setScormSessionTime, setScormStatus } from '../utils/scormRuntime';

export function useScormBridge({ screen, score, correct, total, startedAt }) {
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (startedAt) setScormSessionTime((Date.now() - startedAt) / 1000);
      flushQueuedData();
      commitScorm();
      finishScorm();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [startedAt]);

  useEffect(() => {
    if (screen) {
      setScormLocation(screen);
      commitScorm();
    }
  }, [screen]);

  useEffect(() => {
    setScormScore(score || 0);
    setScormProgressData({ correct: correct || 0, total: total || 0, screen });
    commitScorm();
  }, [score, correct, total, screen]);

  return {
    scormApi: {
      commitScorm,
      finishScorm,
      flushQueuedData,
      getScormDebugInfo,
      initScorm,
      setScormLocation,
      setScormProgressData,
      setScormScore,
      setScormSessionTime,
      setScormStatus,
    },
  };
}
