import { Chunk } from './base';


// TODO: Figure out a way for the SentenceChunk to be able to visualize the sentence in the chunk when a console.log is called — for some reason it just shows up as [Sentence] right now. 

/**
 * Represents the essential data for a sentence within a text.
 *
 * @property text - The actual sentence string as it appears in the source text.
 * @property startIndex - The zero-based index indicating where the sentence starts in the original text.
 * @property endIndex - The zero-based index indicating where the sentence ends in the original text (inclusive).
 * @property tokenCount - The number of tokens (words or subwords) in the sentence, useful for NLP tasks.
 */
export interface SentenceData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
}

/**
 * Class to represent a sentence.
 *
 * Represents a single sentence within a text, including its text, position, and token count.
 *
 * @class
 * @param {SentenceData} data - The data required to construct a Sentence instance.
 * @property {string} text - The text of the sentence.
 * @property {number} startIndex - The starting index of the sentence in the original text.
 * @property {number} endIndex - The ending index of the sentence in the original text.
 * @property {number} tokenCount - The number of tokens in the sentence.
 *
 * @method toString Returns a string representation of the Sentence.
 * @returns {string}
 *
 * @method toDict Returns the Sentence as a dictionary-like object.
 * @returns {SentenceData}
 *
 * @method static fromDict Creates a Sentence object from a dictionary-like object.
 * @param {SentenceData} data - The data to create the Sentence from.
 * @returns {Sentence}
 */
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

/**
 * Represents the essential data for a chunk of sentences within a text.
 *
 * @property text - The combined text of all sentences in the chunk as it appears in the source text.
 * @property startIndex - The zero-based index indicating where the chunk starts in the original text.
 * @property endIndex - The zero-based index indicating where the chunk ends in the original text (inclusive).
 * @property tokenCount - The total number of tokens (words or subwords) in the chunk, useful for NLP tasks.
 * @property sentences - An array of SentenceData objects, each representing an individual sentence within the chunk.
 */
interface SentenceChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  sentences: SentenceData[];
}

/**
 * Represents a chunk of one or more sentences within a text.
 *
 * A SentenceChunk groups together multiple {@link Sentence} objects, providing their combined text, position, and token count within the original text.
 *
 * @class
 * @extends Chunk
 *
 * @param {Object} data - Data to construct a SentenceChunk instance.
 * @param {string} data.text - Combined text of all sentences in the chunk.
 * @param {number} data.startIndex - Zero-based index where the chunk starts in the original text.
 * @param {number} data.endIndex - Zero-based index where the chunk ends in the original text (inclusive).
 * @param {number} data.tokenCount - Total number of tokens in the chunk.
 * @param {Sentence[]} data.sentences - Array of {@link Sentence} objects in the chunk.
 *
 * @property {string} text - Combined text of all sentences in the chunk.
 * @property {number} startIndex - Starting index of the chunk in the original text.
 * @property {number} endIndex - Ending index of the chunk in the original text.
 * @property {number} tokenCount - Total number of tokens in the chunk.
 * @property {Sentence[]} sentences - List of {@link Sentence} objects in the chunk.
 *
 * @method toString Returns a detailed string representation of the SentenceChunk, including its text, start and end indices, token count, and a list of all contained sentences with their metadata.
 * @method toDict Returns the SentenceChunk as a plain object (see {@link SentenceChunkData}).
 * @method static fromDict Creates a SentenceChunk from a {@link SentenceChunkData} object.
 */
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

  /**
   * Returns a detailed string representation of the SentenceChunk, including its text, start and end indices, token count, and a list of all contained sentences with their metadata.
   *
   * This method overrides the base {@link Chunk} toString method to provide a more informative output, which is especially useful for debugging and logging. Each sentence in the chunk is represented using its own toString method, and all sentences are included in the output.
   *
   * @returns {string} A string describing the SentenceChunk and all its sentences, e.g.,
   *   SentenceChunk(text=..., startIndex=..., endIndex=..., tokenCount=..., sentences=[Sentence(...), ...])
   */
  public toString(): string {
    const sentencesStr = this.sentences.map(s => s.toString()).join(', ');
    return `SentenceChunk(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, sentences=[${sentencesStr}])`;
  }

  /**
   * Returns the SentenceChunk as a dictionary-like object.
   *
   * This method extends the base {@link Chunk} toDict method to include the sentences in the chunk.
   *
   * @returns {SentenceChunkData} A dictionary-like object containing the chunk's text, start and end indices, token count, and an array of sentence data.
  /** Return the SentenceChunk as a dictionary-like object */
  public toDict(): SentenceChunkData {
    const baseDict = super.toDict();
    return {
      ...baseDict,
      sentences: this.sentences.map(sentence => sentence.toDict()),
    };
  }

  /**
   * Creates a SentenceChunk object from a dictionary-like object.
   *
   * This method extends the base {@link Chunk} fromDict method to include the sentences in the chunk.
   *
   * @param {SentenceChunkData} data - A dictionary-like object containing the chunk's text, start and end indices, token count, and an array of sentence data.
   * @returns {SentenceChunk} A new SentenceChunk object created from the provided dictionary-like object.
   */
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