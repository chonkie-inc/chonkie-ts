/** Semantic chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { Chunk } from "../types/base";
import * as fs from 'fs';
import * as path from 'path';

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

  async chunk(input: ChunkerInput): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    
    if (input.filepath) {
      const fileContent = fs.readFileSync(input.filepath);
      const fileName = path.basename(input.filepath) || 'file.txt';
      formData.append("file", new Blob([fileContent]), fileName);
    } else if (input.text) {
      formData.append("text", input.text);
      // Append empty file to ensure multipart form
      formData.append("file", new Blob(), "text_input.txt");
    } else {
      throw new Error("Either text or filepath must be provided");
    }

    formData.append("embedding_model", this.config.embeddingModel);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("similarity_threshold", this.config.threshold.toString());
    formData.append("min_sentences", this.config.minSentences.toString());
    formData.append("min_characters_per_sentence", this.config.minCharactersPerSentence.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/semantic", {
      method: "POST",
      body: formData,
    });

    return this.config.returnType === "chunks" 
      ? data.map((chunk: any) => Chunk.fromDict(chunk))
      : data;
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<(Chunk[] | string[])[]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
} 