/** SDPM chunker client for Chonkie API. */

import { CloudClient } from "./base";
import { Chunk } from "../types/base";

export interface SDPMChunkerConfig {
  embeddingModel?: string;
  threshold?: number | "auto";
  mode?: "window" | "cumulative";
  chunkSize?: number;
  similarityWindow?: number;
  minSentences?: number;
  minCharactersPerSentence?: number;
  thresholdStep?: number;
  delim?: string | string[];
  includeDelim?: "prev" | "next" | null;
  returnType?: "texts" | "chunks";
}

export class SDPMChunker extends CloudClient {
  private readonly config: Required<SDPMChunkerConfig>;

  constructor(apiKey: string, config: SDPMChunkerConfig = {}) {
    super({ apiKey });
    this.config = {
      embeddingModel: config.embeddingModel || "minishlab/potion-base-8M",
      threshold: config.threshold ?? "auto",
      mode: config.mode || "window",
      chunkSize: config.chunkSize || 512,
      similarityWindow: config.similarityWindow || 1,
      minSentences: config.minSentences || 1,
      minCharactersPerSentence: config.minCharactersPerSentence || 12,
      thresholdStep: config.thresholdStep || 0.01,
      delim: config.delim || [".", "!", "?", "\n"],
      includeDelim: config.includeDelim ?? "prev",
      returnType: config.returnType || "chunks",
    };
  }

  async chunk(text: string): Promise<Chunk[] | string[]> {
    const formData = new FormData();
    formData.append("file", new Blob([text], { type: "text/plain" }));
    formData.append("embedding_model", this.config.embeddingModel);
    if (typeof this.config.threshold === "number") {
      formData.append("threshold", this.config.threshold.toString());
    } else {
      formData.append("threshold", this.config.threshold);
    }
    formData.append("mode", this.config.mode);
    formData.append("chunk_size", this.config.chunkSize.toString());
    formData.append("similarity_window", this.config.similarityWindow.toString());
    formData.append("min_sentences", this.config.minSentences.toString());
    formData.append("min_characters_per_sentence", this.config.minCharactersPerSentence.toString());
    formData.append("threshold_step", this.config.thresholdStep.toString());
    if (Array.isArray(this.config.delim)) {
      this.config.delim.forEach(d => formData.append("delim", d));
    } else {
      formData.append("delim", this.config.delim);
    }
    if (this.config.includeDelim) {
      formData.append("include_delim", this.config.includeDelim);
    }
    formData.append("return_type", this.config.returnType);

    const data = await this.request<any>("/v1/chunk/sdpm", {
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    return this.config.returnType === "chunks" 
      ? data.map((chunk: any) => Chunk.fromDict(chunk))
      : data;
  }

  async chunkBatch(texts: string[]): Promise<(Chunk[] | string[])[]> {
    return Promise.all(texts.map(text => this.chunk(text)));
  }
} 