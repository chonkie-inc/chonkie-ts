/** Sentence chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { SentenceChunk } from "../types/sentence";
import * as fs from 'fs';
import * as path from 'path';

export interface SentenceChunkerConfig {
  tokenizerOrTokenCounter?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  minSentencesPerChunk?: number;
  minCharactersPerSentence?: number;
  approximate?: boolean;
  delim?: string | string[];
  includeDelim?: "prev" | "next" | null;
}

export class SentenceChunker extends CloudClient {
  private readonly config: Required<SentenceChunkerConfig>;

  constructor(apiKey: string, config: SentenceChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      tokenizerOrTokenCounter: config.tokenizerOrTokenCounter || "gpt2",
      chunkSize: config.chunkSize || 512,
      chunkOverlap: config.chunkOverlap || 0,
      minSentencesPerChunk: config.minSentencesPerChunk || 1,
      minCharactersPerSentence: config.minCharactersPerSentence || 12,
      approximate: config.approximate ?? false,
      delim: config.delim || [".", "!", "?", "\n"],
      includeDelim: config.includeDelim ?? "prev",
    };
  }

  async chunk(input: ChunkerInput): Promise<SentenceChunk[]> {
    const formData = new FormData();

    if (input.filepath) {
      const fileContent = fs.readFileSync(input.filepath);
      const fileName = path.basename(input.filepath) || 'file.txt';
      formData.append("file", new Blob([fileContent]), fileName);
    } else if (input.text) {
      // JSON encode the text
      formData.append("text", JSON.stringify(input.text));
      // Append empty file to ensure multipart form
      formData.append("file", new Blob(), "text_input.txt");
    } else {
      throw new Error("Either text or filepath must be provided");
    }
    // Append all config options to the form data
    formData.append("tokenizer_or_token_counter", this.config.tokenizerOrTokenCounter);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("chunk_overlap", this.config.chunkOverlap.toString());
    formData.append("min_sentences_per_chunk", this.config.minSentencesPerChunk.toString());
    formData.append("min_characters_per_sentence", this.config.minCharactersPerSentence.toString());
    formData.append("approximate", this.config.approximate.toString());
    formData.append("delim", JSON.stringify(this.config.delim));
    formData.append("include_delim", this.config.includeDelim || "prev");
    formData.append("return_type", "chunks");

    const data = await this.request<any>("/v1/chunk/sentence", {
      method: "POST",
      body: formData,
    });

    // Convert from snake_case to camelCase
    const camelCaseData = data.map((chunk: any) => {
      return {
        text: chunk.text,
        startIndex: chunk.start_index,
        endIndex: chunk.end_index,
        tokenCount: chunk.token_count,
        sentences: chunk.sentences.map((sentence: any) => {
          return {
            text: sentence.text,
            startIndex: sentence.start_index,
            endIndex: sentence.end_index,
            tokenCount: sentence.token_count,
            embedding: sentence.embedding || undefined,
          };
        }),
      };
    });

    return camelCaseData.map((chunk: any) => SentenceChunk.fromDict(chunk));
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<SentenceChunk[][]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
}   