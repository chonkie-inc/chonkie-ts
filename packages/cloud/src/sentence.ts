/**
 * Sentence chunker that splits text into sentence-based chunks
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudBaseChunker, ChunkerInput } from '@/base';
import * as fs from 'fs';
import * as path from 'path';

export interface SentenceChunkerOptions {
  /** Tokenizer to use (default: "gpt2") */
  tokenizer?: string;
  /** Maximum tokens per chunk (default: 512) */
  chunkSize?: number;
  /** Number of tokens to overlap between chunks (default: 0) */
  chunkOverlap?: number;
  /** Minimum sentences per chunk (default: 1) */
  minSentencesPerChunk?: number;
  /** Minimum characters per sentence (default: 12) */
  minCharactersPerSentence?: number;
  /** Use approximate token counting (default: false) */
  approximate?: boolean;
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

export class SentenceChunker extends CloudBaseChunker {
  private readonly config: {
    tokenizer: string;
    chunkSize: number;
    chunkOverlap: number;
    minSentencesPerChunk: number;
    minCharactersPerSentence: number;
    approximate: boolean;
    delim: string | string[];
    includeDelim: 'prev' | 'next' | null;
  };

  constructor(options: SentenceChunkerOptions = {}) {
    const apiKey = options.apiKey || process.env.CHONKIE_API_KEY;
    if (!apiKey) {
      throw new Error('API key is required. Provide it in options.apiKey or set CHONKIE_API_KEY environment variable.');
    }

    super({ apiKey, baseUrl: options.baseUrl });

    this.config = {
      tokenizer: options.tokenizer || 'gpt2',
      chunkSize: options.chunkSize || 512,
      chunkOverlap: options.chunkOverlap || 0,
      minSentencesPerChunk: options.minSentencesPerChunk || 1,
      minCharactersPerSentence: options.minCharactersPerSentence || 12,
      approximate: options.approximate ?? false,
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
      formData.append('tokenizer_or_token_counter', this.config.tokenizer);
      formData.append('chunk_size', this.config.chunkSize.toString());
      formData.append('chunk_overlap', this.config.chunkOverlap.toString());
      formData.append('min_sentences_per_chunk', this.config.minSentencesPerChunk.toString());
      formData.append('min_characters_per_sentence', this.config.minCharactersPerSentence.toString());
      formData.append('approximate', this.config.approximate.toString());
      formData.append('delim', JSON.stringify(this.config.delim));
      formData.append('include_delim', this.config.includeDelim || 'prev');
      formData.append('return_type', 'chunks');

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/sentence', {
        method: 'POST',
        body: formData,
      });
    } else if (input.text) {
      const payload = {
        text: input.text,
        tokenizer_or_token_counter: this.config.tokenizer,
        chunk_size: this.config.chunkSize,
        chunk_overlap: this.config.chunkOverlap,
        min_sentences_per_chunk: this.config.minSentencesPerChunk,
        min_characters_per_sentence: this.config.minCharactersPerSentence,
        approximate: this.config.approximate,
        delim: this.config.delim,
        include_delim: this.config.includeDelim,
        return_type: 'chunks',
      };

      data = await this.request<ApiChunkResponse[]>('/v1/chunk/sentence', {
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
    return `SentenceChunker(tokenizer=${this.config.tokenizer}, chunkSize=${this.config.chunkSize})`;
  }
}
