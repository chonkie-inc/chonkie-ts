/** Neural chunker client for Chonkie API. */

import { CloudClient, ChunkerInput } from "./base";
import { Chunk } from "../types/base";

export interface NeuralChunkerConfig {
  model?: string;
  minCharactersPerChunk?: number;
}

export class NeuralChunker extends CloudClient {
  private readonly config: Required<NeuralChunkerConfig>;

  constructor(apiKey: string, config: NeuralChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      model: config.model || "mirth/chonky_modernbert_large_1",
      minCharactersPerChunk: config.minCharactersPerChunk || 10,
    };
  }

  async chunk(input: ChunkerInput): Promise<Chunk[]> {
    const formData = new FormData();

    if (input.filepath) {
      formData.append("file", input.filepath);
    } else if (input.text) {
      // JSON encode the text
      formData.append("text", JSON.stringify(input.text));
      // Append empty file to ensure multipart form
      formData.append("file", new Blob(), "text_input.txt");
    } else {
      throw new Error("Either text or file must be provided");
    }

    formData.append("embedding_model", this.config.model);
    formData.append("min_characters_per_chunk", this.config.minCharactersPerChunk.toString());
    formData.append("return_type", "chunks");

    const data = await this.request<any>("/v1/chunk/neural", {
      method: "POST",
      body: formData,
    });

    return data.map((chunk: any) => Chunk.fromDict(chunk));
  }

  async chunkBatch(inputs: ChunkerInput[]): Promise<Chunk[][]> {
    return Promise.all(inputs.map(input => this.chunk(input)));
  }
} 