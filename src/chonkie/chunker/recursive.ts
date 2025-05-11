/** Module containing RecursiveChunker class. */

import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";
import { RecursiveChunk, RecursiveLevel, RecursiveRules } from "../types/recursive";
import { BaseChunker } from "./base";

/**
 * Configuration options for creating a RecursiveChunker instance.
 * All options are optional and have sensible defaults.
 * 
 * @interface RecursiveChunkerOptions
 * @property {string | Tokenizer} [tokenizer] - The tokenizer to use for text processing. Can be a string identifier (default: "Xenova/gpt2") or a Tokenizer instance.
 * @property {number} [chunkSize] - The maximum number of tokens per chunk. Must be greater than 0. Default: 512.
 * @property {RecursiveRules} [rules] - The rules that define how text should be recursively chunked. Default: new RecursiveRules().
 * @property {number} [minCharactersPerChunk] - The minimum number of characters that should be in each chunk. Must be greater than 0. Default: 24.
 * @property {"chunks" | "texts"} [returnType] - The type of output to return. "chunks" returns Chunk objects with metadata, "texts" returns plain strings. Default: "chunks".
 */
export interface RecursiveChunkerOptions {
  tokenizer?: string | Tokenizer;
  chunkSize?: number;
  rules?: RecursiveRules;
  minCharactersPerChunk?: number;
  returnType?: "chunks" | "texts";
}

/**
 * Represents a RecursiveChunker instance that is also directly callable as a function.
 *
 * This type combines all properties and methods of {@link RecursiveChunker} with callable signatures for chunking text(s).
 *
 * Calling the instance executes its `call` method (from {@link BaseChunker}), which in turn calls `chunk` or `chunkBatch`.
 *
 * @typedef {Object} CallableRecursiveChunker
 * @property {number} chunkSize - The maximum number of tokens per chunk.
 * @property {number} minCharactersPerChunk - The minimum number of characters per chunk.
 * @property {"chunks" | "texts"} returnType - The type of output to return ("chunks" for Chunk objects, "texts" for plain strings).
 * @property {RecursiveRules} rules - The rules that define how text should be recursively chunked.
 * @property {string} sep - The separator string used for internal splitting (usually "✄").
 * @property {Tokenizer} tokenizer - The tokenizer instance used for chunking operations (inherited from BaseChunker).
 *
 * @method chunk - Recursively chunk a single text into chunks or strings.
 * @method chunkBatch - Recursively chunk a batch of texts.
 * @method toString - Returns a string representation of the RecursiveChunker instance.
 * @method call - Call the chunker with a single string or an array of strings. (see callable signatures)
 *
 * @static
 * @method create
 * @memberof CallableRecursiveChunker
 * @param {RecursiveChunkerOptions} [options] - Configuration options for the RecursiveChunker.
 * @returns {Promise<CallableRecursiveChunker>} A Promise that resolves to a callable RecursiveChunker instance.
 *
 * @example
 * const chunker = await RecursiveChunker.create({ chunkSize: 256 });
 * const chunks = await chunker("Some text to chunk");
 * const batchChunks = await chunker(["Text 1", "Text 2"]);
 */
export type CallableRecursiveChunker = RecursiveChunker & {
  (text: string, showProgress?: boolean): Promise<Chunk[] | string[]>;
  (texts: string[], showProgress?: boolean): Promise<(Chunk[] | string[])[]>;
};


/**
 * Recursively chunk text using a set of rules.
 * 
 * This class extends the BaseChunker class and implements the chunk method.
 * It provides a flexible way to chunk text based on custom rules, including
 * delimiters, whitespace, and token-based chunking.
 * 
 * @extends BaseChunker
 * @property {number} chunkSize - The maximum number of tokens per chunk.
 * @property {number} minCharactersPerChunk - The minimum number of characters per chunk.
 * @property {"chunks" | "texts"} returnType - The type of output to return ("chunks" for Chunk objects, "texts" for plain strings).
 * @property {RecursiveRules} rules - The rules that define how text should be recursively chunked.
 * @property {string} sep - The separator string used for internal splitting (usually "✄").
 * 
 * @method chunk - Recursively chunk a single text into chunks or strings.
 * @method chunkBatch - Recursively chunk a batch of texts.
 * @method toString - Returns a string representation of the RecursiveChunker instance.
 * @method call - Call the chunker with a single string or an array of strings. (see callable signatures)
 * 
 * @static
 * @method create
 * @memberof RecursiveChunker
 * @param {RecursiveChunkerOptions} [options] - Configuration options for the RecursiveChunker.
 * @returns {Promise<RecursiveChunker>} A Promise that resolves to a RecursiveChunker instance.
 * 
 * @example
 * const chunker = await RecursiveChunker.create({ chunkSize: 256 });
 * const chunks = await chunker("Some text to chunk");
 * const batchChunks = await chunker(["Text 1", "Text 2"]);
 */
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
   * Creates and initializes a directly callable RecursiveChunker instance.
   *
   * This static factory method constructs a RecursiveChunker with the provided options and returns a callable function object.
   * The returned instance can be used as both a function (to chunk text(s)) and as an object (with all RecursiveChunker methods and properties).
   *
   * @param {RecursiveChunkerOptions} [options] - Configuration options for the chunker. All options are optional:
   *   @param {string|Tokenizer} [options.tokenizer="Xenova/gpt2"] - Tokenizer to use for text processing. Can be a string identifier (e.g., "Xenova/gpt2") or a Tokenizer instance. If a string is provided, Tokenizer.create() is called internally.
   *   @param {number} [options.chunkSize=512] - Maximum number of tokens per chunk. Must be > 0.
   *   @param {RecursiveRules} [options.rules=new RecursiveRules()] - Rules for recursive chunking. See {@link RecursiveRules} for customization.
   *   @param {number} [options.minCharactersPerChunk=24] - Minimum number of characters per chunk. Must be > 0.
   *   @param {"chunks"|"texts"} [options.returnType="chunks"] - Output type: "chunks" for Chunk objects, "texts" for plain strings.
   *
   * @returns {Promise<CallableRecursiveChunker>} Promise resolving to a callable RecursiveChunker instance.
   *
   * @throws {Error} If any option is invalid (e.g., chunkSize <= 0, invalid returnType, etc).
   *
   * @see CallableRecursiveChunker for the callable interface and available properties/methods.
   *
   * @example <caption>Basic usage with default options</caption>
   * const chunker = await RecursiveChunker.create();
   * const chunks = await chunker("Some text to chunk");
   *
   * @example <caption>Custom options and batch chunking</caption>
   * const chunker = await RecursiveChunker.create({ chunkSize: 256, returnType: "texts" });
   * const batchChunks = await chunker(["Text 1", "Text 2"]);
   *
   * @example <caption>Accessing properties and methods</caption>
   * const chunker = await RecursiveChunker.create();
   * console.log(chunker.chunkSize); // 512
   * console.log(chunker.rules); // RecursiveRules instance
   * const chunks = await chunker.chunk("Some text"); // Use as object method
   *
   * @note
   * The returned instance is both callable (like a function) and has all properties/methods of RecursiveChunker.
   * You can use it as a drop-in replacement for a function or a class instance.
   *
   * @note
   * For advanced customization, pass a custom RecursiveRules object to the rules option.
   * See {@link RecursiveRules} and {@link RecursiveLevel} for rule structure.
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
   * Estimates the number of tokens in a given text.
   * 
   * This method uses a character-to-token ratio (default: 6.5 characters per token) for quick estimation.
   * If the estimated token count exceeds the chunk size, it performs an actual token count.
   * 
   * @param {string} text - The text to estimate token count for
   * @returns {Promise<number>} A promise that resolves to the estimated number of tokens
   * @private
   */
  private async _estimateTokenCount(text: string): Promise<number> {
    const estimate = Math.max(1, Math.floor(text.length / this._CHARS_PER_TOKEN));
    return estimate > this.chunkSize ? this.chunkSize + 1 : await this.tokenizer.countTokens(text);
  }

  /**
   * Split the text into chunks based on the provided recursive level rules.
   * 
   * This method handles three different splitting strategies:
   * 1. Whitespace-based splitting: Splits text on spaces
   * 2. Delimiter-based splitting: Splits text on specified delimiters with options to include delimiters
   * 3. Token-based splitting: Splits text into chunks of maximum token size
   * 
   * @param {string} text - The text to be split into chunks
   * @param {RecursiveLevel} recursiveLevel - The rules defining how to split the text
   * @returns {Promise<string[]>} A promise that resolves to an array of text chunks
   * @private
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
   * 
   * This method constructs a RecursiveChunk object that contains metadata about the chunk,
   * including the text content, its start and end indices, token count, and the level of recursion.
   * 
   * @param {string} text - The text content of the chunk
   * @param {number} tokenCount - The number of tokens in the chunk
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
   * 
   * @param {number[]} arr - The array to search
   * @param {number} value - The value to insert
   * @param {number} [lo=0] - The starting index for the search
   * @returns {number} The index where the value should be inserted
   * @private
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
   * 
   * This method is the main entry point for chunking text using the RecursiveChunker.
   * It takes a single text string and returns an array of chunks or strings depending on the returnType.
   * 
   * @param {string} text - The text to be chunked
   * @returns {Promise<Chunk[] | string[]>} A promise that resolves to an array of Chunk objects or strings
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
   * 
   * This method provides a string representation of the RecursiveChunker instance,
   * including its tokenizer, rules, chunk size, minimum characters per chunk, and return type.
   * 
   * @returns {string} A string representation of the RecursiveChunker
   */
  public toString(): string {
    return `RecursiveChunker(tokenizer=${this.tokenizer}, ` +
      `rules=${this.rules}, chunkSize=${this.chunkSize}, ` +
      `minCharactersPerChunk=${this.minCharactersPerChunk}, ` +
      `returnType=${this.returnType})`;
  }
} 