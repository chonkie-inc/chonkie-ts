import { CloudClient } from "./base";
import { Chunk } from "../types/base";


export interface OverlapRefineryConfig {
  tokenizerOrTokenCounter?: string;
  contextSize?: number;
  mode?: "token" | "recursive";
  method?: "suffix" | "prefix";
  recipe?: string;
  lang?: string;
  merge?: boolean;
}
export class OverlapRefinery extends CloudClient {
    private readonly config: Required<OverlapRefineryConfig>;

    constructor(apiKey: string, config: OverlapRefineryConfig = {}) {
        super({ apiKey });
        this.config = {
            tokenizerOrTokenCounter: config.tokenizerOrTokenCounter || "character",
            contextSize: config.contextSize ?? 0.25,
            mode: config.mode || "token",
            method: config.method || "suffix",
            recipe: config.recipe || "default",
            lang: config.lang || "en",
            merge: config.merge ?? true,
        };
    }

    async refine(chunks: Chunk[]): Promise<Chunk[]> {
        // Create snake cased chunks for the request
        const snakeCasedChunks = chunks.map(chunk => {
            return {
                text: chunk.text,
                start_index: chunk.startIndex,
                end_index: chunk.endIndex,
                token_count: chunk.tokenCount,
            };
        });
        const response = await this.request<any>("/v1/refine/overlap", {
            body: {
                chunks: snakeCasedChunks,
                tokenizer_or_token_counter: this.config.tokenizerOrTokenCounter,
                context_size: this.config.contextSize,
                mode: this.config.mode,
                method: this.config.method,
                recipe: this.config.recipe,
                lang: this.config.lang,
                merge: this.config.merge,
            },
            headers: {
                "Content-Type": "application/json",
            },
        });
        // Merge the response chunks with the original chunks
        const mergedChunks = response.map((chunk: any, index: number) => {
            const originalChunk = chunks[index];
            return {
                ...originalChunk,
                text: chunk.text,
                startIndex: chunk.start_index,
                endIndex: chunk.end_index,
                tokenCount: chunk.token_count,
            };
        });
        return mergedChunks;
    }
} 