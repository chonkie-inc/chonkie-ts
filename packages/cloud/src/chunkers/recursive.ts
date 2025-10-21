/**
 * Recursive chunker that uses hierarchical rules for chunking
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudBaseChunker, ChunkerInput } from '@/base';

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

interface RecursiveChunkPayload extends Record<string, unknown> {
  text?: string;
  file?: { type: string; content: string };
  tokenizer_or_token_counter: string;
  chunk_size: number;
  recipe: string;
  lang: string;
  min_characters_per_chunk: number;
  return_type: string;
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
    let fileRef = input.file;

    // If filepath is provided, upload it first to get a file reference
    if (input.filepath) {
      fileRef = await this.uploadFile(input.filepath);
    }

    // Build the payload
    const payload: RecursiveChunkPayload = {
      tokenizer_or_token_counter: this.config.tokenizer,
      chunk_size: this.config.chunkSize,
      recipe: this.config.recipe,
      lang: this.config.lang,
      min_characters_per_chunk: this.config.minCharactersPerChunk,
      return_type: 'chunks',
    };

    // Add either text or file to the payload
    if (fileRef) {
      payload.file = fileRef;
    } else if (input.text) {
      payload.text = input.text;
    } else {
      throw new Error('Either text, filepath, or file must be provided');
    }

    const data = await this.request<ApiChunkResponse[]>('/v1/chunk/recursive', {
      method: 'POST',
      body: payload,
    });

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
