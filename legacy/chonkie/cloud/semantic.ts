/** Semantic chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { SemanticChunk } from "../types/semantic";
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
    };
  }

  async chunk(input: ChunkerInput): Promise<SemanticChunk[]> {
    const formData = new FormData();
    
    if (input.filepath) {
      const fileContent = fs.readFileSync(input.filepath);
      const fileName = path.basename(input.filepath) || 'file.txt';
      formData.append("file", new Blob([fileContent]), fileName);
    } else if (input.text) {
      // JSON encode the text
      formData.append("text", JSON.stringify(input.text));
      // Append empty file to ensure multipart form
      formData.append("file", new Blob(), "text_input.txt");
    } else {
      throw new Error("Either text or filepath must be provided");
    }

    // Add all config options to the form data
    formData.append("embedding_model", this.config.embeddingModel);
    formData.append("threshold", this.config.threshold.toString());
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("similarity_window", this.config.similarityWindow.toString());
    formData.append("min_sentences", this.config.minSentences.toString());
    formData.append("min_chunk_size", this.config.minChunkSize.toString());
    formData.append("min_characters_per_sentence", this.config.minCharactersPerSentence.toString());
    formData.append("threshold_step", this.config.thresholdStep.toString());
    formData.append("delim", JSON.stringify(this.config.delim));
    formData.append("include_delim", this.config.includeDelim || "prev");
    formData.append("return_type", "chunks");

    const data = await this.request<any>("/v1/chunk/semantic", {
      method: "POST",
      body: formData,
    });

    // Convert from snake_case to camelCase
    const camelCaseData = data.map((chunk: any) => {
      return {
        text: chunk.text,
        startIndex: chunk.start_index,
        endIndex: chunk.end_index,
        tokenCount: chunk.token_count,
        embedding: chunk.embedding || undefined,
        sentences: chunk.sentences.map((sentence: any) => {
          return {
            text: sentence.text,
            startIndex: sentence.start_index,
            endIndex: sentence.end_index,
            tokenCount: sentence.token_count,
            embedding: sentence.embedding || undefined,
          };
        }),
      };
    });

    return camelCaseData.map((chunk: any) => SemanticChunk.fromDict(chunk));
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<SemanticChunk[][]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
} 