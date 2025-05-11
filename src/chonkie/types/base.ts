/** Custom base types for Chonkie. */

/**
 * Represents the data structure for a context object.
 * 
 * @property {string} text - The text of the chunk.
 * @property {number} tokenCount - The number of tokens in the chunk.
 * @property {number} [startIndex] - The starting index of the chunk in the original text.
 * @property {number} [endIndex] - The ending index of the chunk in the original text.
 */
interface ContextData {
  text: string;
  tokenCount: number;
  startIndex?: number;
  endIndex?: number;
}

/**
 * Represents a context object that contains information about a text chunk.
 * 
 * @property {string} text - The text of the chunk.
 * @property {number} tokenCount - The number of tokens in the chunk.
 * @property {number} [startIndex] - The starting index of the chunk in the original text.
 * @property {number} [endIndex] - The ending index of the chunk in the original text.
 */
export class Context {
  /** The text of the chunk. */
  public text: string;
  /** The number of tokens in the chunk. */
  public tokenCount: number;
  /** The starting index of the chunk in the original text. */
  public startIndex?: number;
  /** The ending index of the chunk in the original text. */
  public endIndex?: number;

  constructor(data: ContextData) {
    this.text = data.text;
    this.tokenCount = data.tokenCount;
    this.startIndex = data.startIndex;
    this.endIndex = data.endIndex;

    this.validate();
  }

  /**
   * Validates the context object.
   * 
   * @throws {Error} If the text is not a string, the token count is negative,
   *   the start index is negative, the end index is negative, or the start index
   *   is greater than the end index. 
   */
  private validate(): void {
    if (typeof this.text !== 'string') {
      throw new Error('Text must be a string.');
    }
    if (this.tokenCount !== undefined && this.tokenCount < 0) {
      throw new Error('Token count must be a non-negative integer.');
    }
    if (this.startIndex !== undefined && this.startIndex < 0) {
      throw new Error('Start index must be a non-negative integer.');
    }
    if (this.endIndex !== undefined && this.endIndex < 0) {
      throw new Error('End index must be a non-negative integer.');
    }
    if (
      this.startIndex !== undefined &&
      this.endIndex !== undefined &&
      this.startIndex > this.endIndex
    ) {
      throw new Error('Start index must be less than or equal to end index.');
    }
  }

  /** Return the length of the text. 
   * 
   * @returns {number} The length of the text.
   */
  public get length(): number {
    return this.text.length;
  }

  /** Return a string representation of the Context. 
   * 
   * @returns {string} The text of the context.
   */
  public toString(): string {
    return this.text;
  }

  /** Return a detailed string representation of the Context. 
   * 
   * @returns {string} The detailed string representation of the Context.
   */
  public toRepresentation(): string {
    return `Context(text='${this.text}', tokenCount=${this.tokenCount}, startIndex=${this.startIndex}, endIndex=${this.endIndex})`;
  }

  /** Return the Context as a dictionary-like object. 
   * 
   * @returns {ContextData} The dictionary-like object.
   */
  public toDict(): ContextData {
    return {
      text: this.text,
      tokenCount: this.tokenCount,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
    };
  }

  /** Create a Context object from a dictionary-like object. 
   * 
   * @param {ContextData} data - The dictionary-like object.
   * @returns {Context} The Context object.
   */
  public static fromDict(data: ContextData): Context {
    return new Context(data);
  }
}

/**
 * Represents the data structure for a chunk object.
 * 
 * @property {string} text - The text of the chunk.
 * @property {number} startIndex - The starting index of the chunk in the original text.
 * @property {number} endIndex - The ending index of the chunk in the original text.
 * @property {number} tokenCount - The number of tokens in the chunk.
 * @property {ContextData} [context] - The context metadata for the chunk.
 */
interface ChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  context?: ContextData;
}

/**
 * Represents a chunk of text with associated metadata.
 * 
 * @property {string} text - The text of the chunk.
 * @property {number} startIndex - The starting index of the chunk in the original text.
 * @property {number} endIndex - The ending index of the chunk in the original text.
 * @property {number} tokenCount - The number of tokens in the chunk.
 * @property {Context} [context] - The context metadata for the chunk.
 */
export class Chunk {
  /** The text of the chunk. */
  public text: string;
  /** The starting index of the chunk in the original text. */
  public startIndex: number;
  /** The ending index of the chunk in the original text. */
  public endIndex: number;
  /** The number of tokens in the chunk. */
  public tokenCount: number;
  /** Optional context metadata for the chunk. */
  public context?: Context;

  /**
   * Constructs a new Chunk object.
   * 
   * @param {ChunkData} data - The data to construct the Chunk from.
   */
  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    context?: Context;
  }) {
    this.text = data.text;
    this.startIndex = data.startIndex;
    this.endIndex = data.endIndex;
    this.tokenCount = data.tokenCount;
    this.context = data.context;

    // Basic validation, more can be added if needed
    if (this.startIndex > this.endIndex) {
        throw new Error("Start index must be less than or equal to end index.");
    }
    if (this.tokenCount < 0) {
        throw new Error("Token count must be a non-negative integer.");
    }
  }

  /** Return the length of the text. 
   * 
   * @returns {number} The length of the text.
   */
  public get length(): number {
    return this.text.length;
  }

  /** Return a string representation of the Chunk. 
   * 
   * @returns {string} The text of the chunk.
   */
  public toString(): string {
    return this.text;
  }

  /** Return a detailed string representation of the Chunk. 
   * 
   * @returns {string} The detailed string representation of the Chunk.
   */
  public toRepresentation(): string {
    let repr = `Chunk(text='${this.text}', tokenCount=${this.tokenCount}, startIndex=${this.startIndex}, endIndex=${this.endIndex}`;
    if (this.context) {
      repr += `, context=${this.context.toRepresentation()})`;
    } else {
      repr += ')';
    }
    return repr;
  }

  /** Return an iterator over the chunk's text. 
   * 
   * @returns {IterableIterator<string>} The iterator over the chunk's text.
   */
  public *[Symbol.iterator](): IterableIterator<string> {
    for (let i = 0; i < this.text.length; i++) {
      yield this.text[i];
    }
  }

  /** Return a slice of the chunk's text. 
   * 
   * @param {number} [start] - The starting index of the slice.
   * @param {number} [end] - The ending index of the slice.
   * @returns {string} The slice of the chunk's text.
   */
  public slice(start?: number, end?: number): string {
    return this.text.slice(start, end);
  }

  /** Return the Chunk as a dictionary-like object. 
   * 
   * @returns {ChunkData} The dictionary-like object.
   */
  public toDict(): ChunkData {
    return {
      text: this.text,
      startIndex: this.startIndex,
      endIndex: this.endIndex,
      tokenCount: this.tokenCount,
      context: this.context ? this.context.toDict() : undefined,
    };
  }

  /** Create a Chunk object from a dictionary-like object. 
   * 
   * @param {ChunkData} data - The dictionary-like object.
   * @returns {Chunk} The Chunk object.
   */
  public static fromDict(data: ChunkData): Chunk {
    return new Chunk({
      text: data.text,
      startIndex: data.startIndex,
      endIndex: data.endIndex,
      tokenCount: data.tokenCount,
      context: data.context ? Context.fromDict(data.context) : undefined,
    });
  }

  /** Return a deep copy of the chunk. 
   * 
   * @returns {Chunk} The deep copy of the chunk.
   */
  public copy(): Chunk {
    return Chunk.fromDict(this.toDict());
  }
}
