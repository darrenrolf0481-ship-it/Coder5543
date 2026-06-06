import { GoogleGenAI as RealGoogleGenAI } from '@google/genai';

export const GoogleGenAI = RealGoogleGenAI;

export const Type = {
  OBJECT: 'OBJECT',
  STRING: 'STRING',
  ARRAY: 'ARRAY',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
} as const;

