import { Chunk } from './base';

/** Type for include delimiter options */
type IncludeDelim = 'prev' | 'next';

/** Interface for RecursiveLevel data */
interface RecursiveLevelData {
  delimiters?: string | string[];
  whitespace?: boolean;
  includeDelim?: IncludeDelim;
}

/** Class to represent recursive chunking rules at a specific level */
export class RecursiveLevel {
  /** Custom delimiters for chunking */
  public delimiters?: string | string[];
  /** Whether to use whitespace as a delimiter */
  public whitespace: boolean;
  /** Whether to include the delimiter in the previous or next chunk */
  public includeDelim: IncludeDelim;

  constructor(data: RecursiveLevelData = {}) {
    this.delimiters = data.delimiters;
    this.whitespace = data.whitespace ?? false;
    this.includeDelim = data.includeDelim ?? 'prev';

    this.validate();
  }

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

  /** Return a string representation of the RecursiveLevel */
  public toString(): string {
    return `RecursiveLevel(delimiters=${this.delimiters}, whitespace=${this.whitespace}, includeDelim=${this.includeDelim})`;
  }

  /** Return the RecursiveLevel as a dictionary-like object */
  public toDict(): RecursiveLevelData {
    return {
      delimiters: this.delimiters,
      whitespace: this.whitespace,
      includeDelim: this.includeDelim,
    };
  }

  /** Create RecursiveLevel object from a dictionary */
  public static fromDict(data: RecursiveLevelData): RecursiveLevel {
    return new RecursiveLevel(data);
  }

  /** Create RecursiveLevel object from a recipe */
  public static async fromRecipe(name: string, lang: string = 'en'): Promise<RecursiveLevel> {
    // TODO: Implement Hubbie integration
    throw new Error('Not implemented');
  }
}

/** Interface for RecursiveRules data */
interface RecursiveRulesData {
  levels?: RecursiveLevelData[];
}

/** Class to represent recursive chunking rules */
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

  /** Return a string representation of the RecursiveRules */
  public toString(): string {
    return `RecursiveRules(levels=${this.levels})`;
  }

  /** Return the number of levels */
  public get length(): number {
    return this.levels.length;
  }

  /** Get a level by index */
  public getLevel(index: number): RecursiveLevel | undefined {
    return this.levels[index];
  }

  /** Return an iterator over the levels */
  public [Symbol.iterator](): Iterator<RecursiveLevel> {
    return this.levels[Symbol.iterator]();
  }

  /** Create a RecursiveRules object from a dictionary */
  public static fromDict(data: RecursiveRulesData): RecursiveRules {
    return new RecursiveRules(data);
  }

  /** Return the RecursiveRules as a dictionary-like object */
  public toDict(): RecursiveRulesData {
    return {
      levels: this.levels.map(level => level.toDict()),
    };
  }

  /** Create a RecursiveRules object from a recipe */
  public static async fromRecipe(
    name: string = 'default',
    lang: string = 'en',
    path?: string
  ): Promise<RecursiveRules> {
    // TODO: Implement Hubbie integration
    throw new Error('Not implemented');
  }
}

/** Interface for RecursiveChunk data */
interface RecursiveChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  level?: number;
}

/** Class to represent recursive chunks */
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

  /** Return a string representation of the RecursiveChunk */
  public toString(): string {
    return `RecursiveChunk(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, level=${this.level})`;
  }

  /** Return the RecursiveChunk as a dictionary-like object */
  public toDict(): RecursiveChunkData {
    const baseDict = super.toDict();
    return {
      ...baseDict,
      level: this.level,
    };
  }

  /** Create a RecursiveChunk object from a dictionary */
  public static fromDict(data: RecursiveChunkData): RecursiveChunk {
    return new RecursiveChunk(data);
  }
} 