/** Token chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { Chunk } from "../types/base";
import * as fs from 'fs';
import * as path from 'path';

export interface TokenChunkerConfig {
  tokenizer?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export class TokenChunker extends CloudClient {
  private readonly config: Required<TokenChunkerConfig>;

  constructor(apiKey: string, config: TokenChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      tokenizer: config.tokenizer || "gpt2",
      chunkSize: config.chunkSize || 512,
      chunkOverlap: config.chunkOverlap || 0,
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

    formData.append("tokenizer_or_token_counter", this.config.tokenizer);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("chunk_overlap", this.config.chunkOverlap.toString());
    formData.append("return_type", "chunks");

    const data = await this.request<any>("/v1/chunk/token", {
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
        context: chunk.context || undefined,
      };
    });

    return camelCaseData.map((chunk: any) => Chunk.fromDict(chunk));
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<Chunk[][]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
} 