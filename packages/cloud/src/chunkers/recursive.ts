/**
 * Recursive chunker that uses hierarchical rules for chunking
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudBaseChunker, ChunkerInput } from '@/base';
import * as fs from 'fs';
import * as path from 'path';

export interface RecursiveChunkerOptions {
  /** Tokenizer to use (default: "gpt2") */
  tokenizer?: string;
  /** Maximum tokens per chunk (default: 512) */
  chunkSize?: number;
  /** Recipe name (default: "default") */
  recipe?: string;
  /** Language for recipe (default: "en") */
  lang?: string;
  /** Minimum characters per chunk (default: 12) */
  minCharactersPerChunk?: number;
  /** API key (reads from CHONKIE_API_KEY env var if not provided) */
  apiKey?: string;
  /** Base URL for API (default: "https://api.chonkie.ai") */
  baseUrl?: string;
}

interface ApiChunkResponse {
  text: string;
  start_index: number;
  end_index: number;
  token_count: number;
}

export class RecursiveChunker extends CloudBaseChunker {
  private readonly config: {
    tokenizer: string;
    chunkSize: number;
    recipe: string;
    lang: string;
    minCharactersPerChunk: number;
  };

  constructor(options: RecursiveChunkerOptions = {}) {
    const apiKey = options.apiKey || process.env.CHONKIE_API_KEY;
    if (!apiKey) {
      throw new Error('API key is required. Provide it in options.apiKey or set CHONKIE_API_KEY environment variable.');
    }

    super({ apiKey, baseUrl: options.baseUrl });

    this.config = {
      tokenizer: options.tokenizer || 'gpt2',
      chunkSize: options.chunkSize || 512,
      recipe: options.recipe || 'default',
      lang: options.lang || 'en',
      minCharactersPerChunk: options.minCharactersPerChunk || 12,
    };
  }

  async chunk(input: ChunkerInput): Promise<Chunk[]> {
    let data: ApiChunkResponse[];

    if (input.filepath) {
      const formData = new FormData();
      const fileContent = fs.readFileSync(input.filepath);
      const fileName = path.basename(input.filepath) || 'file.txt';
      const blob = new Blob([fileContent]);
      formData.append('file', blob, fileName);
      formData.append('tokenizer_or_token_counter', this.config.tokenizer);
      formData.append('chunk_size', this.config.chunkSize.toString());
      formData.append('recipe', this.config.recipe);
      formData.append('lang', this.config.lang);
      formData.append('min_characters_per_chunk', this.config.minCharactersPerChunk.toString());
      formData.append('return_type', 'chunks');

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/recursive', {
        method: 'POST',
        body: formData,
      });
    } else if (input.text) {
      const payload = {
        text: input.text,
        tokenizer_or_token_counter: this.config.tokenizer,
        chunk_size: this.config.chunkSize,
        recipe: this.config.recipe,
        lang: this.config.lang,
        min_characters_per_chunk: this.config.minCharactersPerChunk,
        return_type: 'chunks',
      };

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/recursive', {
        method: 'POST',
        body: payload,
      });
    } else {
      throw new Error('Either text or filepath must be provided');
    }

    return data.map(chunk => new Chunk({
      text: chunk.text,
      startIndex: chunk.start_index,
      endIndex: chunk.end_index,
      tokenCount: chunk.token_count,
    }));
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<Chunk[][]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }

  toString(): string {
    return `RecursiveChunker(tokenizer=${this.config.tokenizer}, chunkSize=${this.config.chunkSize}, recipe=${this.config.recipe})`;
  }
}
