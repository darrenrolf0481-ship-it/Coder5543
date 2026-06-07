import { Experience } from './brain/types';
import { ltmStore } from './brain/ltmStore';
import { vectorService } from './brain/vectorService';
import logger from '../utils/logger.js';

export interface IngestionProgress {
  total: number;
  current: number;
  status: 'reading' | 'chunking' | 'embedding' | 'complete' | 'error';
  fileName: string;
}

export class KnowledgeService {
  /**
   * Ingests a raw text file into the brain's LTM using semantic chunking and embedding.
   */
  async ingestFile(
    file: File,
    personalityId: number,
    onProgress?: (progress: IngestionProgress) => void
  ): Promise<void> {
    const fileName = file.name;
    logger.info(`[KnowledgeService] Starting ingestion of ${fileName} for personality ${personalityId}`);
    
    try {
      onProgress?.({ total: 1, current: 0, status: 'reading', fileName });
      const text = await file.text();
      
      onProgress?.({ total: 1, current: 0, status: 'chunking', fileName });
      const chunks = this.chunkText(text, 800); // ~800 chars per chunk
      
      const totalChunks = chunks.length;
      logger.info(`[KnowledgeService] Split ${fileName} into ${totalChunks} chunks`);

      for (let i = 0; i < totalChunks; i++) {
        onProgress?.({ total: totalChunks, current: i + 1, status: 'embedding', fileName });
        
        const content = chunks[i];
        const embedding = await vectorService.getEmbedding(content);
        
        const experience: Experience = {
          id: `kb_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 5)}`,
          intent: content.substring(0, 100), // Use first 100 chars as 'intent' for indexing
          response: content, // Store full chunk as 'response'
          outcome: 'neutral',
          emotionalWeight: 0,
          tags: ['knowledge', `personality_${personalityId}`, `file_${fileName}`],
          timestamp: Date.now(),
          accessCount: 0,
          embedding
        };

        await ltmStore.save(experience);
      }

      onProgress?.({ total: totalChunks, current: totalChunks, status: 'complete', fileName });
      logger.info(`[KnowledgeService] Successfully ingested ${fileName}`);
    } catch (err) {
      logger.error(`[KnowledgeService] Ingestion failed for ${fileName}:`, err);
      onProgress?.({ total: 0, current: 0, status: 'error', fileName });
      throw err;
    }
  }

  /**
   * Simple text chunking by characters, attempting to break at sentences/newlines.
   */
  private chunkText(text: string, size: number): string[] {
    const chunks: string[] = [];
    let current = 0;

    while (current < text.length) {
      let end = Math.min(current + size, text.length);
      
      // Try to find a better breaking point
      if (end < text.length) {
        const lastNewline = text.lastIndexOf('\n', end);
        if (lastNewline > current + size * 0.5) {
          end = lastNewline;
        } else {
          const lastPeriod = text.lastIndexOf('.', end);
          if (lastPeriod > current + size * 0.5) {
            end = lastPeriod + 1;
          }
        }
      }

      const chunk = text.substring(current, end).trim();
      if (chunk) chunks.push(chunk);
      current = end;
    }

    return chunks;
  }
}

export const knowledgeService = new KnowledgeService();
