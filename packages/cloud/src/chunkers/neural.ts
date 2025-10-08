/**
 * Neural chunker that uses neural networks for intelligent chunking
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudBaseChunker, ChunkerInput } from '@/base';
import * as fs from 'fs';
import * as path from 'path';

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
    let data: ApiChunkResponse[];

    if (input.filepath) {
      const formData = new FormData();
      const fileContent = fs.readFileSync(input.filepath);
      const fileName = path.basename(input.filepath) || 'file.txt';
      const blob = new Blob([fileContent]);
      formData.append('file', blob, fileName);
      formData.append('embedding_model', this.config.model);
      formData.append('min_characters_per_chunk', this.config.minCharactersPerChunk.toString());
      formData.append('return_type', 'chunks');

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/neural', {
        method: 'POST',
        body: formData,
      });
    } else if (input.text) {
      const payload = {
        text: input.text,
        embedding_model: this.config.model,
        min_characters_per_chunk: this.config.minCharactersPerChunk,
        return_type: 'chunks',
      };

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/neural', {
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
    return `NeuralChunker(model=${this.config.model})`;
  }
}
