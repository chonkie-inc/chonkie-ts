/** Semantic chunker client for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface SemanticChunkerConfig {
  embeddingModel?: string;
  threshold?: number | "auto";
  chunkSize?: number;
  similarityWindow?: number;
  minSentences?: number;
  minChunkSize?: number;
  minCharactersPerSentence?: number;
  thresholdStep?: number;
  delim?: string | string[];
  includeDelim?: "prev" | "next" | null;
  returnType?: "texts" | "chunks";
}

export class SemanticChunker extends CloudClient {
  private readonly config: Required<SemanticChunkerConfig>;

  constructor(apiKey: string, config: SemanticChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      embeddingModel: config.embeddingModel || "minishlab/potion-base-8M",
      threshold: config.threshold ?? "auto",
      chunkSize: config.chunkSize || 512,
      similarityWindow: config.similarityWindow || 1,
      minSentences: config.minSentences || 1,
      minChunkSize: config.minChunkSize || 2,
      minCharactersPerSentence: config.minCharactersPerSentence || 12,
      thresholdStep: config.thresholdStep || 0.01,
      delim: config.delim || [".", "!", "?", "\n"],
      includeDelim: config.includeDelim ?? "prev",
      returnType: config.returnType || "chunks",
    };
  }

  async chunk(text: string): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("embedding_model", this.config.embeddingModel);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("similarity_threshold", this.config.threshold.toString());
    formData.append("min_sentences", this.config.minSentences.toString());
    formData.append("min_characters_per_sentence", this.config.minCharactersPerSentence.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/semantic", {
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