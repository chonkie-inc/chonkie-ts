import { RecursiveChunk } from './recursive';

/** Interface for LateChunk data */
interface LateChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  embedding?: number[];
}

/** Class to represent the late chunk 
 * 
 * @class LateChunk
 */
export class LateChunk extends RecursiveChunk {
  /** The embedding of the chunk */
  public embedding?: number[];

  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    embedding?: number[];
  }) {
    super(data);
    this.embedding = data.embedding ?? undefined;
  }

  /**
   * Return a string representation of the LateChunk
   *
   * @returns {string} The string representation of the LateChunk.
   */
  public toString(): string {
    return `LateChunk(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, embedding=${this.embedding})`;
  }

  /**
   * Return the LateChunk as a dictionary-like object
   *
   * @returns {LateChunkData} The dictionary-like object.
   */
  public toDict(): LateChunkData {
    return {
      text: this.text,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      tokenCount: this.tokenCount,
      embedding: this.embedding,
    };
  }


  /**
   * Create a LateChunk object from a dictionary-like object.
   *
   * @param {LateChunkData} data - The dictionary-like object.
   * @returns {LateChunk} The LateChunk object.
   */
  public static fromDict(data: LateChunkData): LateChunk {
    return new LateChunk({
      text: data.text,
      startIndex: data.startIndex,
      endIndex: data.endIndex,
      tokenCount: data.tokenCount,
      embedding: data.embedding,
    });
  }
} 