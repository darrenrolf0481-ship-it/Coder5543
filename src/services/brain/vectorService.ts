import logger from '../../utils/logger.js';

export class VectorService {
  /**
   * Generates an embedding for the given text using Ollama.
   * Defaults to llama3.2 for embeddings if not specified.
   */
  async getEmbedding(text: string, model = 'llama3.2:latest'): Promise<number[]> {
    try {
      const isBackend = typeof window === 'undefined';
      const baseUrl = isBackend ? (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434') : '';
      const endpoint = isBackend ? '/api/embeddings' : './api/ollama/embeddings';

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: text }),
      });

      if (!response.ok) {
        throw new Error(`Embedding failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (err) {
      logger.error('[VectorService] Error generating embedding:', err);
      return [];
    }
  }

  /**
   * Calculates cosine similarity between two vectors.
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }
}

export const vectorService = new VectorService();
