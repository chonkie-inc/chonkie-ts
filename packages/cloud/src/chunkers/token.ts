/**
 * Token chunker that splits text into fixed-size token chunks
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudBaseChunker, ChunkerInput } from '@/base';

export interface TokenChunkerOptions {
  /** Tokenizer to use (default: "gpt2") */
  tokenizer?: string;
  /** Maximum tokens per chunk (default: 512) */
  chunkSize?: number;
  /** Number of tokens to overlap between chunks (default: 0) */
  chunkOverlap?: number;
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

interface TokenChunkPayload extends Record<string, unknown> {
  text?: string;
  file?: { type: string; content: string };
  tokenizer_or_token_counter: string;
  chunk_size: number;
  chunk_overlap: number;
  return_type: string;
}

export class TokenChunker extends CloudBaseChunker {
  private readonly config: {
    tokenizer: string;
    chunkSize: number;
    chunkOverlap: number;
  };

  constructor(options: TokenChunkerOptions = {}) {
    const apiKey = options.apiKey || process.env.CHONKIE_API_KEY;
    if (!apiKey) {
      throw new Error('API key is required. Provide it in options.apiKey or set CHONKIE_API_KEY environment variable.');
    }

    super({ apiKey, baseUrl: options.baseUrl });

    this.config = {
      tokenizer: options.tokenizer || 'gpt2',
      chunkSize: options.chunkSize || 512,
      chunkOverlap: options.chunkOverlap || 0,
    };
  }

  async chunk(input: ChunkerInput): Promise<Chunk[]> {
    let fileRef = input.file;

    // If filepath is provided, upload it first to get a file reference
    if (input.filepath) {
      fileRef = await this.uploadFile(input.filepath);
    }

    // Build the payload
    const payload: TokenChunkPayload = {
      tokenizer_or_token_counter: this.config.tokenizer,
      chunk_size: this.config.chunkSize,
      chunk_overlap: this.config.chunkOverlap,
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

    const data = await this.request<ApiChunkResponse[]>('/v1/chunk/token', {
      method: 'POST',
      body: payload,
    });

    // Convert API response to Chunk objects
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
    return `TokenChunker(tokenizer=${this.config.tokenizer}, chunkSize=${this.config.chunkSize}, overlap=${this.config.chunkOverlap})`;
  }
}
