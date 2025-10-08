/**
 * HuggingFace tokenizer implementation using @huggingface/transformers
 */

import { AutoTokenizer, PreTrainedTokenizer } from '@huggingface/transformers';
import { Tokenizer } from '@chonkiejs/core';

/**
 * Tokenizer that uses HuggingFace transformers.js for tokenization.
 *
 * Extends the base Tokenizer interface from @chonkiejs/core to provide
 * real tokenization using models like GPT-2, BERT, etc.
 */
export class HuggingFaceTokenizer extends Tokenizer {
  private hfTokenizer: PreTrainedTokenizer;
  private modelName: string;

  private constructor(hfTokenizer: PreTrainedTokenizer, modelName: string) {
    super();
    this.hfTokenizer = hfTokenizer;
    this.modelName = modelName;
  }

  /**
   * Create a HuggingFace tokenizer instance.
   *
   * @param model - HuggingFace model name (e.g., 'gpt2', 'Xenova/gpt-4', 'bert-base-uncased')
   * @returns Promise resolving to HuggingFaceTokenizer instance
   *
   * @example
   * const tokenizer = await HuggingFaceTokenizer.create('gpt2');
   * const tokenizer = await HuggingFaceTokenizer.create('Xenova/gpt-4');
   */
  static async create(model: string): Promise<HuggingFaceTokenizer> {
    try {
      const hfTokenizer = await AutoTokenizer.from_pretrained(model);
      return new HuggingFaceTokenizer(hfTokenizer, model);
    } catch (error) {
      throw new Error(`Failed to load HuggingFace tokenizer "${model}": ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Count tokens in text using HuggingFace tokenizer.
   */
  countTokens(text: string): number {
    const encoded = this.hfTokenizer.encode(text) as number[];
    return encoded.length;
  }

  /**
   * Encode text into token IDs.
   */
  encode(text: string): number[] {
    return this.hfTokenizer.encode(text) as number[];
  }

  /**
   * Decode token IDs back into text.
   */
  decode(tokens: number[]): string {
    return this.hfTokenizer.decode(tokens, { skip_special_tokens: true });
  }

  /**
   * Decode a batch of token arrays.
   */
  decodeBatch(tokensBatch: number[][]): string[] {
    return tokensBatch.map(tokens => this.decode(tokens));
  }

  /**
   * Get the model name.
   */
  getModelName(): string {
    return this.modelName;
  }

  toString(): string {
    return `HuggingFaceTokenizer(model=${this.modelName})`;
  }
}
