/** Late chunker client for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface LateChunkerConfig {
  embeddingModel?: string;
  chunkSize?: number;
  recipe?: string;
  lang?: string;
  minCharactersPerChunk?: number;
}

export class LateChunker extends CloudClient {
  private readonly config: Required<LateChunkerConfig>;

  constructor(apiKey: string, config: LateChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      embeddingModel: config.embeddingModel || "all-MiniLM-L6-v2",
      chunkSize: config.chunkSize || 512,
      recipe: config.recipe || "default",
      lang: config.lang || "en",
      minCharactersPerChunk: config.minCharactersPerChunk || 24,
    };
  }

  async chunk(text: string): Promise<Chunk[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("embedding_model", this.config.embeddingModel);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("recipe", this.config.recipe);
    formData.append("lang", this.config.lang);
    formData.append("min_characters_per_chunk", this.config.minCharactersPerChunk.toString());

    const data = await this.request<any>("/v1/chunk/late", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    return data.map((chunk: any) => Chunk.fromDict(chunk));
  }

  async chunkBatch(texts: string[]): Promise<Chunk[][]> {
    return Promise.all(texts.map(text => this.chunk(text)));
  }
} 