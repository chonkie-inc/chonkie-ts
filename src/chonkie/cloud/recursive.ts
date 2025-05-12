/** Recursive chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { Chunk } from "../types/base";
import * as fs from 'fs';
import * as path from 'path';

export interface RecursiveChunkerConfig {
  tokenizerOrTokenCounter?: string;
  chunkSize?: number;
  recipe?: string;
  lang?: string;
  minCharactersPerChunk?: number;
  returnType?: "texts" | "chunks";
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
      returnType: config.returnType || "chunks",
      overlap: config.overlap || 0,
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

    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("overlap", this.config.overlap.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/recursive", {
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