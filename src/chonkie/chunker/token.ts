/** Module containing TokenChunker class. */

import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";
import { BaseChunker } from "./base";

/**
 * Options for creating a TokenChunker instance.
 */
export interface TokenChunkerOptions {
  tokenizerOrName?: string | Tokenizer;
  chunkSize?: number;
  chunkOverlap?: number;
  returnType?: "chunks" | "texts";
}

/**
 * Represents a TokenChunker instance that is also directly callable.
 * Calling it executes its `call` method (from BaseChunker), which
 * in turn calls `chunk` or `chunkBatch`.
 */
export type CallableTokenChunker = TokenChunker & {
  (text: string, showProgress?: boolean): Promise<Chunk[] | string[]>;
  (texts: string[], showProgress?: boolean): Promise<(Chunk[] | string[])[]>;
};

export class TokenChunker extends BaseChunker {
  public readonly chunkSize: number;
  public readonly chunkOverlap: number; // This is the calculated integer value
  public readonly returnType: "chunks" | "texts";

  /** 
   * Private constructor. Use `TokenChunker.create()` to instantiate.
   * @param tokenizer The initialized tokenizer instance.
   * @param chunkSize Maximum number of tokens per chunk.
   * @param chunkOverlap Calculated absolute number of tokens to overlap.
   * @param returnType Whether to return 'chunks' or 'texts'.
   */
  private constructor(
    tokenizer: Tokenizer,
    chunkSize: number,
    chunkOverlap: number, // This is the already calculated integer overlap
    returnType: "chunks" | "texts"
  ) {
    super(tokenizer);

    if (chunkSize <= 0) {
      throw new Error("chunkSize must be positive.");
    }
    this.chunkSize = chunkSize;

    if (chunkOverlap < 0) {
      throw new Error("chunkOverlap must be non-negative.");
    }
    if (chunkOverlap >= chunkSize) {
      throw new Error(
        "chunkOverlap must be less than chunkSize."
      );
    }
    this.chunkOverlap = chunkOverlap;

    if (returnType !== "chunks" && returnType !== "texts") {
      throw new Error("returnType must be either 'chunks' or 'texts'.");
    }
    this.returnType = returnType;
  }

  /**
   * Creates and initializes a TokenChunker instance that is directly callable.
   */
  public static async create(options: TokenChunkerOptions = {}): Promise<CallableTokenChunker> {
    const {
      tokenizerOrName = "EleutherAI/gpt-j-6b",
      chunkSize = 512,
      chunkOverlap = 0,
      returnType = "chunks"
    } = options;

    if (chunkSize <= 0) {
      throw new Error("chunkSize must be positive.");
    }

    let calculatedChunkOverlap: number;
    if (chunkOverlap >= 0 && chunkOverlap < 1) {
      calculatedChunkOverlap = Math.floor(chunkOverlap * chunkSize);
    } else {
      calculatedChunkOverlap = Math.floor(chunkOverlap);
    }

    // Check for invalid overlap values
    if (calculatedChunkOverlap < 0) {
      throw new Error("Calculated chunkOverlap must be non-negative.");
    }
    if (calculatedChunkOverlap >= chunkSize) {
      throw new Error("Calculated chunkOverlap must be less than chunkSize.");
    }

    if (returnType !== "chunks" && returnType !== "texts") {
      throw new Error("returnType must be either 'chunks' or 'texts'.");
    }

    let tokenizerInstance: Tokenizer;
    try {
      if (typeof tokenizerOrName === 'string') {
        tokenizerInstance = await Tokenizer.create(tokenizerOrName);
      } else {
        tokenizerInstance = tokenizerOrName;
      }
    } catch (error) {
      throw new Error(`Failed to initialize tokenizer: ${error}`);
    }

    const plainInstance = new TokenChunker(tokenizerInstance, chunkSize, calculatedChunkOverlap, returnType);

    // Create the callable function wrapper
    const callableFn = function (
      this: CallableTokenChunker,
      textOrTexts: string | string[],
      showProgress?: boolean
    ) {
      if (typeof textOrTexts === 'string') {
        return plainInstance.call(textOrTexts, showProgress);
      } else {
        return plainInstance.call(textOrTexts, showProgress);
      }
    };

    // Set the prototype so that 'instanceof TokenChunker' works
    Object.setPrototypeOf(callableFn, TokenChunker.prototype);

    // Copy all enumerable own properties from plainInstance to callableFn
    Object.assign(callableFn, plainInstance);
    
    return callableFn as unknown as CallableTokenChunker;
  }

  /**
   * Estimate the number of tokens in a text.
   * @param text The text to estimate tokens for
   * @returns A promise that resolves to the estimated number of tokens
   */
  private async _estimateTokenCount(text: string): Promise<number> {
    try {
      const tokens = await this.tokenizer.encode(text);
      return tokens.length;
    } catch (error) {
      console.warn(`Failed to estimate token count: ${error}`);
      // Fallback to a rough estimate based on characters
      return Math.ceil(text.length / 4); // Rough estimate: 4 chars per token
    }
  }

  /**
   * Validate that a chunk's token count is within acceptable bounds.
   * @param tokenCount The token count to validate
   * @param chunkText The text of the chunk (for error messages)
   * @throws Error if token count is invalid
   */
  private _validateTokenCount(tokenCount: number, chunkText: string): void {
    if (tokenCount <= 0) {
      throw new Error(`Invalid token count ${tokenCount} for chunk: ${chunkText}`);
    }
    if (tokenCount > this.chunkSize) {
      throw new Error(`Chunk exceeds maximum token size (${tokenCount} > ${this.chunkSize}): ${chunkText}`);
    }
  }

  /**
   * Generate groups of tokens from a list of tokens based on chunkSize and chunkOverlap.
   * @param tokens The list of tokens to process.
   * @returns A list of token groups (each group is a list of token IDs).
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
   * Create Chunk objects from chunk texts, token groups, and token counts.
   * Calculates character offsets correctly for overlapping chunks.
   * @param chunkTexts List of chunk texts.
   * @param tokenGroups List of token groups corresponding to chunkTexts.
   * @param tokenCounts List of token counts for each chunk.
   * @returns A promise that resolves to a list of Chunk objects.
   */
  private async _createChunks(
    chunkTexts: string[],
    tokenGroups: number[][], // Original token groups for overlap calculation
    tokenCounts: number[]
  ): Promise<Chunk[]> {
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

    const chunks: Chunk[] = [];
    let currentCharacterIndex = 0;
    for (let i = 0; i < chunkTexts.length; i++) {
      const text = chunkTexts[i];
      const overlapLength = overlapCharacterLengths[i];
      const tokenCount = tokenCounts[i];

      // Validate token count
      this._validateTokenCount(tokenCount, text);

      // Ensure indices are always valid
      const startIndex = Math.max(0, currentCharacterIndex);
      const endIndex = startIndex + text.length;

      chunks.push(
        new Chunk({
          text: text,
          startIndex: startIndex,
          endIndex: endIndex,
          tokenCount: tokenCount,
        })
      );

      // Ensure we don't go backwards in the text
      currentCharacterIndex = Math.max(startIndex, endIndex - overlapLength);
    }
    return chunks;
  }

  /**
   * Split text into overlapping chunks of specified token size.
   * @param text Input text to be chunked.
   * @returns A promise that resolves to a list of Chunks or a list of strings,
   *          depending on the `returnType`.
   */
  public async chunk(text: string): Promise<Chunk[] | string[]> {
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

    if (this.returnType === "chunks") {
      const tokenCounts = tokenGroups.map((group) => group.length);
      const chunkTexts = await this.tokenizer.decodeBatch(tokenGroups);
      return this._createChunks(chunkTexts, tokenGroups, tokenCounts);
    } else {
      return this.tokenizer.decodeBatch(tokenGroups);
    }
  }

  /**
   * Splits a batch of texts into chunks.
   * This now calls the super class's chunkBatch to leverage its more complete implementation.
   * @param texts An array of texts to chunk.
   * @param showProgress Whether to show progress. Defaults to true as per BaseChunker.
   * @returns A promise that resolves to an array, where each element is the result of chunking the corresponding input text.
   */
  public async chunkBatch(texts: string[], showProgress: boolean = true): Promise<Array<Chunk[] | string[]>> {
    return super.chunkBatch(texts, showProgress);
  }

  /**
   * Return a string representation of the TokenChunker.
   * Overrides the method from BaseChunker for more detailed output.
   */
  public toString(): string {
    return `${this.constructor.name}(tokenizer=${this.tokenizer.backend}, chunkSize=${this.chunkSize}, chunkOverlap=${this.chunkOverlap}, returnType='${this.returnType}')`;
  }
}
