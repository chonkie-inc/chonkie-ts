/**
 * Sentence chunker that splits text into sentence-based chunks
 * via api.chonkie.ai
 */

import { Chunk } from '@chonkiejs/core';
import { CloudBaseChunker, ChunkerInput } from '@/base';

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

interface SentenceChunkPayload extends Record<string, unknown> {
  text?: string;
  file?: { type: string; content: string };
  tokenizer_or_token_counter: string;
  chunk_size: number;
  chunk_overlap: number;
  min_sentences_per_chunk: number;
  min_characters_per_sentence: number;
  approximate: boolean;
  delim: string | string[];
  include_delim: string;
  return_type: string;
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
    let fileRef = input.file;

    // If filepath is provided, upload it first to get a file reference
    if (input.filepath) {
      fileRef = await this.uploadFile(input.filepath);
    }

    // Build the payload
    const payload: SentenceChunkPayload = {
      tokenizer_or_token_counter: this.config.tokenizer,
      chunk_size: this.config.chunkSize,
      chunk_overlap: this.config.chunkOverlap,
      min_sentences_per_chunk: this.config.minSentencesPerChunk,
      min_characters_per_sentence: this.config.minCharactersPerSentence,
      approximate: this.config.approximate,
      delim: this.config.delim,
      include_delim: this.config.includeDelim || 'prev',
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

    const data = await this.request<ApiChunkResponse[]>('/v1/chunk/sentence', {
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
    return `SentenceChunker(tokenizer=${this.config.tokenizer}, chunkSize=${this.config.chunkSize})`;
  }
}
