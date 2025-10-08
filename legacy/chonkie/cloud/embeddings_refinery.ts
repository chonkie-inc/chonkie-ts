/** Refinery clients for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface EmbeddingsRefineryConfig {
  embeddingModel: string;
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
    };
  }

  async refine(chunks: Chunk[]): Promise<Chunk[]> {
    const response = await this.request<Chunk[]>("/v1/refine/embeddings", {
      body: {
        chunks: chunks.map(chunk => chunk.toDict()),
        embedding_model: this.config.embeddingModel,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.map(chunk => Chunk.fromDict(chunk));
  }
}