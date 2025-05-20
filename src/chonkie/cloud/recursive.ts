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
  returnType?: "texts" | "chunks";
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
    };
  }

  async chunk(input: ChunkerInput): Promise<RecursiveChunk[] | string[]> {
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
    formData.append("tokenizer_or_token_counter", this.config.tokenizerOrTokenCounter);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("recipe", this.config.recipe);
    formData.append("lang", this.config.lang);
    formData.append("min_characters_per_chunk", this.config.minCharactersPerChunk.toString());
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/recursive", {
      method: "POST",
      body: formData,
    });

    return this.config.returnType === "chunks" 
      ? data.map((chunk: any) => RecursiveChunk.fromDict(chunk))
      : data;
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<(RecursiveChunk[] | string[])[]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
} 