import { Sentence, SentenceData } from './sentence';
import { SentenceChunk } from './sentence';

/**
 * Represents a semantic sentence with metadata, including an embedding.
 * Extends the base Sentence class.
 */
export interface SemanticSentenceData extends SentenceData {
  embedding?: number[] | null;
}

export class SemanticSentence extends Sentence {
  /** The embedding vector for the sentence (array of numbers, or null if not present) */
  public embedding: number[] | null;

  constructor(data: SemanticSentenceData) {
    super(data);
    this.embedding = data.embedding ?? null;
  }

  /** Return the SemanticSentence as a dictionary-like object */
  public toDict(): SemanticSentenceData {
    return { ...super.toDict(), embedding: this.embedding ?? null };
  }

  /** Create a SemanticSentence object from a dictionary */
  public static fromDict(data: SemanticSentenceData): SemanticSentence {
    // Defensive copy to avoid mutating input
    const { embedding, ...rest } = data;
    return new SemanticSentence({ ...rest, embedding: embedding ?? null });
  }

  /** Return a string representation of the SemanticSentence */
  public toString(): string {
    return `SemanticSentence(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, embedding=${JSON.stringify(this.embedding)})`;
  }
}

/**
 * Represents a semantic chunk with metadata, including a list of semantic sentences.
 * Extends the base SentenceChunk class.
 */
export interface SemanticChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  sentences: SemanticSentenceData[];
}

export class SemanticChunk extends SentenceChunk {
  /** List of SemanticSentence objects in the chunk */
  public sentences: SemanticSentence[];

  constructor(data: SemanticChunkData & { sentences: SemanticSentence[] }) {
    super({
      text: data.text,
      startIndex: data.startIndex,
      endIndex: data.endIndex,
      tokenCount: data.tokenCount,
      sentences: data.sentences,
    });
    this.sentences = data.sentences;
  }

  /** Return the SemanticChunk as a dictionary-like object */
  public toDict(): SemanticChunkData {
    const base = super.toDict() as SemanticChunkData;
    return {
      ...base,
      sentences: this.sentences.map((s) => s.toDict()),
    };
  }

  /** Create a SemanticChunk object from a dictionary */
  public static fromDict(data: SemanticChunkData): SemanticChunk {
    const { sentences, ...rest } = data;
    const semanticSentences = sentences.map((s) => SemanticSentence.fromDict(s));
    return new SemanticChunk({ ...rest, sentences: semanticSentences });
  }

  /** Return a string representation of the SemanticChunk */
  public toString(): string {
    return `SemanticChunk(text=${this.text}, startIndex=${this.startIndex}, endIndex=${this.endIndex}, tokenCount=${this.tokenCount}, sentences=${JSON.stringify(this.sentences)})`;
  }
}
