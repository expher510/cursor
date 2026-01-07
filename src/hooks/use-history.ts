"use client";

import { useState, useEffect, useCallback } from 'react';

export type HistoryItem = {
  id: string;
  title: string;
  timestamp: number;
};

const HISTORY_KEY = 'lingua-stream-history';

export function useHistory(limit: number = 50) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const addHistoryItem = useCallback((item: Omit<HistoryItem, 'timestamp'>) => {
    setHistory(prevHistory => {
      const newHistory = [
        { ...item, timestamp: Date.now() },
        ...prevHistory.filter(h => h.id !== item.id)
      ].slice(0, limit);
      
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
      } catch (error) {
        console.error("Failed to save history to localStorage", error);
      }
      return newHistory;
    });
  }, [limit]);
  
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
        localStorage.removeItem(HISTORY_KEY);
      } catch (error) {
        console.error("Failed to clear history from localStorage", error);
      }
  }, []);

  return { history, addHistoryItem, clearHistory, isLoaded };
}
