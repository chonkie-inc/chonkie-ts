/** Recursive chunker client for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface RecursiveChunkerConfig {
  tokenizerOrTokenCounter?: string;
  chunkSize?: number;
  recipe?: string;
  lang?: string;
  minCharactersPerChunk?: number;
  returnType?: "texts" | "chunks";
  overlap?: number;
}

export class RecursiveChunker extends CloudClient {
  private readonly config: Required<RecursiveChunkerConfig>;

  constructor(apiKey: string, config: RecursiveChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      tokenizerOrTokenCounter: config.tokenizerOrTokenCounter || "gpt2",
      chunkSize: config.chunkSize || 512,
      recipe: config.recipe || "default",
      lang: config.lang || "en",
      minCharactersPerChunk: config.minCharactersPerChunk || 12,
      returnType: config.returnType || "chunks",
      overlap: config.overlap || 0,
    };
  }

  async chunk(text: string): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("overlap", this.config.overlap.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/recursive", {
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