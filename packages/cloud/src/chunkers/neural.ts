/**
 * Neural chunker that uses neural networks for intelligent chunking
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudBaseChunker, ChunkerInput } from '@/base';

export interface NeuralChunkerOptions {
  /** Model to use (default: "mirth/chonky_modernbert_large_1") */
  model?: string;
  /** Minimum characters per chunk (default: 10) */
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

interface NeuralChunkPayload extends Record<string, unknown> {
  text?: string;
  file?: { type: string; content: string };
  embedding_model: string;
  min_characters_per_chunk: number;
  return_type: string;
}

export class NeuralChunker extends CloudBaseChunker {
  private readonly config: {
    model: string;
    minCharactersPerChunk: number;
  };

  constructor(options: NeuralChunkerOptions = {}) {
    const apiKey = options.apiKey || process.env.CHONKIE_API_KEY;
    if (!apiKey) {
      throw new Error('API key is required. Provide it in options.apiKey or set CHONKIE_API_KEY environment variable.');
    }

    super({ apiKey, baseUrl: options.baseUrl });

    this.config = {
      model: options.model || 'mirth/chonky_modernbert_large_1',
      minCharactersPerChunk: options.minCharactersPerChunk || 10,
    };
  }

  async chunk(input: ChunkerInput): Promise<Chunk[]> {
    let fileRef = input.file;

    // If filepath is provided, upload it first to get a file reference
    if (input.filepath) {
      fileRef = await this.uploadFile(input.filepath);
    }

    // Build the payload
    const payload: NeuralChunkPayload = {
      embedding_model: this.config.model,
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

    const data = await this.request<ApiChunkResponse[]>('/v1/chunk/neural', {
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
    return `NeuralChunker(model=${this.config.model})`;
  }
}
