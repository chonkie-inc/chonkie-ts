import { Chunk } from './base';

/** Interface for tree-sitter Node */
export interface TreeSitterNode {
  // This will be defined by tree-sitter when imported
  [key: string]: any;
}

/** Interface for CodeChunk data */
interface CodeChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  lang?: string;
  nodes?: TreeSitterNode[];
}

/** Class to represent code chunks with metadata */
export class CodeChunk extends Chunk {
  /** The programming language of the code */
  public lang?: string;
  /** The tree-sitter AST nodes in the chunk */
  public nodes?: TreeSitterNode[];

  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    lang?: string;
    nodes?: TreeSitterNode[];
  }) {
    super(data);
    this.lang = data.lang;
    this.nodes = data.nodes;
  }

  /** Return a string representation of the CodeChunk */
  public toString(): string {
    return `CodeChunk(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, lang=${this.lang}, nodes=${this.nodes})`;
  }

  /** Return the CodeChunk as a dictionary-like object */
  public toDict(): CodeChunkData {
    const baseDict = super.toDict();
    return {
      ...baseDict,
      lang: this.lang,
      nodes: this.nodes,
    };
  }

  /** Create a CodeChunk object from a dictionary */
  public static fromDict(data: CodeChunkData): CodeChunk {
    return new CodeChunk(data);
  }
} 