/** Sentence chunker client for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface SentenceChunkerConfig {
  tokenizerOrTokenCounter?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  minSentencesPerChunk?: number;
  minCharactersPerSentence?: number;
  approximate?: boolean;
  delim?: string | string[];
  includeDelim?: "prev" | "next" | null;
  returnType?: "texts" | "chunks";
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
      returnType: config.returnType || "chunks",
    };
  }

  async chunk(text: string): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("min_sentences", this.config.minSentencesPerChunk.toString());
    formData.append("min_characters_per_sentence", this.config.minCharactersPerSentence.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/sentence", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    return this.config.returnType === "chunks" 
      ? data.map((chunk: any) => Chunk.fromDict(chunk))
      : data;
  }

  async chunkBatch(texts: string[]): Promise<(Chunk[] | string[])[]> {
    return Promise.all(texts.map(text => this.chunk(text)));
  }
} 