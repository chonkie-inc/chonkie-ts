/** Module containing CodeChunker class. */

import { Tokenizer } from "../tokenizer";
import { Chunk } from "../types/base";
import { CodeChunk, TreeSitterNode } from "../types/code";
import { BaseChunker } from "./base";
import Parser from "tree-sitter";
import { Language } from "tree-sitter";

/**
 * Options for creating a CodeChunker instance.
 */
export interface CodeChunkerOptions {
  tokenizerOrName?: string | Tokenizer;
  chunkSize?: number;
  returnType?: "chunks" | "texts";
  lang?: string;
  includeNodes?: boolean;
}

/**
 * Represents a CodeChunker instance that is also directly callable.
 * Calling it executes its `call` method (from BaseChunker), which
 * in turn calls `chunk` or `chunkBatch`.
 */
export type CallableCodeChunker = CodeChunker & {
  (text: string, showProgress?: boolean): Promise<Chunk[] | string[]>;
  (texts: string[], showProgress?: boolean): Promise<(Chunk[] | string[])[]>;
};

export class CodeChunker extends BaseChunker {
  public readonly chunkSize: number;
  public readonly returnType: "chunks" | "texts";
  public readonly lang?: string;
  public readonly includeNodes: boolean;
  private parser: Parser | null = null;
  private language: Language | undefined = undefined;

  /**
   * Private constructor. Use `CodeChunker.create()` to instantiate.
   */
  private constructor(
    tokenizer: Tokenizer,
    chunkSize: number,
    returnType: "chunks" | "texts",
    lang?: string,
    includeNodes: boolean = false
  ) {
    super(tokenizer);

    if (chunkSize <= 0) {
      throw new Error("chunkSize must be greater than 0");
    }
    if (returnType !== "chunks" && returnType !== "texts") {
      throw new Error("returnType must be either 'chunks' or 'texts'");
    }

    this.chunkSize = chunkSize;
    this.returnType = returnType;
    this.lang = lang;
    this.includeNodes = includeNodes;
  }

  /**
   * Creates and initializes a CodeChunker instance that is directly callable.
   */
  public static async create(options: CodeChunkerOptions = {}): Promise<CallableCodeChunker> {
    const {
      tokenizerOrName = "gpt2",
      chunkSize = 512,
      returnType = "chunks",
      lang,
      includeNodes = false
    } = options;

    let tokenizerInstance: Tokenizer;
    if (typeof tokenizerOrName === 'string') {
      tokenizerInstance = await Tokenizer.create(tokenizerOrName);
    } else {
      tokenizerInstance = tokenizerOrName;
    }

    const plainInstance = new CodeChunker(
      tokenizerInstance,
      chunkSize,
      returnType,
      lang,
      includeNodes
    );

    // Create the callable function wrapper
    const callableFn = function(
      this: CallableCodeChunker,
      textOrTexts: string | string[],
      showProgress?: boolean
    ) {
      if (typeof textOrTexts === 'string') {
        return plainInstance.call(textOrTexts, showProgress);
      } else {
        return plainInstance.call(textOrTexts, showProgress);
      }
    };

    // Set the prototype so that 'instanceof CodeChunker' works
    Object.setPrototypeOf(callableFn, CodeChunker.prototype);

    // Copy all enumerable own properties from plainInstance to callableFn
    Object.assign(callableFn, plainInstance);

    return callableFn as unknown as CallableCodeChunker;
  }

  /**
   * Initialize the tree-sitter parser for the given language.
   */
  private async _initParser(lang: string): Promise<void> {
    if (this.parser && this.language) {
      return;
    }

    try {
      // Dynamically import the language module
      const langModule = await import(`tree-sitter-${lang.toLowerCase()}`);
      this.language = langModule.default;
      this.parser = new Parser();
      this.parser.setLanguage(this.language);
    } catch (error) {
      throw new Error(`Failed to initialize tree-sitter parser for language ${lang}: ${error}`);
    }
  }

  /**
   * Merge node groups together.
   */
  private _mergeNodeGroups(nodeGroups: TreeSitterNode[][]): TreeSitterNode[] {
    return nodeGroups.flat();
  }

  /**
   * Group child nodes based on their token counts.
   */
  private async _groupChildNodes(node: TreeSitterNode): Promise<[TreeSitterNode[][], number[]]> {
    if (!node.children || node.children.length === 0) {
      return [[], []];
    }

    const nodeGroups: TreeSitterNode[][] = [];
    const groupTokenCounts: number[] = [];
    let currentTokenCount = 0;
    let currentNodeGroup: TreeSitterNode[] = [];

    for (const child of node.children) {
      const childText = child.text;
      const tokenCount = await this.tokenizer.countTokens(childText);

      if (tokenCount > this.chunkSize) {
        if (currentNodeGroup.length > 0) {
          nodeGroups.push(currentNodeGroup);
          groupTokenCounts.push(currentTokenCount);
          currentNodeGroup = [];
          currentTokenCount = 0;
        }

        const [childGroups, childTokenCounts] = await this._groupChildNodes(child);
        nodeGroups.push(...childGroups);
        groupTokenCounts.push(...childTokenCounts);
      } else if (currentTokenCount + tokenCount > this.chunkSize) {
        nodeGroups.push(currentNodeGroup);
        groupTokenCounts.push(currentTokenCount);
        currentNodeGroup = [child];
        currentTokenCount = tokenCount;
      } else {
        currentNodeGroup.push(child);
        currentTokenCount += tokenCount;
      }
    }

    if (currentNodeGroup.length > 0) {
      nodeGroups.push(currentNodeGroup);
      groupTokenCounts.push(currentTokenCount);
    }

    // Calculate cumulative token counts for optimal grouping
    const cumulativeTokenCounts = [0];
    for (const count of groupTokenCounts) {
      cumulativeTokenCounts.push(cumulativeTokenCounts[cumulativeTokenCounts.length - 1] + count);
    }

    // Merge groups optimally using binary search
    const mergedNodeGroups: TreeSitterNode[][] = [];
    const mergedTokenCounts: number[] = [];
    let pos = 0;

    while (pos < nodeGroups.length) {
      const startCumulativeCount = cumulativeTokenCounts[pos];
      const requiredCumulativeTarget = startCumulativeCount + this.chunkSize;

      // Find the optimal split point using binary search
      let index = this._bisectLeft(cumulativeTokenCounts, requiredCumulativeTarget, pos) - 1;
      index = Math.min(index, nodeGroups.length);

      // Handle edge cases
      if (index === pos) {
        index = pos + 1;
      }

      // Merge the groups
      const groupsToMerge = nodeGroups.slice(pos, index);
      mergedNodeGroups.push(this._mergeNodeGroups(groupsToMerge));

      // Calculate the actual token count for this merged group
      const actualMergedCount = cumulativeTokenCounts[index] - cumulativeTokenCounts[pos];
      mergedTokenCounts.push(actualMergedCount);

      pos = index;
    }

    return [mergedNodeGroups, mergedTokenCounts];
  }

  /**
   * Binary search to find the first index where the value is greater than or equal to the target.
   */
  private _bisectLeft(arr: number[], target: number, lo: number = 0): number {
    let hi = arr.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (arr[mid] < target) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }
    return lo;
  }

  /**
   * Get texts from node groups using original byte offsets.
   */
  private _getTextsFromNodeGroups(
    nodeGroups: TreeSitterNode[][],
    originalTextBytes: Buffer
  ): string[] {
    const chunkTexts: string[] = [];

    for (let i = 0; i < nodeGroups.length; i++) {
      const group = nodeGroups[i];
      if (!group.length) continue;

      const startNode = group[0];
      const endNode = group[group.length - 1];
      let startByte = startNode.startIndex;
      let endByte = endNode.endIndex;

      if (startByte > endByte) {
        console.warn(`Warning: Skipping group due to invalid byte order. Start: ${startByte}, End: ${endByte}`);
        continue;
      }

      if (startByte < 0 || endByte > originalTextBytes.length) {
        console.warn(`Warning: Skipping group due to out-of-bounds byte offsets. Start: ${startByte}, End: ${endByte}, Text Length: ${originalTextBytes.length}`);
        continue;
      }

      if (i < nodeGroups.length - 1) {
        endByte = nodeGroups[i + 1][0].startIndex;
      }

      try {
        const chunkBytes = originalTextBytes.slice(startByte, endByte);
        const text = chunkBytes.toString('utf-8');
        chunkTexts.push(text);
      } catch (error) {
        console.warn(`Warning: Error decoding bytes for chunk (${startByte}-${endByte}): ${error}`);
        chunkTexts.push("");
      }
    }

    // Add any missing bytes at the start and end
    if (nodeGroups[0]?.[0]?.startIndex > 0) {
      const initialBytes = originalTextBytes.slice(0, nodeGroups[0][0].startIndex);
      chunkTexts[0] = initialBytes.toString('utf-8') + chunkTexts[0];
    }

    const lastGroup = nodeGroups[nodeGroups.length - 1];
    if (lastGroup?.[lastGroup.length - 1]?.endIndex < originalTextBytes.length) {
      const remainingBytes = originalTextBytes.slice(lastGroup[lastGroup.length - 1].endIndex);
      chunkTexts[chunkTexts.length - 1] += remainingBytes.toString('utf-8');
    }

    return chunkTexts;
  }

  /**
   * Create CodeChunk objects from texts, token counts, and node groups.
   */
  private _createChunks(
    texts: string[],
    tokenCounts: number[],
    nodeGroups: TreeSitterNode[][]
  ): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    let currentIndex = 0;

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      const tokenCount = tokenCounts[i];
      const nodeGroup = this.includeNodes ? nodeGroups[i] : undefined;

      chunks.push(new CodeChunk({
        text,
        startIndex: currentIndex,
        endIndex: currentIndex + text.length,
        tokenCount,
        lang: this.lang,
        nodes: nodeGroup
      }));

      currentIndex += text.length;
    }

    return chunks;
  }

  /**
   * Recursively chunks the code based on context from tree-sitter.
   */
  public async chunk(text: string): Promise<Chunk[] | string[]> {
    if (!text.trim()) {
      return [];
    }

    const originalTextBytes = Buffer.from(text, 'utf-8');

    if (!this.lang) {
      throw new Error("Language must be specified for code chunking");
    }

    await this._initParser(this.lang);

    if (!this.parser) {
      throw new Error("Parser not initialized");
    }

    let tree: Parser.Tree | null = null;
    try {
      tree = this.parser.parse(originalTextBytes.toString());
      const rootNode = tree.rootNode;

      const [nodeGroups, tokenCounts] = await this._groupChildNodes(rootNode);
      const texts = this._getTextsFromNodeGroups(nodeGroups, originalTextBytes);

      if (this.returnType === "texts") {
        return texts;
      } else {
        return this._createChunks(texts, tokenCounts, nodeGroups);
      }
    } finally {
      // No need to explicitly delete the tree - it will be garbage collected
      if (!this.includeNodes) {
        tree = null;
      }
    }
  }

  /**
   * Return a string representation of the CodeChunker.
   */
  public toString(): string {
    return `CodeChunker(tokenizer=${this.tokenizer}, ` +
      `chunkSize=${this.chunkSize}, ` +
      `returnType=${this.returnType}, ` +
      `lang=${this.lang}, ` +
      `includeNodes=${this.includeNodes})`;
  }
} 