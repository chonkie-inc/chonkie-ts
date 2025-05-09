/** Token chunker client for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface TokenChunkerConfig {
  tokenizer?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  returnType?: "texts" | "chunks";
}

export class TokenChunker extends CloudClient {
  private readonly config: Required<TokenChunkerConfig>;

  constructor(apiKey: string, config: TokenChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      tokenizer: config.tokenizer || "gpt2",
      chunkSize: config.chunkSize || 512,
      chunkOverlap: config.chunkOverlap || 0,
      returnType: config.returnType || "chunks",
    };
  }

  async chunk(text: string): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("tokenizer_or_token_counter", this.config.tokenizer);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("chunk_overlap", this.config.chunkOverlap.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/token", {
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