/** Module containing CodeChunker class. */

import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";
import { CodeChunk } from "../types/code";
import { BaseChunker } from "./base";

/**
 * Represents a CodeChunker instance that is also directly callable.
 * Calling it executes its `call` method (from BaseChunker), which
 * in turn calls `chunk` or `chunkBatch`.
 */
export type CallableCodeChunker = CodeChunker & {
  (text: string, showProgress?: boolean): Promise<Chunk[] | string[]>;
  (texts: string[], showProgress?: boolean): Promise<(Chunk[] | string[])[]>;
};

export class CodeChunker extends BaseChunker {
  public readonly chunkSize: number;
  public readonly chunkOverlap: number;
  public readonly returnType: "chunks" | "texts";
  public readonly lang?: string;

  /**
   * Private constructor. Use `CodeChunker.create()` to instantiate.
   */
  private constructor(
    tokenizer: Tokenizer,
    chunkSize: number,
    chunkOverlap: number,
    returnType: "chunks" | "texts",
    lang?: string
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
    if (returnType !== "chunks" && returnType !== "texts") {
      throw new Error("returnType must be either 'chunks' or 'texts'");
    }

    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.returnType = returnType;
    this.lang = lang;
  }

  /**
   * Creates and initializes a CodeChunker instance that is directly callable.
   */
  public static async create(
    tokenizerOrName: string | Tokenizer = "gpt2",
    chunkSize: number = 512,
    chunkOverlap: number = 0,
    returnType: "chunks" | "texts" = "chunks",
    lang?: string
  ): Promise<CallableCodeChunker> {
    let tokenizerInstance: Tokenizer;
    if (typeof tokenizerOrName === 'string') {
      tokenizerInstance = await Tokenizer.create(tokenizerOrName);
    } else {
      tokenizerInstance = tokenizerOrName;
    }

    const plainInstance = new CodeChunker(
      tokenizerInstance,
      chunkSize,
      chunkOverlap,
      returnType,
      lang
    );

    // Create the callable function wrapper
    const callableFn = function(
      this: CallableCodeChunker,
      textOrTexts: string | string[],
      showProgress?: boolean
    ) {
      if (typeof textOrTexts === 'string') {
        return plainInstance.call(textOrTexts, showProgress);
      } else {
        return plainInstance.call(textOrTexts, showProgress);
      }
    };

    // Set the prototype so that 'instanceof CodeChunker' works
    Object.setPrototypeOf(callableFn, CodeChunker.prototype);

    // Copy all enumerable own properties from plainInstance to callableFn
    Object.assign(callableFn, plainInstance);

    return callableFn as unknown as CallableCodeChunker;
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
   * Create CodeChunk objects from chunk texts, token groups, and token counts.
   */
  private async _createChunks(
    chunkTexts: string[],
    tokenGroups: number[][],
    tokenCounts: number[]
  ): Promise<CodeChunk[]> {
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

    const chunks: CodeChunk[] = [];
    let currentCharacterIndex = 0;
    for (let i = 0; i < chunkTexts.length; i++) {
      const text = chunkTexts[i];
      const overlapLength = overlapCharacterLengths[i];
      const tokenCount = tokenCounts[i];

      // Ensure indices are always valid
      const startIndex = Math.max(0, currentCharacterIndex);
      const endIndex = startIndex + text.length;

      chunks.push(
        new CodeChunk({
          text: text,
          startIndex: startIndex,
          endIndex: endIndex,
          tokenCount: tokenCount,
          lang: this.lang
        })
      );

      // Ensure we don't go backwards in the text
      currentCharacterIndex = Math.max(startIndex, endIndex - overlapLength);
    }
    return chunks;
  }

  /**
   * Split code into overlapping chunks of specified token size.
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
   * Return a string representation of the CodeChunker.
   */
  public toString(): string {
    return `CodeChunker(tokenizer=${this.tokenizer}, ` +
      `chunkSize=${this.chunkSize}, chunkOverlap=${this.chunkOverlap}, ` +
      `returnType=${this.returnType}, lang=${this.lang})`;
  }
} 