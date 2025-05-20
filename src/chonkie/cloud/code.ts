/** Code chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { CodeChunk } from "../types/code";
import * as fs from 'fs';
import * as path from 'path';

export interface CodeChunkerConfig {
  tokenizerOrTokenCounter?: string;
  chunkSize?: number;
  language: string;
  includeNodes?: boolean;
}

export class CodeChunker extends CloudClient {
  private readonly config: Required<CodeChunkerConfig>;

  constructor(apiKey: string, config: CodeChunkerConfig) {
    super({ apiKey });
    if (!config.language) {
      throw new Error("Language is required for code chunking");
    }
    this.config = {
      tokenizerOrTokenCounter: config.tokenizerOrTokenCounter || "gpt2",
      chunkSize: config.chunkSize || 1500,
      language: config.language,
      includeNodes: config.includeNodes ?? false,
    };
  }

  async chunk(input: ChunkerInput): Promise<CodeChunk[]> {
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
    formData.append("language", this.config.language);
    formData.append("include_nodes", this.config.includeNodes.toString());

    const data = await this.request<any>("/v1/chunk/code", {
      method: "POST",
      body: formData,
    });

    return data.map((chunk: any) => CodeChunk.fromDict(chunk));
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<CodeChunk[][]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
} 