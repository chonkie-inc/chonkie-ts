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
        const response = await this.request<Chunk[]>("/v1/refine/overlap", {
            body: {
                chunks: chunks.map(chunk => chunk.toDict()),
                tokenizer_or_token_counter: this.config.tokenizerOrTokenCounter,
                context_size: this.config.contextSize,
                mode: this.config.mode,
                method: this.config.method,
                recipe: this.config.recipe,
                lang: this.config.lang,
                merge: this.config.merge,
            },
        });

        return response.map(chunk => Chunk.fromDict(chunk));
    }
} 