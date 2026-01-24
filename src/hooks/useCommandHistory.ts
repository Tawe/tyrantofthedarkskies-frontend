import { useState, useCallback, useRef } from 'react';

export function useCommandHistory(maxHistory: number = 100) {
  const [history, setHistory] = useState<string[]>([]);
  const indexRef = useRef(-1);
  const historyRef = useRef<string[]>([]);

  const addCommand = useCallback(
    (command: string) => {
      if (!command.trim()) return;
      
      setHistory((prev) => {
        // Don't add duplicate consecutive commands
        if (prev.length > 0 && prev[prev.length - 1] === command) {
          return prev;
        }
        const newHistory = [...prev, command];
        // Limit history size
        const limited = newHistory.slice(-maxHistory);
        historyRef.current = limited;
        indexRef.current = -1;
        return limited;
      });
    },
    [maxHistory]
  );

  const getPrevious = useCallback(() => {
    const currentHistory = historyRef.current;
    if (currentHistory.length === 0) return '';
    
    if (indexRef.current === -1) {
      indexRef.current = currentHistory.length - 1;
    } else {
      indexRef.current = Math.max(0, indexRef.current - 1);
    }
    
    return currentHistory[indexRef.current] || '';
  }, []);

  const getNext = useCallback(() => {
    const currentHistory = historyRef.current;
    if (currentHistory.length === 0) return '';
    
    if (indexRef.current === -1 || indexRef.current >= currentHistory.length - 1) {
      indexRef.current = -1;
      return '';
    }
    
    indexRef.current = indexRef.current + 1;
    return currentHistory[indexRef.current] || '';
  }, []);

  const reset = useCallback(() => {
    indexRef.current = -1;
  }, []);

  // Update ref when history changes
  historyRef.current = history;

  return {
    addCommand,
    getPrevious,
    getNext,
    reset,
  };
}
