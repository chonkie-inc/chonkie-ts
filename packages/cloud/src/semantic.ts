/**
 * Semantic chunker that uses embeddings to create semantically coherent chunks
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudClient, ChunkerInput } from '@/base';
import * as fs from 'fs';
import * as path from 'path';

export interface SemanticChunkerOptions {
  /** Embedding model to use (default: "minishlab/potion-base-8M") */
  embeddingModel?: string;
  /** Similarity threshold for chunking (default: 0.5) */
  threshold?: number;
  /** Maximum tokens per chunk (default: 512) */
  chunkSize?: number;
  /** Window size for similarity comparison (default: 1) */
  similarityWindow?: number;
  /** Minimum sentences per chunk (default: 1) */
  minSentences?: number;
  /** Minimum chunk size (default: 2) */
  minChunkSize?: number;
  /** Minimum characters per sentence (default: 12) */
  minCharactersPerSentence?: number;
  /** Step size for threshold adjustment (default: 0.01) */
  thresholdStep?: number;
  /** Sentence delimiters (default: [".", "!", "?", "\n"]) */
  delim?: string | string[];
  /** Where to include delimiter (default: "prev") */
  includeDelim?: 'prev' | 'next' | null;
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

export class SemanticChunker extends CloudClient {
  private readonly config: {
    embeddingModel: string;
    threshold: number;
    chunkSize: number;
    similarityWindow: number;
    minSentences: number;
    minChunkSize: number;
    minCharactersPerSentence: number;
    thresholdStep: number;
    delim: string | string[];
    includeDelim: 'prev' | 'next' | null;
  };

  constructor(options: SemanticChunkerOptions = {}) {
    const apiKey = options.apiKey || process.env.CHONKIE_API_KEY;
    if (!apiKey) {
      throw new Error('API key is required. Provide it in options.apiKey or set CHONKIE_API_KEY environment variable.');
    }

    super({ apiKey, baseUrl: options.baseUrl });

    this.config = {
      embeddingModel: options.embeddingModel || 'minishlab/potion-base-8M',
      threshold: options.threshold ?? 0.5,
      chunkSize: options.chunkSize || 512,
      similarityWindow: options.similarityWindow || 1,
      minSentences: options.minSentences || 1,
      minChunkSize: options.minChunkSize || 2,
      minCharactersPerSentence: options.minCharactersPerSentence || 12,
      thresholdStep: options.thresholdStep || 0.01,
      delim: options.delim || ['.', '!', '?', '\n'],
      includeDelim: options.includeDelim ?? 'prev',
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
      formData.append('embedding_model', this.config.embeddingModel);
      formData.append('threshold', this.config.threshold.toString());
      formData.append('chunk_size', this.config.chunkSize.toString());
      formData.append('similarity_window', this.config.similarityWindow.toString());
      formData.append('min_sentences', this.config.minSentences.toString());
      formData.append('min_chunk_size', this.config.minChunkSize.toString());
      formData.append('min_characters_per_sentence', this.config.minCharactersPerSentence.toString());
      formData.append('threshold_step', this.config.thresholdStep.toString());
      formData.append('delim', JSON.stringify(this.config.delim));
      formData.append('include_delim', this.config.includeDelim || 'prev');
      formData.append('return_type', 'chunks');

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/semantic', {
        method: 'POST',
        body: formData,
      });
    } else if (input.text) {
      const payload = {
        text: input.text,
        embedding_model: this.config.embeddingModel,
        threshold: this.config.threshold,
        chunk_size: this.config.chunkSize,
        similarity_window: this.config.similarityWindow,
        min_sentences: this.config.minSentences,
        min_chunk_size: this.config.minChunkSize,
        min_characters_per_sentence: this.config.minCharactersPerSentence,
        threshold_step: this.config.thresholdStep,
        delim: this.config.delim,
        include_delim: this.config.includeDelim,
        return_type: 'chunks',
      };

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/semantic', {
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
    return `SemanticChunker(embeddingModel=${this.config.embeddingModel}, threshold=${this.config.threshold})`;
  }
}
