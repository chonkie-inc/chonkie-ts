/**
 * Overlap refinery that adds context overlap to existing chunks
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudBaseChunker } from '@/base';

export interface OverlapRefineryOptions {
  /** Tokenizer to use (default: "character") */
  tokenizer?: string;
  /** Context size as fraction or token count (default: 0.25) */
  contextSize?: number;
  /** Mode for overlap (default: "token") */
  mode?: 'token' | 'recursive';
  /** Method for adding context (default: "suffix") */
  method?: 'suffix' | 'prefix';
  /** Recipe name for recursive mode (default: "default") */
  recipe?: string;
  /** Language for recipe (default: "en") */
  lang?: string;
  /** Merge overlapping chunks (default: true) */
  merge?: boolean;
  /** API key (reads from CHONKIE_API_KEY env var if not provided) */
  apiKey?: string;
  /** Base URL for API (default: "https://api.chonkie.ai") */
  baseUrl?: string;
}

interface ChunkData {
  text: string;
  start_index: number;
  end_index: number;
  token_count: number;
}

/**
 * Post-processes chunks by adding contextual overlap.
 */
export class OverlapRefinery extends CloudBaseChunker {
  private readonly config: {
    tokenizer: string;
    contextSize: number;
    mode: 'token' | 'recursive';
    method: 'suffix' | 'prefix';
    recipe: string;
    lang: string;
    merge: boolean;
  };

  constructor(options: OverlapRefineryOptions = {}) {
    const apiKey = options.apiKey || process.env.CHONKIE_API_KEY;
    if (!apiKey) {
      throw new Error('API key is required. Provide it in options.apiKey or set CHONKIE_API_KEY environment variable.');
    }

    super({ apiKey, baseUrl: options.baseUrl });

    this.config = {
      tokenizer: options.tokenizer || 'character',
      contextSize: options.contextSize ?? 0.25,
      mode: options.mode || 'token',
      method: options.method || 'suffix',
      recipe: options.recipe || 'default',
      lang: options.lang || 'en',
      merge: options.merge ?? true,
    };
  }

  /**
   * Add overlap context to existing chunks.
   *
   * @param chunks - Array of chunks to add overlap to
   * @returns Array of chunks with overlap added
   */
  async refine(chunks: Chunk[]): Promise<Chunk[]> {
    const chunkData = chunks.map(chunk => ({
      text: chunk.text,
      start_index: chunk.startIndex,
      end_index: chunk.endIndex,
      token_count: chunk.tokenCount,
    }));

    const response = await this.request<ChunkData[]>('/v1/refine/overlap', {
      method: 'POST',
      body: {
        chunks: chunkData,
        tokenizer_or_token_counter: this.config.tokenizer,
        context_size: this.config.contextSize,
        mode: this.config.mode,
        method: this.config.method,
        recipe: this.config.recipe,
        lang: this.config.lang,
        merge: this.config.merge,
      },
    });

    return response.map(chunk => new Chunk({
      text: chunk.text,
      startIndex: chunk.start_index,
      endIndex: chunk.end_index,
      tokenCount: chunk.token_count,
    }));
  }

  toString(): string {
    return `OverlapRefinery(mode=${this.config.mode}, contextSize=${this.config.contextSize})`;
  }
}
