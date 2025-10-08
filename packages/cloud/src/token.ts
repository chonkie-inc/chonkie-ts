/**
 * Token chunker that splits text into fixed-size token chunks
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudClient, ChunkerInput } from '@/base';
import * as fs from 'fs';
import * as path from 'path';

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

export class TokenChunker extends CloudClient {
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
    let data: ApiChunkResponse[];

    if (input.filepath) {
      // Use FormData for file uploads
      const formData = new FormData();
      const fileContent = fs.readFileSync(input.filepath);
      const fileName = path.basename(input.filepath) || 'file.txt';
      const blob = new Blob([fileContent]);
      formData.append('file', blob, fileName);
      formData.append('tokenizer_or_token_counter', this.config.tokenizer);
      formData.append('chunk_size', this.config.chunkSize.toString());
      formData.append('chunk_overlap', this.config.chunkOverlap.toString());
      formData.append('return_type', 'chunks');

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/token', {
        method: 'POST',
        body: formData,
      });
    } else if (input.text) {
      // Use JSON payload for text input
      const payload = {
        text: input.text,
        tokenizer_or_token_counter: this.config.tokenizer,
        chunk_size: this.config.chunkSize,
        chunk_overlap: this.config.chunkOverlap,
        return_type: 'chunks',
      };

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/token', {
        method: 'POST',
        body: payload,
      });
    } else {
      throw new Error('Either text or filepath must be provided');
    }

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
