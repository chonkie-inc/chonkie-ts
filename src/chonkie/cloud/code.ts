/** Code chunker client for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface CodeChunkerConfig {
  tokenizerOrTokenCounter?: string;
  chunkSize?: number;
  language: string;
  includeNodes?: boolean;
  returnType?: "texts" | "chunks";
}

export class CodeChunker extends CloudClient {
  private readonly config: Required<CodeChunkerConfig>;

  constructor(apiKey: string, config: CodeChunkerConfig) {
    super({ apiKey });
    if (!config.language) {
      throw new Error("Language is required for code chunking");
    }
    this.config = {
      tokenizerOrTokenCounter: config.tokenizerOrTokenCounter || "gpt2",
      chunkSize: config.chunkSize || 1500,
      language: config.language,
      includeNodes: config.includeNodes ?? false,
      returnType: config.returnType || "chunks",
    };
  }

  async chunk(text: string): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("tokenizer_or_token_counter", this.config.tokenizerOrTokenCounter);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("language", this.config.language);
    formData.append("include_nodes", this.config.includeNodes.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/code", {
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