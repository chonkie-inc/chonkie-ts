/**
 * Result of an embedding operation.
 */
export interface EmbeddingResult {
  /** The embedding vector */
  embedding: number[];
  /** Optional metadata about the embedding */
  metadata?: {
    /** The model used to generate the embedding */
    model?: string;
    /** The number of tokens in the input text */
    tokenCount?: number;
    /** Any other metadata */
    [key: string]: any;
  };
}

/**
 * Options for embedding operations.
 */
export interface EmbeddingOptions {
  /** The model to use for embedding */
  model?: string;
  /** Whether to normalize the embeddings */
  normalize?: boolean;
  /** Maximum sequence length */
  maxLength?: number;
  /** Any other options */
  [key: string]: any;
} 