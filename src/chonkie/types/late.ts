import { RecursiveChunk } from './recursive';
import { SentenceData } from './sentence';

/** Interface for LateChunk data */
interface LateChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  embedding?: number[];
  sentences?: SentenceData[];
}

/** Class to represent the late chunk */
export class LateChunk extends RecursiveChunk {
  /** The embedding of the chunk */
  public embedding?: number[];
  /** The sentences in the chunk */
  public sentences?: SentenceData[];

  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    embedding?: number[];
    sentences?: SentenceData[];
  }) {
    super(data);
    this.sentences = data.sentences;
    this.embedding = data.embedding ?? undefined;
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
      sentences: this.sentences,
    };
  }

  /** Create a LateChunk from a dictionary */
  public static fromDict(data: LateChunkData): LateChunk {
    return new LateChunk({
      text: data.text,
      startIndex: data.startIndex,
      endIndex: data.endIndex,
      tokenCount: data.tokenCount,
      embedding: data.embedding,
      sentences: data.sentences
    });
  }
} 