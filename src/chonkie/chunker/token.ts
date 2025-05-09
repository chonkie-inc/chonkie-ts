/** Module containing TokenChunker class. */

import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";
import { BaseChunker } from "./base";

export class TokenChunker extends BaseChunker {
  public readonly chunkSize: number;
  public readonly chunkOverlap: number; // This is the calculated integer value
  public readonly returnType: "chunks" | "texts";

  /**
   * Private constructor. Use `TokenChunker.create()` to instantiate.
   * @param tokenizer The initialized tokenizer instance.
   * @param chunkSize Maximum number of tokens per chunk.
   * @param overlap Calculated absolute number of tokens to overlap.
   * @param returnType Whether to return 'chunks' or 'texts'.
   */
  private constructor(
    tokenizer: Tokenizer,
    chunkSize: number,
    overlap: number, // This is the already calculated integer overlap
    returnType: "chunks" | "texts"
  ) {
    super(tokenizer);

    if (chunkSize <= 0) {
      throw new Error("chunkSize must be positive.");
    }
    this.chunkSize = chunkSize;

    if (overlap < 0) {
      throw new Error("chunkOverlap must be non-negative.");
    }
    if (overlap >= chunkSize) {
      throw new Error(
        "chunkOverlap must be less than chunkSize."
      );
    }
    this.chunkOverlap = overlap;

    if (returnType !== "chunks" && returnType !== "texts") {
      throw new Error("returnType must be either 'chunks' or 'texts'.");
    }
    this.returnType = returnType;
  }

  /**
   * Creates and initializes a TokenChunker instance.
   * @param tokenizerOrName Tokenizer identifier (e.g., "google-bert/bert-base-uncased")
   * @param chunkSize Maximum number of tokens per chunk. Defaults to 512.
   * @param overlap Number of tokens to overlap between chunks.
   *                If 0 <= overlap < 1, it's treated as a percentage of chunkSize.
   *                Otherwise, it's treated as an absolute number of tokens. Defaults to 0.
   * @param returnType Whether to return 'chunks' (Chunk objects) or 'texts' (strings). Defaults to "chunks".
   * @returns A promise that resolves to a TokenChunker instance.
   * @throws Error if chunkSize <= 0, calculated chunkOverlap is invalid, or returnType is invalid.
   */
  public static async create(
    tokenizerOrName: string | Tokenizer = "google-bert/bert-base-uncased",
    chunkSize: number = 512,
    overlap: number = 0,
    returnType: "chunks" | "texts" = "chunks"
  ): Promise<TokenChunker> {
    if (chunkSize <= 0) {
      throw new Error("chunkSize must be positive.");
    }

    let calculatedOverlap: number;
    if (overlap >= 0 && overlap < 1) {
      calculatedOverlap = Math.floor(overlap * chunkSize);
    } else {
      calculatedOverlap = Math.floor(overlap);
    }

    if (calculatedOverlap < 0) {
      throw new Error("Calculated chunkOverlap must be non-negative.");
    }
    if (calculatedOverlap >= chunkSize) {
      throw new Error(
        "Calculated chunkOverlap must be less than chunkSize."
      );
    }

    if (returnType !== "chunks" && returnType !== "texts") {
      throw new Error("returnType must be either 'chunks' or 'texts'.");
    }

    let tokenizerInstance: Tokenizer;
    if (typeof tokenizerOrName === 'string') {
      tokenizerInstance = await Tokenizer.create(tokenizerOrName);
    } else {
      tokenizerInstance = tokenizerOrName;
    }

    return new TokenChunker(tokenizerInstance, chunkSize, calculatedOverlap, returnType);
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

      const startIndex = currentCharacterIndex;
      const endIndex = startIndex + text.length;

      chunks.push(
        new Chunk({
          text: text,
          startIndex: startIndex,
          endIndex: endIndex,
          tokenCount: tokenCount,
        })
      );

      currentCharacterIndex = endIndex - overlapLength;
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
   * Return a string representation of the TokenChunker.
   * Overrides the method from BaseChunker for more detailed output.
   */
  public toString(): string {
    return `${this.constructor.name}(tokenizer=${this.tokenizer.backend}, chunkSize=${this.chunkSize}, chunkOverlap=${this.chunkOverlap}, returnType='${this.returnType}')`;
  }
}
