/** Module containing LateChunker class. */

import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";
import { LateChunk } from "../types/late";
import { BaseChunker } from "./base";

/**
 * Options for creating a LateChunker instance.
 */
export interface LateChunkerOptions {
  tokenizerOrName?: string | Tokenizer;
  chunkSize?: number;
  chunkOverlap?: number;
  embeddingModel?: string;
}

/**
 * Represents a LateChunker instance that is also directly callable.
 * Calling it executes its `call` method (from BaseChunker), which
 * in turn calls `chunk` or `chunkBatch`.
 */
export type CallableLateChunker = LateChunker & {
  (text: string, showProgress?: boolean): Promise<Chunk[]>;
  (texts: string[], showProgress?: boolean): Promise<Chunk[][]>;
};

export class LateChunker extends BaseChunker {
  public readonly chunkSize: number;
  public readonly chunkOverlap: number;
  public readonly embeddingModel?: string;
  private _embeddingModel?: any; // Will be initialized if embeddingModel is provided

  /**
   * Private constructor. Use `LateChunker.create()` to instantiate.
   */
  private constructor(
    tokenizer: Tokenizer,
    chunkSize: number,
    chunkOverlap: number,
    embeddingModel?: string
  ) {
    super(tokenizer);

    if (chunkSize <= 0) {
      throw new Error("chunkSize must be greater than 0");
    }
    if (chunkOverlap < 0) {
      throw new Error("chunkOverlap must be non-negative");
    }
    if (chunkOverlap >= chunkSize) {
      throw new Error("chunkOverlap must be less than chunkSize");
    }

    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.embeddingModel = embeddingModel;
  }

  /**
   * Initialize the embedding model if one is specified.
   * @throws Error if model initialization fails
   */
  private async _initializeEmbeddingModel(): Promise<void> {
    if (!this.embeddingModel) {
      return;
    }

    try {
      // TODO: Initialize the embedding model here
      // This will be implemented when we add embedding support
      // this._embeddingModel = await initializeEmbeddingModel(this.embeddingModel);
    } catch (error) {
      throw new Error(`Failed to initialize embedding model: ${error}`);
    }
  }

  /**
   * Generate embeddings for a batch of texts.
   * @param texts The texts to generate embeddings for
   * @returns A promise that resolves to an array of embeddings
   */
  private async _generateEmbeddings(texts: string[]): Promise<(number[] | undefined)[]> {
    if (!this._embeddingModel) {
      return new Array(texts.length).fill(undefined);
    }

    try {
      // TODO: Generate embeddings using the model
      // This will be implemented when we add embedding support
      // return await this._embeddingModel.generateEmbeddings(texts);
      return new Array(texts.length).fill(undefined);
    } catch (error) {
      console.warn(`Failed to generate embeddings: ${error}`);
      return new Array(texts.length).fill(undefined);
    }
  }

  /**
   * Creates and initializes a LateChunker instance that is directly callable.
   */
  public static async create(options: LateChunkerOptions = {}): Promise<CallableLateChunker> {
    const {
      tokenizerOrName = "gpt2",
      chunkSize = 512,
      chunkOverlap = 0,
      embeddingModel = "all-MiniLM-L6-v2"
    } = options;

    let tokenizerInstance: Tokenizer;
    if (typeof tokenizerOrName === 'string') {
      tokenizerInstance = await Tokenizer.create(tokenizerOrName);
    } else {
      tokenizerInstance = tokenizerOrName;
    }

    const plainInstance = new LateChunker(
      tokenizerInstance,
      chunkSize,
      chunkOverlap,
      embeddingModel
    );

    // Initialize embedding model if provided
    await plainInstance._initializeEmbeddingModel();

    // Create the callable function wrapper
    const callableFn = function(
      this: CallableLateChunker,
      textOrTexts: string | string[],
      showProgress?: boolean
    ) {
      if (typeof textOrTexts === 'string') {
        return plainInstance.call(textOrTexts, showProgress);
      } else {
        return plainInstance.call(textOrTexts, showProgress);
      }
    };

    // Set the prototype so that 'instanceof LateChunker' works
    Object.setPrototypeOf(callableFn, LateChunker.prototype);

    // Copy all enumerable own properties from plainInstance to callableFn
    Object.assign(callableFn, plainInstance);

    return callableFn as unknown as CallableLateChunker;
  }

  /**
   * Generate groups of tokens from a list of tokens based on chunkSize and chunkOverlap.
   */
  private _generateTokenGroups(tokens: number[]): number[][] {
    const tokenGroups: number[][] = [];
    if (tokens.length === 0) {
      return tokenGroups;
    }

    const step = this.chunkSize - this.chunkOverlap;

    for (let start = 0; start < tokens.length; start += step) {
      const end = Math.min(start + this.chunkSize, tokens.length);
      tokenGroups.push(tokens.slice(start, end));
    }
    return tokenGroups;
  }

  /**
   * Create LateChunk objects from chunk texts, token groups, and token counts.
   */
  private async _createChunks(
    chunkTexts: string[],
    tokenGroups: number[][],
    tokenCounts: number[]
  ): Promise<LateChunk[]> {
    let overlapCharacterLengths: number[];

    if (this.chunkOverlap > 0) {
      const overlapTokenSubgroups = tokenGroups.map((group) => {
        return group.length > this.chunkOverlap
          ? group.slice(-this.chunkOverlap)
          : group;
      });
      const overlapTexts = await this.tokenizer.decodeBatch(
        overlapTokenSubgroups
      );
      overlapCharacterLengths = overlapTexts.map((text) => text.length);
    } else {
      overlapCharacterLengths = new Array(tokenGroups.length).fill(0);
    }

    // Generate embeddings for all chunks at once
    const embeddings = await this._generateEmbeddings(chunkTexts);

    const chunks: LateChunk[] = [];
    let currentCharacterIndex = 0;
    for (let i = 0; i < chunkTexts.length; i++) {
      const text = chunkTexts[i];
      const overlapLength = overlapCharacterLengths[i];
      const tokenCount = tokenCounts[i];
      const embedding = embeddings[i];

      // Ensure indices are always valid
      const startIndex = Math.max(0, currentCharacterIndex);
      const endIndex = startIndex + text.length;

      chunks.push(
        new LateChunk({
          text: text,
          startIndex: startIndex,
          endIndex: endIndex,
          tokenCount: tokenCount,
          embedding: embedding
        })
      );

      // Ensure we don't go backwards in the text
      currentCharacterIndex = Math.max(startIndex, endIndex - overlapLength);
    }
    return chunks;
  }

  /**
   * Split text into overlapping chunks of specified token size.
   */
  public async chunk(text: string): Promise<Chunk[]> {
    if (!text.trim()) {
      return [];
    }

    const textTokens = await this.tokenizer.encode(text);
    if (textTokens.length === 0) {
      return [];
    }

    const tokenGroups = this._generateTokenGroups(textTokens);
    if (tokenGroups.length === 0) {
      return [];
    }

    const tokenCounts = tokenGroups.map((group) => group.length);
    const chunkTexts = await this.tokenizer.decodeBatch(tokenGroups);
    return this._createChunks(chunkTexts, tokenGroups, tokenCounts);
  }

  /**
   * Return a string representation of the LateChunker.
   */
  public toString(): string {
    return `LateChunker(tokenizer=${this.tokenizer}, ` +
      `chunkSize=${this.chunkSize}, chunkOverlap=${this.chunkOverlap}, ` +
      `embeddingModel=${this.embeddingModel})`;
  }
} 