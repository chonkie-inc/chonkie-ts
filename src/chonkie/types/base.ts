/** Custom base types for Chonkie. */

/**
 * Represents the data structure for a chunk object.
 * 
 * @property {string} text - The text of the chunk.
 * @property {number} startIndex - The starting index of the chunk in the original text.
 * @property {number} endIndex - The ending index of the chunk in the original text.
 * @property {number} tokenCount - The number of tokens in the chunk.
 */
interface ChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  embedding?: number[];
}

/**
 * Represents a chunk of text with associated metadata.
 * 
 * @property {string} text - The text of the chunk.
 * @property {number} startIndex - The starting index of the chunk in the original text.
 * @property {number} endIndex - The ending index of the chunk in the original text.
 * @property {number} tokenCount - The number of tokens in the chunk.
 * @property {number[]} [embedding] - The embedding for the chunk.
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
  /** Optional embedding for the chunk. */
  public embedding?: number[];

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
    embedding?: number[];
  }) {
    this.text = data.text;
    this.startIndex = data.startIndex;
    this.endIndex = data.endIndex;
    this.tokenCount = data.tokenCount;
    this.embedding = data.embedding;

    // Basic validation, more can be added if needed
    if (this.startIndex > this.endIndex) {
        throw new Error("Start index must be less than or equal to end index.");
    }
    if (this.tokenCount < 0) {
        throw new Error("Token count must be a non-negative integer.");
    }
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
    repr += ')';
    return repr;
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
      embedding: this.embedding,
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
      embedding: data.embedding,
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
