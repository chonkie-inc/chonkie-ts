/**
 * Embeddings refinery that adds embeddings to existing chunks
 * via api.chonkie.ai
 */

import { Chunk } from "@chonkiejs/core";
import { CloudBaseChunker } from "@/base";

// TODO(bhavnick): Add a default embeddding model to the embeddings refinery.
export interface EmbeddingsRefineryOptions {
  /** Embedding model to use (required) */
  embeddingModel: string;
  /** API key (reads from CHONKIE_API_KEY env var if not provided) */
  apiKey?: string;
  /** Base URL for API (default: "https://api.chonkie.ai") */
  baseUrl?: string;
}

interface ChunkData {
  text: string;
  start_index: number;
  end_index: number;
  token_count: number;
  embedding?: number[];
}

/**
 * Post-processes chunks by adding embeddings to them.
 */
export class EmbeddingsRefinery extends CloudBaseChunker {
  private readonly embeddingModel: string;

  constructor(options: EmbeddingsRefineryOptions) {
    if (!options.embeddingModel) {
      throw new Error("Embedding model is required for embeddings refinement");
    }

    const apiKey = options.apiKey || process.env.CHONKIE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "API key is required. Provide it in options.apiKey or set CHONKIE_API_KEY environment variable."
      );
    }

    super({ apiKey, baseUrl: options.baseUrl });
    this.embeddingModel = options.embeddingModel;
  }

  /**
   * Add embeddings to existing chunks.
   *
   * @param chunks - Array of chunks to add embeddings to
   * @returns Array of chunks with embeddings added
   */
  async refine(chunks: Chunk[]): Promise<Chunk[]> {
    const chunkData = chunks.map((chunk) => ({
      text: chunk.text,
      start_index: chunk.startIndex,
      end_index: chunk.endIndex,
      token_count: chunk.tokenCount,
    }));

    const response = await this.request<ChunkData[]>("/v1/refine/embeddings", {
      method: "POST",
      body: {
        chunks: chunkData,
        embedding_model: this.embeddingModel,
      },
    });

    return response.map(
      (chunkData) =>
        new Chunk({
          text: chunkData.text,
          startIndex: chunkData.start_index,
          endIndex: chunkData.end_index,
          tokenCount: chunkData.token_count,
        })
    );
  }

  toString(): string {
    return `EmbeddingsRefinery(embeddingModel=${this.embeddingModel})`;
  }
}
