import { Chunk } from './base';

/** Type for include delimiter options 
 * 
 * @enum {string}
 */
type IncludeDelim = 'prev' | 'next';

/** Interface for RecursiveLevel data
 * 
 * @interface RecursiveLevelData
 * @property {string | string[]} [delimiters] - The delimiters to use for chunking.
 * @property {boolean} [whitespace] - Whether to use whitespace as a delimiter.
 * @property {IncludeDelim} [includeDelim] - Whether to include the delimiter in the previous or next chunk.
 */
interface RecursiveLevelData {
  delimiters?: string | string[];
  whitespace?: boolean;
  includeDelim?: IncludeDelim;
}

/** Class to represent recursive chunking rules at a specific level
 * 
 * @class RecursiveLevel
 * @property {string | string[]} [delimiters] - The delimiters to use for chunking.
 * @property {boolean} [whitespace] - Whether to use whitespace as a delimiter.
 * @property {IncludeDelim} [includeDelim] - Whether to include the delimiter in the previous or next chunk.
 */
export class RecursiveLevel {
  /** Custom delimiters for chunking */
  public delimiters?: string | string[];
  /** Whether to use whitespace as a delimiter */
  public whitespace: boolean;
  /** Whether to include the delimiter in the previous or next chunk */
  public includeDelim: IncludeDelim;

  /**
   * Constructs a new RecursiveLevel object.
   * 
   * @param {RecursiveLevelData} data - The data to construct the RecursiveLevel from.
   */
  constructor(data: RecursiveLevelData = {}) {
    this.delimiters = data.delimiters;
    this.whitespace = data.whitespace ?? false;
    this.includeDelim = data.includeDelim ?? 'prev';

    this.validate();
  }

  /**
   * Validates the RecursiveLevel object.
   * 
   * @private
   */
  private validate(): void {
    if (this.delimiters !== undefined && this.whitespace) {
      throw new Error('Cannot use whitespace as a delimiter and also specify custom delimiters.');
    }
    if (this.delimiters !== undefined) {
      if (typeof this.delimiters === 'string' && this.delimiters.length === 0) {
        throw new Error('Custom delimiters cannot be an empty string.');
      }
      if (Array.isArray(this.delimiters)) {
        if (this.delimiters.some(delim => typeof delim !== 'string' || delim.length === 0)) {
          throw new Error('Custom delimiters cannot be an empty string.');
        }
        if (this.delimiters.includes(' ')) {
          throw new Error('Custom delimiters cannot be whitespace only. Set whitespace to true instead.');
        }
      }
    }
  }

  /** Return a string representation of the RecursiveLevel
   * 
   * @returns {string} The string representation of the RecursiveLevel.
   */
  public toString(): string {
    return `RecursiveLevel(delimiters=${this.delimiters}, whitespace=${this.whitespace}, includeDelim=${this.includeDelim})`;
  }

  /** Return the RecursiveLevel as a dictionary-like object
   * 
   * @returns {RecursiveLevelData} The dictionary-like object.
   */
  public toDict(): RecursiveLevelData {
    return {
      delimiters: this.delimiters,
      whitespace: this.whitespace,
      includeDelim: this.includeDelim,
    };
  }

  /** Create RecursiveLevel object from a dictionary
   * 
   * @param {RecursiveLevelData} data - The dictionary-like object.
   * @returns {RecursiveLevel} The RecursiveLevel object.
   */
  public static fromDict(data: RecursiveLevelData): RecursiveLevel {
    return new RecursiveLevel(data);
  }

  /** Create RecursiveLevel object from a recipe
   * 
   * @param {string} name - The name of the recipe.
   * @param {string} lang - The language of the recipe.
   * @returns {Promise<RecursiveLevel>} The RecursiveLevel object.
   */
  public static async fromRecipe(name: string, lang: string = 'en'): Promise<RecursiveLevel> {
    // TODO: Implement Hubbie integration
    throw new Error('Not implemented');
  }
}

/** Interface for RecursiveRules data
 * 
 * @interface RecursiveRulesData
 * @property {RecursiveLevelData[]} [levels] - The recursive levels.
 */
interface RecursiveRulesData {
  levels?: RecursiveLevelData[];
}

/** Class to represent recursive chunking rules
 * 
 * @class RecursiveRules
 * @property {RecursiveLevel[]} [levels] - The recursive levels.
 */
export class RecursiveRules {
  /** List of recursive levels */
  public levels: RecursiveLevel[];

  constructor(data: RecursiveRulesData = {}) {
    if (data.levels === undefined) {
      // Default levels
      const paragraphs = new RecursiveLevel({ delimiters: ['\n\n', '\r\n', '\n', '\r'] });
      const sentences = new RecursiveLevel({ delimiters: ['. ', '! ', '? '] });
      const pauses = new RecursiveLevel({
        delimiters: [
          '{', '}', '"', '[', ']', '<', '>', '(', ')', ':', ';', ',',
          '—', '|', '~', '-', '...', '`', "'",
        ],
      });
      const word = new RecursiveLevel({ whitespace: true });
      const token = new RecursiveLevel();
      this.levels = [paragraphs, sentences, pauses, word, token];
    } else {
      this.levels = data.levels.map(level => new RecursiveLevel(level));
    }
  }

  /** Return a string representation of the RecursiveRules
   * 
   * @returns {string} The string representation of the RecursiveRules.
   */
  public toString(): string {
    return `RecursiveRules(levels=${this.levels})`;
  }

  /** Return the number of levels
   * 
   * @returns {number} The number of levels.
   */
  public get length(): number {
    return this.levels.length;
  }

  /** Get a level by index
   * 
   * @param {number} index - The index of the level.
   * @returns {RecursiveLevel | undefined} The level.
   */
  public getLevel(index: number): RecursiveLevel | undefined {
    return this.levels[index];
  }

  /** Return an iterator over the levels
   * 
   * @returns {Iterator<RecursiveLevel>} The iterator over the levels.
   */
  public [Symbol.iterator](): Iterator<RecursiveLevel> {
    return this.levels[Symbol.iterator]();
  }

  /** Create a RecursiveRules object from a dictionary
   * 
   * @param {RecursiveRulesData} data - The dictionary-like object.
   * @returns {RecursiveRules} The RecursiveRules object.
   */
  public static fromDict(data: RecursiveRulesData): RecursiveRules {
    return new RecursiveRules(data);
  }

  /** Return the RecursiveRules as a dictionary-like object
   * 
   * @returns {RecursiveRulesData} The dictionary-like object.
   */
  public toDict(): RecursiveRulesData {
    return {
      levels: this.levels.map(level => level.toDict()),
    };
  }

  /** Create a RecursiveRules object from a recipe
   * 
   * @param {string} name - The name of the recipe.
   * @param {string} lang - The language of the recipe.
   * @param {string} path - The path to the recipe.
   * @returns {Promise<RecursiveRules>} The RecursiveRules object.
   */
  public static async fromRecipe(
    name: string = 'default',
    lang: string = 'en',
    path?: string
  ): Promise<RecursiveRules> {
    // TODO: Implement Hubbie integration
    throw new Error('Not implemented');
  }
}

/** Interface for RecursiveChunk data
 * 
 * @interface RecursiveChunkData
 * @property {string} text - The text of the chunk.
 * @property {number} startIndex - The starting index of the chunk.
 * @property {number} endIndex - The ending index of the chunk.
 * @property {number} tokenCount - The number of tokens in the chunk.
 * @property {number} [level] - The level of recursion for the chunk.
 */
interface RecursiveChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  level?: number;
}

/** Class to represent recursive chunks
 * 
 * @class RecursiveChunk
 * @property {number} [level] - The level of recursion for the chunk.
 */
export class RecursiveChunk extends Chunk {
  /** The level of recursion for the chunk */
  public level?: number;

  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    level?: number;
  }) {
    super(data);
    this.level = data.level;
  }

  /** Return a string representation of the RecursiveChunk
   * 
   * @returns {string} The string representation of the RecursiveChunk.
   */
  public toString(): string {
    return `RecursiveChunk(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, level=${this.level})`;
  }

  /** Return the RecursiveChunk as a dictionary-like object
   * 
   * @returns {RecursiveChunkData} The dictionary-like object.
   */
  public toDict(): RecursiveChunkData {
    const baseDict = super.toDict();
    return {
      ...baseDict,
      level: this.level,
    };
  }

  /** Create a RecursiveChunk object from a dictionary
   * 
   * @param {RecursiveChunkData} data - The dictionary-like object.
   * @returns {RecursiveChunk} The RecursiveChunk object.
   */
  public static fromDict(data: RecursiveChunkData): RecursiveChunk {
    return new RecursiveChunk(data);
  }
} 