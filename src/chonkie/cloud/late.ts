/** Late chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { Chunk } from "../types/base";
import * as fs from 'fs';
import * as path from 'path';

export interface LateChunkerConfig {
  embeddingModel?: string;
  chunkSize?: number;
  recipe?: string;
  lang?: string;
  minCharactersPerChunk?: number;
}

export class LateChunker extends CloudClient {
  private readonly config: Required<LateChunkerConfig>;

  constructor(apiKey: string, config: LateChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      embeddingModel: config.embeddingModel || "all-MiniLM-L6-v2",
      chunkSize: config.chunkSize || 512,
      recipe: config.recipe || "default",
      lang: config.lang || "en",
      minCharactersPerChunk: config.minCharactersPerChunk || 24,
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
    formData.append("recipe", this.config.recipe);
    formData.append("lang", this.config.lang);
    formData.append("min_characters_per_chunk", this.config.minCharactersPerChunk.toString());

    const data = await this.request<any>("/v1/chunk/late", {
      method: "POST",
      body: formData,
    });

    console.log(data);

    return data.map((chunk: any) => Chunk.fromDict(chunk));
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<(Chunk[] | string[])[]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
} 