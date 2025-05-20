/** Recursive chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { RecursiveChunk } from "../types/recursive";
import * as fs from 'fs';
import * as path from 'path';

export interface RecursiveChunkerConfig {
  tokenizerOrTokenCounter?: string;
  chunkSize?: number;
  recipe?: string;
  lang?: string;
  minCharactersPerChunk?: number;
  overlap?: number;
}

export class RecursiveChunker extends CloudClient {
  private readonly config: Required<RecursiveChunkerConfig>;

  constructor(apiKey: string, config: RecursiveChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      tokenizerOrTokenCounter: config.tokenizerOrTokenCounter || "gpt2",
      chunkSize: config.chunkSize || 512,
      recipe: config.recipe || "default",
      lang: config.lang || "en",
      minCharactersPerChunk: config.minCharactersPerChunk || 12,
      overlap: config.overlap || 0,
    };
  }

  async chunk(input: ChunkerInput): Promise<RecursiveChunk[] | string[]> {
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

    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("overlap", this.config.overlap.toString());

    const data = await this.request<any>("/v1/chunk/recursive", {
      method: "POST",
      body: formData,
    });

    return data.map((chunk: any) => RecursiveChunk.fromDict(chunk));
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<(RecursiveChunk[] | string[])[]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
} 