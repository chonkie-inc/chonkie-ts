/** Slumber chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { Chunk } from "../types/base";
import * as fs from 'fs';
import * as path from 'path';

export interface SlumberChunkerConfig {
  tokenizerOrTokenCounter?: string;
  chunkSize?: number;
  candidateSize?: number;
  minCharactersPerChunk?: number;
}

export class SlumberChunker extends CloudClient {
  private readonly config: Required<SlumberChunkerConfig>;

  constructor(apiKey: string, config: SlumberChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      tokenizerOrTokenCounter: config.tokenizerOrTokenCounter || "gpt2",
      chunkSize: config.chunkSize || 1024,
      candidateSize: config.candidateSize || 32,
      minCharactersPerChunk: config.minCharactersPerChunk || 12,
    };
  }

  async chunk(input: ChunkerInput): Promise<Chunk[]> {
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

    formData.append("tokenizer_or_token_counter", this.config.tokenizerOrTokenCounter);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("candidate_size", this.config.candidateSize.toString());
    formData.append("min_characters_per_chunk", this.config.minCharactersPerChunk.toString());
    formData.append("return_type", "chunks");

    const data = await this.request<any>("/v1/chunk/slumber", {
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
        context: chunk.context || undefined,
      };
    });

    return camelCaseData.map((chunk: any) => Chunk.fromDict(chunk));
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<Chunk[][]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
} 