/** Neural chunker client for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface NeuralChunkerConfig {
  model?: string;
  minCharactersPerChunk?: number;
  returnType?: "texts" | "chunks";
}

export class NeuralChunker extends CloudClient {
  private readonly config: Required<NeuralChunkerConfig>;

  constructor(apiKey: string, config: NeuralChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      model: config.model || "mirth/chonky_modernbert_large_1",
      minCharactersPerChunk: config.minCharactersPerChunk || 10,
      returnType: config.returnType || "chunks",
    };
  }

  async chunk(text: string): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("embedding_model", this.config.model);
    formData.append("chunk_size", this.config.minCharactersPerChunk.toString());
    formData.append("similarity_threshold", "0.7");
    formData.append("min_sentences", "1");
    formData.append("min_characters_per_sentence", "10");
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/neural", {
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