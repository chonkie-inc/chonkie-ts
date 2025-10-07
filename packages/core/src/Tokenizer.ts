/**
 * Simple character-based tokenizer for text chunking.
 *
 * This tokenizer treats each character as a single token, providing
 * a straightforward and predictable tokenization strategy.
 */
export class Tokenizer {
  /**
   * Count the number of tokens in the given text.
   * For character-based tokenization, this is simply the length of the text.
   *
   * @param text - The text to count tokens for
   * @returns The number of tokens (characters) in the text
   */
  countTokens(text: string): number {
    return text.length;
  }

  /**
   * Encode text into token IDs.
   * For character-based tokenization, returns character codes.
   *
   * @param text - The text to encode
   * @returns Array of character codes
   */
  encode(text: string): number[] {
    return Array.from(text).map(char => char.charCodeAt(0));
  }

  /**
   * Decode token IDs back into text.
   * For character-based tokenization, converts character codes back to string.
   *
   * @param tokens - Array of token IDs (character codes)
   * @returns The decoded text
   */
  decode(tokens: number[]): string {
    return String.fromCharCode(...tokens);
  }

  /**
   * Decode a batch of token arrays.
   *
   * @param tokensBatch - Array of token arrays
   * @returns Array of decoded texts
   */
  decodeBatch(tokensBatch: number[][]): string[] {
    return tokensBatch.map(tokens => this.decode(tokens));
  }
}
