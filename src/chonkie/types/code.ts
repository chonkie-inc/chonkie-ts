import { Chunk } from './base';

/** Interface for tree-sitter Node */
export interface TreeSitterNode {
  // This will be defined by tree-sitter when imported
  [key: string]: any;
}

/** Interface for CodeChunk data */
export interface CodeChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  nodes?: TreeSitterNode[];
  embedding?: number[];
}

/**
 * Class to represent code chunks with metadata.
 * Extends the base Chunk class.
 */
export class CodeChunk extends Chunk {
  /** The tree-sitter AST nodes in the chunk */
  public nodes?: TreeSitterNode[];

  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    nodes?: TreeSitterNode[];
    embedding?: number[];
  }) {
    super(data);
    this.nodes = data.nodes;
  }

  /** Return a string representation of the CodeChunk */
  public toString(): string {
    return `CodeChunk(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, nodes=${this.nodes})`;
  }

  /** Return the CodeChunk as a dictionary-like object */
  public toDict(): CodeChunkData {
    const baseDict = super.toDict();
    return {
      ...baseDict,
      nodes: this.nodes,
    };
  }

  /** Create a CodeChunk object from a dictionary */
  public static fromDict(data: CodeChunkData): CodeChunk {
    return new CodeChunk(data);
  }
}