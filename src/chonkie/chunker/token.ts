/** Module containing TokenChunker class. */

import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";
import { BaseChunker } from "./base";

/**
 * Options for creating a TokenChunker instance.
 * @interface TokenChunkerOptions
 * @property {string | Tokenizer} [tokenizer] - The tokenizer to use for chunking. Can be either a tokenizer name (defaults to "Xenova/gpt2") or an initialized Tokenizer instance.
 * @property {number} [chunkSize] - The maximum number of tokens per chunk. Must be positive. Defaults to 512.
 * @property {number} [chunkOverlap] - The number of tokens to overlap between chunks. Can be specified as a number (absolute tokens) or a decimal between 0 and 1 (percentage of chunkSize). Must be less than chunkSize. Defaults to 0.
 * @property {"chunks" | "texts"} [returnType] - The type of output to return. "chunks" returns Chunk objects with metadata, while "texts" returns just the chunked text strings. Defaults to "chunks".
 */
export interface TokenChunkerOptions {
  tokenizer?: string | Tokenizer;
  chunkSize?: number;
  chunkOverlap?: number;
  returnType?: "chunks" | "texts";
}

/**
 * Represents a TokenChunker instance that is also directly callable.
 * Calling it executes its `call` method (from BaseChunker), which
 * in turn calls `chunk` or `chunkBatch`.
 * 
 * @typedef {Object} CallableTokenChunker
 * @property {function(string, boolean=): Promise<Chunk[] | string[]>} - Single text chunking
 * @property {function(string[], boolean=): Promise<(Chunk[] | string[])[]>} - Batch text chunking
 * 
 * @param {string | string[]} textOrTexts - The text or array of texts to chunk
 * @param {boolean} [showProgress=true] - Whether to show progress during batch processing
 * @returns {Promise<Chunk[] | string[] | (Chunk[] | string[])[]>} - Returns either:
 *   - For single text: Promise resolving to array of Chunks or strings
 *   - For batch: Promise resolving to array of chunk arrays
 * 
 * @example
 * const chunker = await TokenChunker.create();
 * // Single text chunking
 * const chunks = await chunker("Hello world");
 * // Batch chunking
 * const batchChunks = await chunker(["Text 1", "Text 2"]);
 */
export type CallableTokenChunker = TokenChunker & {
  (text: string, showProgress?: boolean): Promise<Chunk[] | string[]>;
  (texts: string[], showProgress?: boolean): Promise<(Chunk[] | string[])[]>;
};

/**
 * TokenChunker class extends BaseChunker and provides token-based text chunking functionality.
 * This class splits text into overlapping chunks based on token counts, using a specified tokenizer.
 * 
 * @extends BaseChunker
 * 
 * @property {number} chunkSize - The maximum number of tokens per chunk
 * @property {number} chunkOverlap - The number of tokens to overlap between chunks
 * @property {"chunks" | "texts"} returnType - The type of output to return ("chunks" or "texts")
 * 
 * @method create - Creates and initializes a TokenChunker instance
 * @method chunk - Splits a single text into overlapping chunks
 * @method chunkBatch - Splits multiple texts into chunks
 * @method toString - Returns a string representation of the TokenChunker
 * 
 * @example
 * const chunker = await TokenChunker.create({
 *   chunkSize: 512,
 *   chunkOverlap: 50,
 *   returnType: "chunks"
 * });
 * const chunks = await chunker.chunk("Your text here");
 */
export class TokenChunker extends BaseChunker {
  public readonly chunkSize: number;
  public readonly chunkOverlap: number; // This is the calculated integer value
  public readonly returnType: "chunks" | "texts";

  /**
   * Private constructor for TokenChunker.
   * Use {@link TokenChunker.create} to instantiate this class.
   *
   * @param tokenizer - An initialized Tokenizer instance.
   * @param chunkSize - Maximum number of tokens per chunk (must be positive).
   * @param chunkOverlap - Number of tokens to overlap between chunks (must be non-negative and less than chunkSize).
   * @param returnType - Output type: either 'chunks' (Chunk objects) or 'texts' (plain strings).
   * @private
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
   * Asynchronously creates and initializes a TokenChunker instance that is directly callable as a function.
   * 
   * @param {TokenChunkerOptions} [options] - Configuration options for the TokenChunker.
   * @param {string|Tokenizer} [options.tokenizer] - The tokenizer to use (name or instance). Defaults to "Xenova/gpt2".
   * @param {number} [options.chunkSize] - Maximum number of tokens per chunk. Defaults to 512.
   * @param {number} [options.chunkOverlap] - Number of tokens to overlap between chunks (absolute or fraction). Defaults to 0.
   * @param {"chunks"|"texts"} [options.returnType] - Output type: "chunks" for Chunk objects, "texts" for plain strings. Defaults to "chunks".
   * @returns {Promise<CallableTokenChunker>} A Promise that resolves to a callable TokenChunker instance.
   * 
   * @example
   * const chunker = await TokenChunker.create({ chunkSize: 256, chunkOverlap: 32 });
   * const chunks = await chunker("Some text to chunk");
   * const batchChunks = await chunker(["Text 1", "Text 2"]);
   */
  public static async create(options: TokenChunkerOptions = {}): Promise<CallableTokenChunker> {
    const {
      tokenizer = "Xenova/gpt2",
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
      if (typeof tokenizer === 'string') {
        tokenizerInstance = await Tokenizer.create(tokenizer);
      } else {
        tokenizerInstance = tokenizer;
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
   * Validates that a chunk's token count is within the allowed range.
   *
   * @param {number} tokenCount - The number of tokens in the chunk to validate.
   * @param {string} chunkText - The text of the chunk (used for error messages).
   * @throws {Error} If the token count is zero, negative, or exceeds the configured chunk size.
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
   * Splits a list of token IDs into overlapping groups (chunks) according to the configured chunk size and overlap.
   *
   * Each group contains up to `chunkSize` tokens, and consecutive groups overlap by `chunkOverlap` tokens.
   * The step size between groups is `chunkSize - chunkOverlap`.
   * If the input token list is empty, returns an empty array.
   *
   * @param {number[]} tokens - The array of token IDs to be chunked.
   * @returns {number[][]} An array of token groups, where each group is an array of token IDs.
   *
   * @example
   * // With chunkSize=5, chunkOverlap=2:
   * // tokens = [1,2,3,4,5,6,7,8,9]
   * // returns: [[1,2,3,4,5], [4,5,6,7,8], [7,8,9]]
   */
  private _generateTokenGroups(tokens: number[]): number[][] {
    const tokenGroups: number[][] = [];
    if (tokens.length === 0) {
      return tokenGroups;
    }

    const step = this.chunkSize - this.chunkOverlap;

    for (let start = 0; start < tokens.length; start += step) {
      const end = Math.min(start + this.chunkSize, tokens.length);
      // Only add the chunk if it's larger than the overlap (otherwise, it might be fully contained in the previous chunk)
      if (end - start > this.chunkOverlap || start === 0) {
        tokenGroups.push(tokens.slice(start, end));
      }
    }
    return tokenGroups;
  }

  /**
   * Constructs Chunk objects from provided chunk texts, token groups, and token counts.
   * 
   * This method calculates accurate character offsets for each chunk, taking into account
   * overlapping regions between chunks. It ensures that each Chunk object contains the correct
   * text, start and end character indices, and token count.
   * 
   * @param {string[]} chunkTexts - The decoded text for each chunk.
   * @param {number[][]} tokenGroups - The token ID arrays for each chunk, used for overlap and offset calculation.
   * @param {number[]} tokenCounts - The number of tokens in each chunk.
   * @returns {Promise<Chunk[]>} Promise resolving to an array of Chunk objects, each with text, character offsets, and token count.
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
   * Splits a single input text into overlapping chunks based on the configured token size and overlap.
   *
   * The text is tokenized, divided into groups of tokens with the specified overlap, and then decoded back to text.
   * The output format depends on the `returnType` property: either an array of `Chunk` objects (with metadata)
   * or an array of plain text strings.
   *
   * @param {string} text - The input text to be chunked.
   * @returns {Promise<Chunk[] | string[]>} Promise resolving to an array of Chunks (with metadata) or an array of chunked text strings, depending on the `returnType`.
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
   * Splits a batch of texts into token-based chunks, returning either arrays of `Chunk` objects or arrays of chunked text strings for each input.
   *
   * This method leverages the implementation from the parent `BaseChunker` class, applying the current chunking configuration (tokenizer, chunk size, overlap, and return type).
   *
   * @param {string[]} texts - An array of input texts to be chunked.
   * @param {boolean} [showProgress=true] - Whether to display progress during batch processing.
   * @returns {Promise<Array<Chunk[] | string[]>>} A promise that resolves to an array, where each element is the result of chunking the corresponding input text (either an array of `Chunk` objects or an array of strings, depending on the `returnType`).
   *
   * @example
   * const chunker = await TokenChunker.create({ chunkSize: 128, chunkOverlap: 16, returnType: "chunks" });
   * const batchChunks = await chunker.chunkBatch([
   *   "First document to chunk.",
   *   "Second document, possibly longer."
   * ]);
   * // batchChunks[0] is an array of Chunks for the first document
   * // batchChunks[1] is an array of Chunks for the second document
   *
   * // If returnType is "texts":
   * const chunkerTexts = await TokenChunker.create({ chunkSize: 128, returnType: "texts" });
   * const batchTextChunks = await chunkerTexts.chunkBatch([
   *   "First document to chunk.",
   *   "Second document, possibly longer."
   * ]);
   * // batchTextChunks[0] is an array of strings for the first document
   * // batchTextChunks[1] is an array of strings for the second document
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
