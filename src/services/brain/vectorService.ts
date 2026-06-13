import logger from '../../utils/logger.js';

export class VectorService {
  /** How long to stop calling the embedding endpoint after a connection failure. */
  private static readonly COOLDOWN_MS = 60_000;
  /** Epoch ms until which the embedding endpoint is treated as unavailable (0 = healthy). */
  private static unavailableUntil = 0;

  /**
   * Generates an embedding for the given text using Ollama.
   * Defaults to nomic-embed-text for embeddings if not specified.
   */
  async getEmbedding(text: string, model = 'nomic-embed-text'): Promise<number[]> {
    // Circuit breaker: if the embedding endpoint recently failed to connect,
    // short-circuit without hammering it (and without re-logging) until cooldown.
    if (Date.now() < VectorService.unavailableUntil) {
      return [];
    }

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
      // Recovered (or first success): clear any tripped breaker.
      VectorService.unavailableUntil = 0;
      return data.embedding;
    } catch (err) {
      // A failed `fetch` (vs. a non-2xx response) means the endpoint is unreachable
      // — e.g. Ollama isn't running. Trip the breaker and log only once per window
      // instead of once per call, so a batch of N items doesn't produce N errors.
      const unreachable = err instanceof TypeError;
      if (unreachable) {
        VectorService.unavailableUntil = Date.now() + VectorService.COOLDOWN_MS;
        logger.warn(
          `[VectorService] Embedding endpoint unreachable; skipping embeddings for ${VectorService.COOLDOWN_MS / 1000}s. Cause: ${(err as Error).message}`
        );
      } else {
        logger.error('[VectorService] Error generating embedding:', err);
      }
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
