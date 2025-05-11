/** Module containing RecursiveChunker class. */

import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";
import { RecursiveChunk, RecursiveLevel, RecursiveRules } from "../types/recursive";
import { BaseChunker } from "./base";

/**
 * Options for creating a RecursiveChunker instance.
 */
export interface RecursiveChunkerOptions {
  tokenizer?: string | Tokenizer;
  chunkSize?: number;
  rules?: RecursiveRules;
  minCharactersPerChunk?: number;
  returnType?: "chunks" | "texts";
}

/**
 * Represents a RecursiveChunker instance that is also directly callable.
 * Calling it executes its `call` method (from BaseChunker), which
 * in turn calls `chunk` or `chunkBatch`.
 */
export type CallableRecursiveChunker = RecursiveChunker & {
  (text: string, showProgress?: boolean): Promise<Chunk[] | string[]>;
  (texts: string[], showProgress?: boolean): Promise<(Chunk[] | string[])[]>;
};

export class RecursiveChunker extends BaseChunker {
  public readonly chunkSize: number;
  public readonly minCharactersPerChunk: number;
  public readonly returnType: "chunks" | "texts";
  public readonly rules: RecursiveRules;
  public readonly sep: string;
  private readonly _CHARS_PER_TOKEN: number = 6.5;

  /**
   * Private constructor. Use `RecursiveChunker.create()` to instantiate.
   */
  private constructor(
    tokenizer: Tokenizer,
    chunkSize: number,
    rules: RecursiveRules,
    minCharactersPerChunk: number,
    returnType: "chunks" | "texts"
  ) {
    super(tokenizer);

    if (chunkSize <= 0) {
      throw new Error("chunkSize must be greater than 0");
    }
    if (minCharactersPerChunk <= 0) {
      throw new Error("minCharactersPerChunk must be greater than 0");
    }
    if (returnType !== "chunks" && returnType !== "texts") {
      throw new Error("returnType must be either 'chunks' or 'texts'");
    }
    if (!(rules instanceof RecursiveRules)) {
      throw new Error("rules must be a RecursiveRules object");
    }

    this.chunkSize = chunkSize;
    this.minCharactersPerChunk = minCharactersPerChunk;
    this.returnType = returnType;
    this.rules = rules;
    this.sep = "✄";
  }

  /**
   * Creates and initializes a RecursiveChunker instance that is directly callable.
   */
  public static async create(options: RecursiveChunkerOptions = {}): Promise<CallableRecursiveChunker> {
    const {
      tokenizer = "Xenova/gpt2",
      chunkSize = 512,
      rules = new RecursiveRules(),
      minCharactersPerChunk = 24,
      returnType = "chunks"
    } = options;

    let tokenizerInstance: Tokenizer;
    if (typeof tokenizer === 'string') {
      tokenizerInstance = await Tokenizer.create(tokenizer);
    } else {
      tokenizerInstance = tokenizer;
    }

    const plainInstance = new RecursiveChunker(
      tokenizerInstance,
      chunkSize,
      rules,
      minCharactersPerChunk,
      returnType
    );

    // Create the callable function wrapper
    const callableFn = function(
      this: CallableRecursiveChunker,
      textOrTexts: string | string[],
      showProgress?: boolean
    ) {
      if (typeof textOrTexts === 'string') {
        return plainInstance.call(textOrTexts, showProgress);
      } else {
        return plainInstance.call(textOrTexts, showProgress);
      }
    };

    // Set the prototype so that 'instanceof RecursiveChunker' works
    Object.setPrototypeOf(callableFn, RecursiveChunker.prototype);

    // Copy all enumerable own properties from plainInstance to callableFn
    Object.assign(callableFn, plainInstance);

    return callableFn as unknown as CallableRecursiveChunker;
  }

  /**
   * Estimate token count for a text.
   */
  private async _estimateTokenCount(text: string): Promise<number> {
    const estimate = Math.max(1, Math.floor(text.length / this._CHARS_PER_TOKEN));
    return estimate > this.chunkSize ? this.chunkSize + 1 : await this.tokenizer.countTokens(text);
  }

  /**
   * Split the text into chunks using the delimiters.
   */
  private async _splitText(text: string, recursiveLevel: RecursiveLevel): Promise<string[]> {
    // At every delimiter, replace it with the sep
    if (recursiveLevel.whitespace) {
      return text.split(" ");
    } else if (recursiveLevel.delimiters) {
      let t = text;
      if (recursiveLevel.includeDelim === "prev") {
        for (const delimiter of Array.isArray(recursiveLevel.delimiters) ? recursiveLevel.delimiters : [recursiveLevel.delimiters]) {
          t = t.replace(delimiter, delimiter + this.sep);
        }
      } else if (recursiveLevel.includeDelim === "next") {
        for (const delimiter of Array.isArray(recursiveLevel.delimiters) ? recursiveLevel.delimiters : [recursiveLevel.delimiters]) {
          t = t.replace(delimiter, this.sep + delimiter);
        }
      } else {
        for (const delimiter of Array.isArray(recursiveLevel.delimiters) ? recursiveLevel.delimiters : [recursiveLevel.delimiters]) {
          t = t.replace(delimiter, this.sep);
        }
      }

      const splits = t.split(this.sep).filter(split => split !== "");

      // Merge short splits
      let current = "";
      const merged: string[] = [];
      for (const split of splits) {
        if (split.length < this.minCharactersPerChunk) {
          current += split;
        } else if (current) {
          current += split;
          merged.push(current);
          current = "";
        } else {
          merged.push(split);
        }

        if (current.length >= this.minCharactersPerChunk) {
          merged.push(current);
          current = "";
        }
      }

      if (current) {
        merged.push(current);
      }

      return merged;
    } else {
      // Encode, Split, and Decode
      const encoded = await this.tokenizer.encode(text);
      const tokenSplits = [];
      for (let i = 0; i < encoded.length; i += this.chunkSize) {
        tokenSplits.push(encoded.slice(i, i + this.chunkSize));
      }
      return await this.tokenizer.decodeBatch(tokenSplits);
    }
  }

  /**
   * Create a RecursiveChunk object with indices based on the current offset.
   */
  private _makeChunks(text: string, tokenCount: number, level: number, startOffset: number): RecursiveChunk {
    return new RecursiveChunk({
      text: text,
      startIndex: startOffset,
      endIndex: startOffset + text.length,
      tokenCount: tokenCount,
      level: level
    });
  }

  /**
   * Merge short splits.
   */
  private _mergeSplits(
    splits: string[],
    tokenCounts: number[],
    combineWhitespace: boolean = false
  ): [string[], number[]] {
    if (!splits.length || !tokenCounts.length) {
      return [[], []];
    }

    // If the number of splits and token counts does not match, raise an error
    if (splits.length !== tokenCounts.length) {
      throw new Error(
        `Number of splits ${splits.length} does not match number of token counts ${tokenCounts.length}`
      );
    }

    // If all splits are larger than the chunk size, return them
    if (tokenCounts.every(count => count > this.chunkSize)) {
      return [splits, tokenCounts];
    }

    // If the splits are too short, merge them
    const merged: string[] = [];
    const cumulativeTokenCounts: number[] = [];
    let sum = 0;
    if (combineWhitespace) {
      // +1 for the whitespace
      cumulativeTokenCounts.push(0);
      for (const count of tokenCounts) {
        sum += count + 1;
        cumulativeTokenCounts.push(sum);
      }
    } else {
      cumulativeTokenCounts.push(0);
      for (const count of tokenCounts) {
        sum += count;
        cumulativeTokenCounts.push(sum);
      }
    }

    let currentIndex = 0;
    const combinedTokenCounts: number[] = [];

    while (currentIndex < splits.length) {
      const currentTokenCount = cumulativeTokenCounts[currentIndex];
      const requiredTokenCount = currentTokenCount + this.chunkSize;

      // Find the index to merge at
      let index = this._bisectLeft(
        cumulativeTokenCounts,
        requiredTokenCount,
        currentIndex
      ) - 1;
      index = Math.min(index, splits.length);

      // If currentIndex == index, we need to move to the next index
      if (index === currentIndex) {
        index += 1;
      }

      // Merge splits
      if (combineWhitespace) {
        merged.push(splits.slice(currentIndex, index).join(" "));
      } else {
        merged.push(splits.slice(currentIndex, index).join(""));
      }

      // Adjust token count
      combinedTokenCounts.push(
        cumulativeTokenCounts[Math.min(index, splits.length)] - currentTokenCount
      );
      currentIndex = index;
    }

    return [merged, combinedTokenCounts];
  }

  /**
   * Binary search to find the leftmost position where value should be inserted to maintain order.
   */
  private _bisectLeft(arr: number[], value: number, lo: number = 0): number {
    let hi = arr.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (arr[mid] < value) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  /**
   * Recursive helper for core chunking.
   */
  private async _recursiveChunk(
    text: string,
    level: number = 0,
    startOffset: number = 0
  ): Promise<(RecursiveChunk | string)[]> {
    if (!text) {
      return [];
    }

    if (level >= this.rules.length) {
      if (this.returnType === "texts") {
        return [text];
      }
      if (this.returnType === "chunks") {
        const tokenCount = await this._estimateTokenCount(text);
        return [
          this._makeChunks(
            text,
            tokenCount,
            level,
            startOffset
          )
        ];
      }
      throw new Error(
        `Invalid returnType ${this.returnType}. Must be 'chunks' or 'texts'.`
      );
    }

    const currRule = this.rules.getLevel(level);
    if (!currRule) {
      throw new Error(`No rule found at level ${level}`);
    }

    const splits = await this._splitText(text, currRule);
    const tokenCounts = await Promise.all(splits.map(split => this._estimateTokenCount(split)));

    let merged: string[];
    let combinedTokenCounts: number[];

    if (currRule.delimiters === undefined && !currRule.whitespace) {
      [merged, combinedTokenCounts] = [splits, tokenCounts];
    } else if (currRule.delimiters === undefined && currRule.whitespace) {
      [merged, combinedTokenCounts] = this._mergeSplits(
        splits,
        tokenCounts,
        true
      );
      // NOTE: This is a hack to fix the reconstruction issue when whitespace is used.
      // When whitespace is there, " ".join only adds space between words, not before the first word.
      // To make it combine back properly, all splits except the first one are prefixed with a space.
      merged = merged.slice(0, 1).concat(
        merged.slice(1).map(text => " " + text)
      );
    } else {
      [merged, combinedTokenCounts] = this._mergeSplits(
        splits,
        tokenCounts,
        false
      );
    }

    // Chunk long merged splits
    const chunks: (RecursiveChunk | string)[] = [];
    let currentOffset = startOffset;
    for (let i = 0; i < merged.length; i++) {
      const split = merged[i];
      const tokenCount = combinedTokenCounts[i];
      if (tokenCount > this.chunkSize) {
        chunks.push(...await this._recursiveChunk(split, level + 1, currentOffset));
      } else {
        if (this.returnType === "chunks") {
          chunks.push(
            this._makeChunks(split, tokenCount, level, currentOffset)
          );
        } else if (this.returnType === "texts") {
          chunks.push(split);
        }
      }
      // Update the offset by the length of the processed split.
      currentOffset += split.length;
    }
    return chunks;
  }

  /**
   * Recursively chunk text.
   */
  public async chunk(text: string): Promise<Chunk[] | string[]> {
    const result = await this._recursiveChunk(text, 0, 0);
    if (this.returnType === "chunks") {
      return result as Chunk[];
    }
    return result as string[];
  }

  /**
   * Return a string representation of the RecursiveChunker.
   */
  public toString(): string {
    return `RecursiveChunker(tokenizer=${this.tokenizer}, ` +
      `rules=${this.rules}, chunkSize=${this.chunkSize}, ` +
      `minCharactersPerChunk=${this.minCharactersPerChunk}, ` +
      `returnType=${this.returnType})`;
  }
} 