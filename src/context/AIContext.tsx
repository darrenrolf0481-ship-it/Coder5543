import React, { createContext, useContext, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";

interface AIContextType {
  ai: any;
}

const AIContext = createContext<AIContextType | null>(null);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ai = useMemo(() => {
    if (import.meta.env.GEMINI_API_KEY) {
      return new GoogleGenAI({ apiKey: import.meta.env.GEMINI_API_KEY });
    }
    return null;
  }, []);

  return (
    <AIContext.Provider value={{ ai }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
