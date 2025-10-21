/**
 * Late chunker that uses recursive chunking with embeddings
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudBaseChunker, ChunkerInput } from '@/base';

export interface LateChunkerOptions {
  /** Embedding model to use (default: "all-MiniLM-L6-v2") */
  embeddingModel?: string;
  /** Maximum tokens per chunk (default: 512) */
  chunkSize?: number;
  /** Recipe name (default: "default") */
  recipe?: string;
  /** Language for recipe (default: "en") */
  lang?: string;
  /** Minimum characters per chunk (default: 24) */
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
  embedding?: number[];
}

interface LateChunkPayload extends Record<string, unknown> {
  text?: string;
  file?: { type: string; content: string };
  embedding_model: string;
  chunk_size: number;
  recipe: string;
  lang: string;
  min_characters_per_chunk: number;
}

export class LateChunker extends CloudBaseChunker {
  private readonly config: {
    embeddingModel: string;
    chunkSize: number;
    recipe: string;
    lang: string;
    minCharactersPerChunk: number;
  };

  constructor(options: LateChunkerOptions = {}) {
    const apiKey = options.apiKey || process.env.CHONKIE_API_KEY;
    if (!apiKey) {
      throw new Error('API key is required. Provide it in options.apiKey or set CHONKIE_API_KEY environment variable.');
    }

    super({ apiKey, baseUrl: options.baseUrl });

    this.config = {
      embeddingModel: options.embeddingModel || 'all-MiniLM-L6-v2',
      chunkSize: options.chunkSize || 512,
      recipe: options.recipe || 'default',
      lang: options.lang || 'en',
      minCharactersPerChunk: options.minCharactersPerChunk || 24,
    };
  }

  async chunk(input: ChunkerInput): Promise<Chunk[]> {
    let fileRef = input.file;

    // If filepath is provided, upload it first to get a file reference
    if (input.filepath) {
      fileRef = await this.uploadFile(input.filepath);
    }

    // Build the payload
    const payload: LateChunkPayload = {
      embedding_model: this.config.embeddingModel,
      chunk_size: this.config.chunkSize,
      recipe: this.config.recipe,
      lang: this.config.lang,
      min_characters_per_chunk: this.config.minCharactersPerChunk,
    };

    // Add either text or file to the payload
    if (fileRef) {
      payload.file = fileRef;
    } else if (input.text) {
      payload.text = input.text;
    } else {
      throw new Error('Either text, filepath, or file must be provided');
    }

    const data = await this.request<ApiChunkResponse[]>('/v1/chunk/late', {
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
    return `LateChunker(embeddingModel=${this.config.embeddingModel}, chunkSize=${this.config.chunkSize}, recipe=${this.config.recipe})`;
  }
}
