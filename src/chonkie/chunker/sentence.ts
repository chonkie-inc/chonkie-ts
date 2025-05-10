/** Module containing SentenceChunker class. */

import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";
import { Sentence, SentenceChunk } from "../types/sentence";
import { BaseChunker } from "./base";

/**
 * Options for creating a SentenceChunker instance.
 */
export interface SentenceChunkerOptions {
  tokenizerOrName?: string | Tokenizer;
  chunkSize?: number;
  chunkOverlap?: number;
  minSentencesPerChunk?: number;
  minCharactersPerSentence?: number;
  approximate?: boolean;
  delim?: string[];
  includeDelim?: "prev" | "next" | null;
  returnType?: "chunks" | "texts";
}

/**
 * Represents a SentenceChunker instance that is also directly callable.
 * Calling it executes its `call` method (from BaseChunker), which
 * in turn calls `chunk` or `chunkBatch`.
 */
export type CallableSentenceChunker = SentenceChunker & {
  (text: string, showProgress?: boolean): Promise<Chunk[] | string[]>;
  (texts: string[], showProgress?: boolean): Promise<(Chunk[] | string[])[]>;
};

export class SentenceChunker extends BaseChunker {
  public readonly chunkSize: number;
  public readonly chunkOverlap: number;
  public readonly minSentencesPerChunk: number;
  public readonly minCharactersPerSentence: number;
  public readonly approximate: boolean;
  public readonly delim: string[];
  public readonly includeDelim: "prev" | "next" | null;
  public readonly sep: string;
  public readonly returnType: "chunks" | "texts";

  /**
   * Private constructor. Use `SentenceChunker.create()` to instantiate.
   */
  private constructor(
    tokenizer: Tokenizer,
    chunkSize: number,
    chunkOverlap: number,
    minSentencesPerChunk: number,
    minCharactersPerSentence: number,
    approximate: boolean,
    delim: string[],
    includeDelim: "prev" | "next" | null,
    returnType: "chunks" | "texts"
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
    if (minSentencesPerChunk <= 0) {
      throw new Error("minSentencesPerChunk must be greater than 0");
    }
    if (minCharactersPerSentence <= 0) {
      throw new Error("minCharactersPerSentence must be greater than 0");
    }
    if (!delim) {
      throw new Error("delim must be a list of strings or a string");
    }
    if (includeDelim !== "prev" && includeDelim !== "next" && includeDelim !== null) {
      throw new Error("includeDelim must be 'prev', 'next' or null");
    }
    if (returnType !== "chunks" && returnType !== "texts") {
      throw new Error("returnType must be either 'chunks' or 'texts'");
    }
    if (approximate) {
      console.warn("Approximate has been deprecated and will be removed from next version onwards!");
    }

    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
    this.minSentencesPerChunk = minSentencesPerChunk;
    this.minCharactersPerSentence = minCharactersPerSentence;
    this.approximate = approximate;
    this.delim = delim;
    this.includeDelim = includeDelim;
    this.sep = "✄";
    this.returnType = returnType;
  }

  /**
   * Creates and initializes a SentenceChunker instance that is directly callable.
   */
  public static async create(options: SentenceChunkerOptions = {}): Promise<CallableSentenceChunker> {
    const {
      tokenizerOrName = "Xenova/gpt2",
      chunkSize = 512,
      chunkOverlap = 0,
      minSentencesPerChunk = 1,
      minCharactersPerSentence = 12,
      approximate = false,
      delim = [". ", "! ", "? ", "\n"],
      includeDelim = "prev",
      returnType = "chunks"
    } = options;

    let tokenizerInstance: Tokenizer;
    if (typeof tokenizerOrName === 'string') {
      tokenizerInstance = await Tokenizer.create(tokenizerOrName);
    } else {
      tokenizerInstance = tokenizerOrName;
    }

    const plainInstance = new SentenceChunker(
      tokenizerInstance,
      chunkSize,
      chunkOverlap,
      minSentencesPerChunk,
      minCharactersPerSentence,
      approximate,
      delim,
      includeDelim,
      returnType
    );

    // Create the callable function wrapper
    const callableFn = function(
      this: CallableSentenceChunker,
      textOrTexts: string | string[],
      showProgress?: boolean
    ) {
      if (typeof textOrTexts === 'string') {
        return plainInstance.call(textOrTexts, showProgress);
      } else {
        return plainInstance.call(textOrTexts, showProgress);
      }
    };

    // Set the prototype so that 'instanceof SentenceChunker' works
    Object.setPrototypeOf(callableFn, SentenceChunker.prototype);

    // Copy all enumerable own properties from plainInstance to callableFn
    Object.assign(callableFn, plainInstance);

    return callableFn as unknown as CallableSentenceChunker;
  }
  

  // NOTE: The replace + split method is not the best/most efficient way in general to be doing this. It works well in python because python implements .replace and .split in C while the re library is much slower in python. 
  // NOTE: The new split -> join -> split is so weird, but it works. I don't quite like it however.
  // TODO: Implement a more efficient method for splitting text into sentences.
  // TODO: Make sure before the final version to make the _splitText method private.

  /**
   * Fast sentence splitting while maintaining accuracy.
   */
  public _splitText(text: string): string[] {
    let t = text;
    for (const c of this.delim) {
      if (this.includeDelim === "prev") {
        t = t.split(c).join(c + this.sep);
      } else if (this.includeDelim === "next") {
        t = t.split(c).join(this.sep + c);
      } else {
        t = t.split(c).join(this.sep);
      }
    }

    // Initial split — No filter because we want to keep the delimiters
    const splits = t.split(this.sep);

    // Process splits to form sentences
    const sentences: string[] = [];
    let current = "";

    for (const s of splits) {
      // If current is empty, start a new sentence
      if (!current) {
          current = s;
      } else {
          // If the current sentence is already long enough, add it to sentences
          if (current.length >= this.minCharactersPerSentence) {
            sentences.push(current);
            current = s;
          } else {
            current += s; // Since s has the spaces in it already, it can be concatenated directly
          }
        }
      }

    // Add the last sentence if it exists
    if (current) {
      sentences.push(current);
    }

    return sentences;
  }

  /**
   * Split text into sentences and calculate token counts for each sentence.
   */
  private async _prepareSentences(text: string): Promise<Sentence[]> {
    // Split text into sentences
    const sentenceTexts = this._splitText(text);
    if (!sentenceTexts.length) {
      return [];
    }

    // Calculate positions once
    const positions: number[] = [];
    let currentPos = 0;
    for (const sent of sentenceTexts) {
      positions.push(currentPos);
      currentPos += sent.length; // No +1 space because sentences are already separated by spaces
    }

    // Get accurate token counts in batch
    const tokenCounts = await this.tokenizer.countTokensBatch(sentenceTexts);

    // Create sentence objects
    return sentenceTexts.map((sent, i) => new Sentence({
      text: sent,
      startIndex: positions[i],
      endIndex: positions[i] + sent.length,
      tokenCount: tokenCounts[i]
    }));
  }

  /**
   * Create a chunk from a list of sentences.
   */
  private async _createChunk(sentences: Sentence[]): Promise<Chunk | string> {
    const chunkText = sentences.map(sentence => sentence.text).join("");
    if (this.returnType === "texts") {
      return chunkText;
    } else {
      // We calculate the token count here, as sum of the token counts of the sentences
      // does not match the token count of the chunk as a whole for some reason.
      const tokenCount = await this.tokenizer.countTokens(chunkText);

      return new SentenceChunk({
        text: chunkText,
        startIndex: sentences[0].startIndex,
        endIndex: sentences[sentences.length - 1].endIndex,
        tokenCount: tokenCount,
        sentences: sentences
      });
    }
  }

  /**
   * Split text into overlapping chunks based on sentences while respecting token limits.
   */
  public async chunk(text: string): Promise<Chunk[] | string[]> {
    if (!text.trim()) {
      return [];
    }

    // Get prepared sentences with token counts
    const sentences = await this._prepareSentences(text);
    if (!sentences.length) {
      return [];
    }

    // Pre-calculate cumulative token counts for bisect
    const tokenSums: number[] = [];
    let sum = 0;
    for (const sentence of sentences) {
      tokenSums.push(sum);
      sum += sentence.tokenCount;
    }
    tokenSums.push(sum);

    const chunks: (Chunk | string)[] = [];
    let pos = 0;

    while (pos < sentences.length) {
      // Use binary search to find initial split point
      const targetTokens = tokenSums[pos] + this.chunkSize;
      let splitIdx = this._bisectLeft(tokenSums, targetTokens, pos) - 1;
      splitIdx = Math.min(splitIdx, sentences.length);

      // Ensure we include at least one sentence beyond pos
      splitIdx = Math.max(splitIdx, pos + 1);

      // Handle minimum sentences requirement
      if (splitIdx - pos < this.minSentencesPerChunk) {
        // If the minimum sentences per chunk can be met, set the split index to the minimum sentences per chunk
        // Otherwise, warn the user that the minimum sentences per chunk could not be met for all chunks
        if (pos + this.minSentencesPerChunk <= sentences.length) {
          splitIdx = pos + this.minSentencesPerChunk;
        } else {
          console.warn(
            `Minimum sentences per chunk as ${this.minSentencesPerChunk} could not be met for all chunks. ` +
            `Last chunk of the text will have only ${sentences.length - pos} sentences. ` +
            "Consider increasing the chunk_size or decreasing the min_sentences_per_chunk."
          );
          splitIdx = sentences.length;
        }
      }

      // Get candidate sentences and verify actual token count
      const chunkSentences = sentences.slice(pos, splitIdx);
      chunks.push(await this._createChunk(chunkSentences));

      // Calculate next position with overlap
      if (this.chunkOverlap > 0 && splitIdx < sentences.length) {
        // Calculate how many sentences we need for overlap
        let overlapTokens = 0;
        let overlapIdx = splitIdx - 1;

        while (overlapIdx > pos && overlapTokens < this.chunkOverlap) {
          const sent = sentences[overlapIdx];
          const nextTokens = overlapTokens + sent.tokenCount + 1; // +1 for space
          if (nextTokens > this.chunkOverlap) {
            break;
          }
          overlapTokens = nextTokens;
          overlapIdx--;
        }

        // Move position to after the overlap
        pos = overlapIdx + 1;
      } else {
        pos = splitIdx;
      }
    }

    // Return the appropriate type based on returnType
    return this.returnType === "texts" 
      ? chunks as string[]
      : chunks as Chunk[];
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
   * Return a string representation of the SentenceChunker.
   */
  public toString(): string {
    return `SentenceChunker(tokenizer=${this.tokenizer}, ` +
      `chunkSize=${this.chunkSize}, ` +
      `chunkOverlap=${this.chunkOverlap}, ` +
      `minSentencesPerChunk=${this.minSentencesPerChunk}, ` +
      `minCharactersPerSentence=${this.minCharactersPerSentence}, ` +
      `approximate=${this.approximate}, delim=${this.delim}, ` +
      `includeDelim=${this.includeDelim}, ` +
      `returnType=${this.returnType})`;
  }
} 