/** Refinery clients for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface EmbeddingsRefineryConfig {
  embeddingModel: string;
  chunkSize?: number;
  similarityThreshold?: number;
  minSentences?: number;
  minCharactersPerSentence?: number;
  returnType?: "chunks" | "strings";
}

export interface OverlapRefineryConfig {
  tokenizerOrTokenCounter?: string;
  contextSize?: number;
  mode?: "token" | "recursive";
  method?: "suffix" | "prefix";
  rules?: Record<string, any>;
  merge?: boolean;
}

export class EmbeddingsRefinery extends CloudClient {
  private readonly config: Required<EmbeddingsRefineryConfig>;

  constructor(apiKey: string, config: EmbeddingsRefineryConfig) {
    super({ apiKey });
    if (!config.embeddingModel) {
      throw new Error("Embedding model is required for embeddings refinement");
    }
    this.config = {
      embeddingModel: config.embeddingModel,
      chunkSize: config.chunkSize ?? 1000,
      similarityThreshold: config.similarityThreshold ?? 0.8,
      minSentences: config.minSentences ?? 1,
      minCharactersPerSentence: config.minCharactersPerSentence ?? 10,
      returnType: config.returnType ?? "chunks",
    };
  }

  async refine(chunks: Chunk[]): Promise<Chunk[]> {
    const response = await this.request<Chunk[]>("/v1/refine/embeddings", {
      body: {
        chunks: chunks.map(chunk => chunk.toDict()),
        embedding_model: this.config.embeddingModel,
      },
    });

    return response.map(chunk => Chunk.fromDict(chunk));
  }

  async chunk(text: string): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("embedding_model", this.config.embeddingModel);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("similarity_threshold", this.config.similarityThreshold.toString());
    formData.append("min_sentences", this.config.minSentences.toString());
    formData.append("min_characters_per_sentence", this.config.minCharactersPerSentence.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/refinery", {
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
}

export class OverlapRefinery extends CloudClient {
  private readonly config: Required<OverlapRefineryConfig>;

  constructor(apiKey: string, config: OverlapRefineryConfig = {}) {
    super({ apiKey });
    this.config = {
      tokenizerOrTokenCounter: config.tokenizerOrTokenCounter || "character",
      contextSize: config.contextSize ?? 0.25,
      mode: config.mode || "token",
      method: config.method || "suffix",
      rules: config.rules || {},
      merge: config.merge ?? true,
    };
  }

  async refine(chunks: Chunk[]): Promise<Chunk[]> {
    const response = await this.request<Chunk[]>("/v1/refine/overlap", {
      body: {
        chunks: chunks.map(chunk => chunk.toDict()),
        tokenizer_or_token_counter: this.config.tokenizerOrTokenCounter,
        context_size: this.config.contextSize,
        mode: this.config.mode,
        method: this.config.method,
        rules: this.config.rules,
        merge: this.config.merge,
      },
    });

    return response.map(chunk => Chunk.fromDict(chunk));
  }
} 