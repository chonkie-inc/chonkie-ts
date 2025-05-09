/** Slumber chunker client for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface SlumberChunkerConfig {
  tokenizerOrTokenCounter?: string;
  chunkSize?: number;
  candidateSize?: number;
  minCharactersPerChunk?: number;
  returnType?: "texts" | "chunks";
}

export class SlumberChunker extends CloudClient {
  private readonly config: Required<SlumberChunkerConfig>;

  constructor(apiKey: string, config: SlumberChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      tokenizerOrTokenCounter: config.tokenizerOrTokenCounter || "gpt2",
      chunkSize: config.chunkSize || 1024,
      candidateSize: config.candidateSize || 32,
      minCharactersPerChunk: config.minCharactersPerChunk || 12,
      returnType: config.returnType || "chunks",
    };
  }

  async chunk(text: string): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("tokenizer_or_token_counter", this.config.tokenizerOrTokenCounter);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("candidate_size", this.config.candidateSize.toString());
    formData.append("min_characters_per_chunk", this.config.minCharactersPerChunk.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/slumber", {
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