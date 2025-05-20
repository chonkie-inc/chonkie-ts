import { RecursiveChunk } from './recursive';

/** Interface for LateChunk data */
interface LateChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  embedding?: number[];
}

/** Class to represent the late chunk */
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
  }

  /** Return a string representation of the LateChunk */
  public toString(): string {
    return `LateChunk(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, embedding=${this.embedding})`;
  }

  /** Return the LateChunk as a dictionary-like object */
  public toDict(): LateChunkData {
    return {
      text: this.text,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      tokenCount: this.tokenCount,
      embedding: this.embedding,
    };
  }

  /** Create a LateChunk from a dictionary */
  public static fromDict(data: LateChunkData): LateChunk {
    return new LateChunk(data);
  }
} 