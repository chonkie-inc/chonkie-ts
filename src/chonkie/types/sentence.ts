import { Chunk } from './base';

/** Interface for Sentence data */
interface SentenceData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
}

/** Class to represent a sentence */
export class Sentence {
  /** The text of the sentence */
  public text: string;
  /** The starting index of the sentence in the original text */
  public startIndex: number;
  /** The ending index of the sentence in the original text */
  public endIndex: number;
  /** The number of tokens in the sentence */
  public tokenCount: number;

  constructor(data: SentenceData) {
    this.text = data.text;
    this.startIndex = data.startIndex;
    this.endIndex = data.endIndex;
    this.tokenCount = data.tokenCount;

    this.validate();
  }

  private validate(): void {
    if (typeof this.text !== 'string') {
      throw new Error('Text must be a string.');
    }
    if (!Number.isInteger(this.startIndex) || this.startIndex < 0) {
      throw new Error('Start index must be a non-negative integer.');
    }
    if (!Number.isInteger(this.endIndex) || this.endIndex < 0) {
      throw new Error('End index must be a non-negative integer.');
    }
    if (this.startIndex > this.endIndex) {
      throw new Error('Start index must be less than end index.');
    }
    if (!Number.isInteger(this.tokenCount) || this.tokenCount < 0) {
      throw new Error('Token count must be a non-negative integer.');
    }
  }

  /** Return a string representation of the Sentence */
  public toString(): string {
    return `Sentence(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount})`;
  }

  /** Return the Sentence as a dictionary-like object */
  public toDict(): SentenceData {
    return {
      text: this.text,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      tokenCount: this.tokenCount,
    };
  }

  /** Create a Sentence object from a dictionary-like object */
  public static fromDict(data: SentenceData): Sentence {
    return new Sentence(data);
  }
}

/** Interface for SentenceChunk data */
interface SentenceChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  sentences: SentenceData[];
}

/** Class to represent sentence chunks */
export class SentenceChunk extends Chunk {
  /** List of sentences in the chunk */
  public sentences: Sentence[];

  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    sentences: Sentence[];
  }) {
    super(data);
    this.sentences = data.sentences;
  }

  /** Return a string representation of the SentenceChunk */
  public toString(): string {
    return `SentenceChunk(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, sentences=${this.sentences})`;
  }

  /** Return the SentenceChunk as a dictionary-like object */
  public toDict(): SentenceChunkData {
    const baseDict = super.toDict();
    return {
      ...baseDict,
      sentences: this.sentences.map(sentence => sentence.toDict()),
    };
  }

  /** Create a SentenceChunk from dictionary */
  public static fromDict(data: SentenceChunkData): SentenceChunk {
    const sentences = data.sentences.map(sentence => Sentence.fromDict(sentence));
    return new SentenceChunk({
      text: data.text,
      startIndex: data.startIndex,
      endIndex: data.endIndex,
      tokenCount: data.tokenCount,
      sentences,
    });
  }
} 