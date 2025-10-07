import { Tokenizer } from '@/tokenizer';
import { Chunk, RecursiveRules, RecursiveLevel } from '@/types';

/**
 * Configuration options for RecursiveChunker.
 */
export interface RecursiveChunkerOptions {
  /** Maximum number of tokens per chunk */
  chunkSize?: number;
  /** Rules defining the recursive chunking hierarchy */
  rules?: RecursiveRules;
  /** Tokenizer instance to use for counting tokens */
  tokenizer?: Tokenizer;
  /** Minimum number of characters per chunk when merging */
  minCharactersPerChunk?: number;
}

/**
 * Recursively chunks text using a hierarchical set of rules.
 *
 * The chunker splits text at progressively finer granularities:
 * paragraphs → sentences → punctuation → words → characters
 *
 * Each chunk respects the configured chunk size limit.
 */
export class RecursiveChunker {
  public readonly chunkSize: number;
  public readonly rules: RecursiveRules;
  public readonly minCharactersPerChunk: number;
  private readonly tokenizer: Tokenizer;
  private readonly sep: string = '✄';
  private readonly CHARS_PER_TOKEN: number = 6.5;

  constructor(options: RecursiveChunkerOptions = {}) {
    this.chunkSize = options.chunkSize ?? 512;
    this.rules = options.rules ?? new RecursiveRules();
    this.tokenizer = options.tokenizer ?? new Tokenizer();
    this.minCharactersPerChunk = options.minCharactersPerChunk ?? 24;

    if (this.chunkSize <= 0) {
      throw new Error('chunkSize must be greater than 0');
    }
    if (this.minCharactersPerChunk <= 0) {
      throw new Error('minCharactersPerChunk must be greater than 0');
    }
  }

  /**
   * Chunk a single text into an array of chunks.
   *
   * @param text - The text to chunk
   * @returns Array of chunks
   */
  async chunk(text: string): Promise<Chunk[]> {
    return this.recursiveChunk(text, 0, 0);
  }

  /**
   * Estimate token count for a piece of text.
   * Uses a heuristic for quick estimation, falls back to actual counting.
   */
  private async estimateTokenCount(text: string): Promise<number> {
    const estimate = Math.max(1, Math.floor(text.length / this.CHARS_PER_TOKEN));
    return estimate > this.chunkSize
      ? this.chunkSize + 1
      : this.tokenizer.countTokens(text);
  }

  /**
   * Split text according to a recursive level's rules.
   */
  private async splitText(text: string, level: RecursiveLevel): Promise<string[]> {
    // Whitespace splitting
    if (level.whitespace) {
      return text.split(' ');
    }

    // Delimiter splitting
    if (level.delimiters) {
      let processedText = text;
      const delims = Array.isArray(level.delimiters) ? level.delimiters : [level.delimiters];

      // Add separator based on includeDelim setting
      if (level.includeDelim === 'prev') {
        for (const delim of delims) {
          processedText = processedText.replaceAll(delim, delim + this.sep);
        }
      } else if (level.includeDelim === 'next') {
        for (const delim of delims) {
          processedText = processedText.replaceAll(delim, this.sep + delim);
        }
      } else {
        for (const delim of delims) {
          processedText = processedText.replaceAll(delim, this.sep);
        }
      }

      const splits = processedText.split(this.sep).filter(s => s !== '');

      // Merge short splits
      const merged: string[] = [];
      let current = '';

      for (const split of splits) {
        if (split.length < this.minCharactersPerChunk) {
          current += split;
        } else if (current) {
          current += split;
          merged.push(current);
          current = '';
        } else {
          merged.push(split);
        }

        if (current.length >= this.minCharactersPerChunk) {
          merged.push(current);
          current = '';
        }
      }

      if (current) {
        merged.push(current);
      }

      return merged;
    }

    // Token-based splitting (final level)
    const encoded = this.tokenizer.encode(text);
    const tokenSplits: number[][] = [];
    for (let i = 0; i < encoded.length; i += this.chunkSize) {
      tokenSplits.push(encoded.slice(i, i + this.chunkSize));
    }
    return this.tokenizer.decodeBatch(tokenSplits);
  }

  /**
   * Create a chunk with proper metadata.
   */
  private makeChunk(text: string, tokenCount: number, startOffset: number): Chunk {
    return new Chunk({
      text,
      startIndex: startOffset,
      endIndex: startOffset + text.length,
      tokenCount
    });
  }

  /**
   * Merge splits to respect chunk size limits.
   */
  private mergeSplits(
    splits: string[],
    tokenCounts: number[],
    combineWhitespace: boolean = false
  ): [string[], number[]] {
    if (!splits.length || !tokenCounts.length) {
      return [[], []];
    }

    if (splits.length !== tokenCounts.length) {
      throw new Error('Mismatch between splits and token counts');
    }

    // If all splits exceed chunk size, return as-is
    if (tokenCounts.every(count => count > this.chunkSize)) {
      return [splits, tokenCounts];
    }

    // Build cumulative token counts
    const cumulativeTokenCounts: number[] = [0];
    let sum = 0;
    for (const count of tokenCounts) {
      sum += count + (combineWhitespace ? 1 : 0);
      cumulativeTokenCounts.push(sum);
    }

    // Merge splits to fit chunk size
    const merged: string[] = [];
    const combinedTokenCounts: number[] = [];
    let currentIndex = 0;

    while (currentIndex < splits.length) {
      const currentTokenCount = cumulativeTokenCounts[currentIndex];
      const requiredTokenCount = currentTokenCount + this.chunkSize;

      let index = this.bisectLeft(cumulativeTokenCounts, requiredTokenCount, currentIndex) - 1;
      index = Math.min(index, splits.length);

      if (index === currentIndex) {
        index += 1;
      }

      // Merge splits
      if (combineWhitespace) {
        merged.push(splits.slice(currentIndex, index).join(' '));
      } else {
        merged.push(splits.slice(currentIndex, index).join(''));
      }

      combinedTokenCounts.push(
        cumulativeTokenCounts[Math.min(index, splits.length)] - currentTokenCount
      );
      currentIndex = index;
    }

    return [merged, combinedTokenCounts];
  }

  /**
   * Binary search helper for merging splits.
   */
  private bisectLeft(arr: number[], value: number, lo: number = 0): number {
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
   * Core recursive chunking logic.
   */
  private async recursiveChunk(
    text: string,
    level: number,
    startOffset: number
  ): Promise<Chunk[]> {
    if (!text) {
      return [];
    }

    // Base case: no more levels
    if (level >= this.rules.length) {
      const tokenCount = await this.estimateTokenCount(text);
      return [this.makeChunk(text, tokenCount, startOffset)];
    }

    const currRule = this.rules.getLevel(level);
    if (!currRule) {
      throw new Error(`No rule found at level ${level}`);
    }

    // Split according to current level's rules
    const splits = await this.splitText(text, currRule);
    const tokenCounts = await Promise.all(
      splits.map(split => this.estimateTokenCount(split))
    );

    // Merge splits based on level type
    let merged: string[];
    let combinedTokenCounts: number[];

    if (currRule.delimiters === undefined && !currRule.whitespace) {
      // Token level - no merging
      [merged, combinedTokenCounts] = [splits, tokenCounts];
    } else if (currRule.delimiters === undefined && currRule.whitespace) {
      // Whitespace level - merge with spaces
      [merged, combinedTokenCounts] = this.mergeSplits(splits, tokenCounts, true);
      // Add space prefix to all but first split
      merged = merged.slice(0, 1).concat(merged.slice(1).map(t => ' ' + t));
    } else {
      // Delimiter level - merge without spaces
      [merged, combinedTokenCounts] = this.mergeSplits(splits, tokenCounts, false);
    }

    // Recursively process merged splits
    const chunks: Chunk[] = [];
    let currentOffset = startOffset;

    for (let i = 0; i < merged.length; i++) {
      const split = merged[i];
      const tokenCount = combinedTokenCounts[i];

      if (tokenCount > this.chunkSize) {
        // Recursively chunk oversized splits
        chunks.push(...await this.recursiveChunk(split, level + 1, currentOffset));
      } else {
        chunks.push(this.makeChunk(split, tokenCount, currentOffset));
      }

      currentOffset += split.length;
    }

    return chunks;
  }

  toString(): string {
    return `RecursiveChunker(chunkSize=${this.chunkSize}, levels=${this.rules.length})`;
  }
}
