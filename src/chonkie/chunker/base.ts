import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";.

export abstract class BaseChunker {
  protected tokenizer: Tokenizer;
  protected _useConcurrency: boolean = true; // Determines if batch processing uses Promise.all

  constructor(tokenizer: Tokenizer) {
    this.tokenizer = tokenizer;
  }

  /**
   * Return a string representation of the chunker.
   */
  public toString(): string {
    return `${this.constructor.name}()`;
  }

  /**
   * Call the chunker with the given text or texts.
   * @param text The text to chunk.
   * @param showProgress Whether to show progress for batch operations.
   * @returns A list of Chunks or strings if input is a single string.
   *          A list of lists of Chunks or strings if input is a list of strings.
   */
  public async call(text: string, showProgress?: boolean): Promise<Chunk[] | string[]>;
  public async call(texts: string[], showProgress?: boolean): Promise<(Chunk[] | string[])[]>;
  public async call(
    textOrTexts: string | string[],
    showProgress: boolean = false
  ): Promise<(Chunk[] | string[]) | (Chunk[] | string[])[]> {
    if (typeof textOrTexts === 'string') {
      return this.chunk(textOrTexts);
    } else if (Array.isArray(textOrTexts)) {
      return this.chunkBatch(textOrTexts, showProgress);
    } else {
      // This case should ideally not be reached due to TypeScript's type checking
      // if the public overloads are used correctly.
      throw new Error("Input must be a string or an array of strings.");
    }
  }

  /**
   * Process a batch of texts sequentially.
   * @param texts The texts to chunk.
   * @param showProgress Whether to show progress.
   * @returns A list of lists of Chunks or strings.
   */
  protected async _sequential_batch_processing(
    texts: string[],
    showProgress: boolean = false
  ): Promise<(Chunk[] | string[])[]> {
    const results: (Chunk[] | string[])[] = [];
    const total = texts.length;
    for (let i = 0; i < total; i++) {
      if (showProgress && total > 1) {
        const progress = Math.round(((i + 1) / total) * 100);
        process.stdout.write(`Sequential processing: Document ${i + 1}/${total} (${progress}%)\r`);
      }
      results.push(await this.chunk(texts[i]));
    }
    if (showProgress && total > 1) {
      process.stdout.write("\n"); // Newline after progress
    }
    return results;
  }

  /**
   * Process a batch of texts concurrently using Promise.all.
   * @param texts The texts to chunk.
   * @param showProgress Whether to show progress.
   * @returns A list of lists of Chunks or strings.
   */
  protected async _concurrent_batch_processing(
    texts: string[],
    showProgress: boolean = false
  ): Promise<(Chunk[] | string[])[]> {
    const total = texts.length;
    let completedCount = 0;

    const updateProgress = () => {
      if (showProgress && total > 1) {
        completedCount++;
        const progress = Math.round((completedCount / total) * 100);
        process.stdout.write(`Concurrent processing: Document ${completedCount}/${total} (${progress}%)\r`);
      }
    };

    const chunkPromises = texts.map(text =>
      this.chunk(text).then(result => {
        updateProgress();
        return result;
      })
    );

    const results = await Promise.all(chunkPromises);
    if (showProgress && total > 1 && completedCount > 0) { // ensure newline only if progress was shown
      process.stdout.write("\n"); // Newline after progress
    }
    return results;
  }

  /**
   * Abstract method to chunk a single text. Must be implemented by subclasses.
   * @param text The text to chunk.
   * @returns A list of Chunks or a list of strings.
   */
  public abstract chunk(text: string): Promise<Chunk[] | string[]>;

  /**
   * Chunk a batch of texts.
   * @param texts The texts to chunk.
   * @param showProgress Whether to show progress.
   * @returns A list of lists of Chunks or a list of lists of strings.
   */
  public async chunkBatch(
    texts: string[],
    showProgress: boolean = true
  ): Promise<(Chunk[] | string[])[]> {
    if (texts.length === 0) {
      return [];
    }
    // If only one text, process it directly without batch overhead, progress not shown for single item.
    if (texts.length === 1) {
      return [await this.chunk(texts[0])];
    }

    // For multiple texts, use selected batch processing strategy
    if (this._useConcurrency) {
      return this._concurrent_batch_processing(texts, showProgress);
    } else {
      return this._sequential_batch_processing(texts, showProgress);
    }
  }
}
