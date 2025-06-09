<div align="center">

## Chonkie-TS DOCS

</div>

> "WOAH! Chonkie's now in TypeScript! That's some type-shih right there."
> —— @chonknick, 2025

Hey there, fellow CHONK enthusiast! Welcome to the nitty-gritty details of `chonkie-ts`. This is where we spill all the tea about how `chonkie-ts` works under the hood, why we made certain design decisions, and how you can make the most of this chonky library. 

We've tried to keep things as clear and detailed as possible, but if you spot something missing or confusing, don't hesitate to raise an issue! After all, the best documentation is the one that grows with its community. 

So grab your favorite beverage, get comfy, and let's dive into the wonderful world of `chonkie-ts`! 🦛✨

## Table of Contents

- [Chonkie-TS DOCS](#chonkie-ts-docs)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Usage](#usage)
- [Chunkers](#chunkers)
  - [Available Chunkers](#available-chunkers)
  - [TokenChunker](#tokenchunker)
  - [SentenceChunker](#sentencechunker)
  - [RecursiveChunker](#recursivechunker)
  - [CodeChunker](#codechunker)
- [Associated Types](#associated-types)
  - [Chunk](#chunk)
  - [CodeChunk](#codechunk)
  - [TreeSitterNode](#treesitternode)
  - [Sentence](#sentence)
  - [SentenceChunk](#sentencechunk)
  - [RecursiveRules](#recursiverules)
  - [RecursiveLevel](#recursivelevel)
  - [RecursiveChunk](#recursivechunk)

## Installation

We've tried to maintain the user-experience of chonkie across platforms as much as possible. Just like in the original chonkie, you can install chonkie-ts using npm, via the following command:

```bash
npm i chonkie
```

## Usage

Here's how easy it is to use any chunker in `chonkie-ts`! All chunkers follow the same simple pattern: import, create, and call on your text. Below is an example using the `RecursiveChunker`:

```ts
import { RecursiveChunker } from "chonkie-ts";

// Create a chunker instance (async)
const chunker = await RecursiveChunker.create({ chunkSize: 256 });

// Chunk a single string
const chunks = await chunker("Some text to chunk!");
console.log(chunks); // Array of chunk objects or strings

// You can also chunk a batch of texts
const batchChunks = await chunker(["Text 1", "Text 2"]);
console.log(batchChunks); // Array of arrays
```

> [!NOTE]
> This pattern works for every chunker in `chonkie-ts`—just import, create, and call!

## Chunkers

Let's dive into the different chunkers that are available in `chonkie-ts`, and their respective parameters.

### Available Chunkers

Here's an overview of the chunkers that are currently implemented in `chonkie-ts`:

| Name | Description |
|------|-------------|
| `TokenChunker` | Splits text into fixed-size token chunks |
| `SentenceChunker` | Splits text into chunks based on sentences.  |
| `RecursiveChunker` | Splits text hierarchically using customizable rules to create semantically meaningful chunks. |

### TokenChunker

The `TokenChunker` splits text into fixed-size, optionally overlapping chunks based on token count. It is ideal for preparing text for models with token limits, or for consistent chunking across different texts.

**Parameters:**

- **tokenizer** (`string | Tokenizer`, optional):
  - The tokenizer to use for chunking. Can be a string (model name, e.g., `"Xenova/gpt2"`, default) or an initialized `Tokenizer` instance.
- **chunkSize** (`number`, optional):
  - The maximum number of tokens per chunk. Must be positive. Default: `512`.
- **chunkOverlap** (`number`, optional):
  - The number of tokens to overlap between chunks. Can be an absolute number (e.g., `16`) or a decimal between 0 and 1 (e.g., `0.1` for 10% overlap). Must be less than `chunkSize`. Default: `0`.
- **returnType** (`"chunks" | "texts"`, optional):
  - The type of output to return. `"chunks"` returns `Chunk` objects with metadata, while `"texts"` returns just the chunked text strings. Default: `"chunks"`.

**Methods:**

- **static async create(options: TokenChunkerOptions = {}): Promise<CallableTokenChunker>**
  - Creates and initializes a TokenChunker instance that is directly callable as a function.
  - Returns a callable chunker: `chunker(text: string | string[], showProgress?: boolean)`

- **chunk(text: string): Promise<Chunk[] | string[]>**
  - Splits a single text into overlapping token-based chunks.
  - Returns an array of `Chunk` objects (with metadata) or strings, depending on `returnType`.

- **chunkBatch(texts: string[], showProgress?: boolean): Promise<Array<Chunk[] | string[]>>**
  - Splits a batch of texts into token-based chunks.
  - Returns an array of arrays, each containing the chunks for a corresponding input text.

- **toString(): string**
  - Returns a string representation of the TokenChunker instance.

**Example Usage:**

<details>
<summary><strong>Basic Example: Chunk a Simple String</strong></summary>

```ts
import { TokenChunker } from "chonkie";

async function run() {
  const chunker = await TokenChunker.create({ chunkSize: 5, chunkOverlap: 2 });
  const text = "Hello, World! This is a simple text. I am testing the token chunker and seeing if it works.";
  const chunks = await chunker(text);
  console.log(chunks);
}

run();
```
</details>

<details>
<summary><strong>Advanced Example: Batch Chunking and Metadata</strong></summary>

```ts
import { TokenChunker } from "chonkie";

async function run() {
  const chunker = await TokenChunker.create({
    tokenizer: "Xenova/gpt2",
    chunkSize: 8,
    chunkOverlap: 3,
    returnType: "chunks"
  });
  const texts = [
    "According to all known laws of aviation, there is no way a bee should be able to fly.",
    "Its wings are too small to get its fat little body off the ground."
  ];
  const batchChunks = await chunker(texts);
  batchChunks.forEach((chunks, i) => {
    console.log(`Text ${i + 1} Chunks:`);
    chunks.forEach(chunk => {
      if (typeof chunk === 'string') {
        console.log(chunk);
      } else {
        console.log(`Text: ${chunk.text}, Start: ${chunk.startIndex}, End: ${chunk.endIndex}, Tokens: ${chunk.tokenCount}`);
      }
    });
  });
}

run();
```
</details>

**Notes:**

- The chunker is directly callable as a function after creation: `const chunks = await chunker(text)` or `await chunker([text1, text2])`.
- If `returnType` is set to `"chunks"`, each chunk includes metadata: `text`, `startIndex`, `endIndex`, and `tokenCount`.
- Overlap can be specified as a fraction (e.g., `0.2` for 20% of `chunkSize`) or as an absolute number.
- The chunker ensures that no chunk exceeds the specified `chunkSize` in tokens.

### SentenceChunker

The `SentenceChunker` splits text into chunks based on sentences, with options for token limits, overlap, and sentence merging. It is ideal for preparing text for models that are sentence-based, or for consistent chunking across different texts.

**Parameters:**

- **tokenizer** (`string | Tokenizer`, optional):
  - The tokenizer to use for token counting. Can be a string (model name, e.g., `"Xenova/gpt2"`, default) or an initialized `Tokenizer` instance.
- **chunkSize** (`number`, optional):
  - The maximum number of tokens per chunk. Must be positive. Default: `512`.
- **chunkOverlap** (`number`, optional):
  - The number of tokens to overlap between chunks. Must be >= 0 and < `chunkSize`. Default: `0`.
- **minSentencesPerChunk** (`number`, optional):
  - The minimum number of sentences per chunk. Must be > 0. Default: `1`.
- **minCharactersPerSentence** (`number`, optional):
  - The minimum number of characters for a valid sentence. Sentences shorter than this are merged. Must be > 0. Default: `12`.
- **approximate** (`boolean`, optional):
  - (Deprecated) Whether to use approximate token counting. Default: `false`.
- **delim** (`string[]`, optional):
  - List of sentence delimiters to use for splitting. Default: `[". ", "! ", "? ", "\n"]`.
- **includeDelim** (`"prev" | "next" | null`, optional):
  - Whether to include the delimiter with the previous sentence (`"prev"`), next sentence (`"next"`), or exclude it (`null`). Default: `"prev"`.
- **returnType** (`"chunks" | "texts"`, optional):
  - The type of output to return. `"chunks"` returns `Chunk` objects with metadata, while `"texts"` returns just the chunked text strings. Default: `"chunks"`.

**Methods:**

- **static async create(options: SentenceChunkerOptions = {}): Promise<CallableSentenceChunker>**
  - Creates and initializes a SentenceChunker instance that is directly callable as a function.
  - Returns a callable chunker: `chunker(text: string | string[], showProgress?: boolean)`

- **static async fromRecipe(options: SentenceChunkerRecipeOptions = {}): Promise<CallableSentenceChunker>**
  - Creates and initializes a SentenceChunker instance from a recipe loaded from the Chonkie hub.
  - The recipe's `delimiters` and `include_delim` settings override the default values.
  - Returns a callable chunker: `chunker(text: string | string[], showProgress?: boolean)`
  - Recipe options include:
    - `name` (`string`, optional): Recipe name. Default: `"default"`.
    - `language` (`string`, optional): Recipe language. Default: `"en"`.
    - `filePath` (`string`, optional): Local recipe file path (alternative to name/language).
    - All other options from `SentenceChunkerOptions` can be provided to override recipe defaults.

- **chunk(text: string): Promise<Chunk[] | string[]>**
  - Splits a single text into sentence-based chunks, respecting token and sentence limits.
  - Returns an array of `Chunk` objects (with metadata) or strings, depending on `returnType`.

- **chunkBatch(texts: string[], showProgress?: boolean): Promise<Array<Chunk[] | string[]>>**
  - Splits a batch of texts into sentence-based chunks.
  - Returns an array of arrays, each containing the chunks for a corresponding input text.

- **toString(): string**
  - Returns a string representation of the SentenceChunker instance.

**Example Usage:**

<details>
<summary><strong>Basic Example: Chunk a Simple String</strong></summary>

```ts
import { SentenceChunker } from "chonkie";

async function run() {
  const chunker = await SentenceChunker.create({ chunkSize: 128, minSentencesPerChunk: 2 });
  const text = "Hello world! This is a simple test. Let's see how the sentence chunker works.";
  const chunks = await chunker(text);
  console.log(chunks);
}

run();
```

</details>

<details>
<summary><strong>Advanced Example: Batch Chunking and Metadata</strong></summary>

```ts
import { SentenceChunker } from "chonkie";

async function run() {
  const chunker = await SentenceChunker.create({
    tokenizer: "Xenova/gpt2",
    chunkSize: 64,
    chunkOverlap: 10,
    minSentencesPerChunk: 1,
    returnType: "chunks"
  });
  const texts = [
    "Sentence one. Sentence two! Sentence three?",
    "Another document. With more sentences."
  ];
  const batchChunks = await chunker(texts);
  batchChunks.forEach((chunks, i) => {
    console.log(`Text ${i + 1} Chunks:`);
    chunks.forEach(chunk => {
      if (typeof chunk === 'string') {
        console.log(chunk);
      } else {
        console.log(`Text: ${chunk.text}, Start: ${chunk.startIndex}, End: ${chunk.endIndex}, Tokens: ${chunk.tokenCount}`);
      }
    });
  });
}

run();
```

</details>

<details>
<summary><strong>Recipe Example: Using Hub Recipes for Chunking</strong></summary>

```ts
import { SentenceChunker } from "chonkie";

async function run() {
  // Create a chunker using a recipe from the Chonkie hub
  const chunker = await SentenceChunker.fromRecipe({
    name: 'default',
    language: 'en',
    chunkSize: 100,  // Override chunk size from recipe defaults
    chunkOverlap: 15
  });
  
  // The recipe will provide delimiters and delimiter inclusion mode
  console.log("Recipe delimiters:", chunker.delim);
  console.log("Include delimiter mode:", chunker.includeDelim);
  
  const text = "Natural language processing is fascinating! What makes it interesting? The ability to understand human language.";
  const chunks = await chunker(text);
  
  chunks.forEach((chunk, index) => {
    if (typeof chunk === 'string') {
      console.log(`Chunk ${index + 1}: ${chunk}`);
    } else {
      console.log(`Chunk ${index + 1}: ${chunk.text} (${chunk.sentences.length} sentences)`);
    }
  });
}

run();
```

</details>

**Notes:**

- The chunker is directly callable as a function after creation: `const chunks = await chunker(text)` or `await chunker([text1, text2])`.
- If `returnType` is set to `"chunks"`, each chunk includes metadata: `text`, `startIndex`, `endIndex`, `tokenCount`, and the list of `sentences`.
- The chunker ensures that no chunk exceeds the specified `chunkSize` in tokens, and that each chunk contains at least `minSentencesPerChunk` sentences (except possibly the last chunk).
- Sentences shorter than `minCharactersPerSentence` are merged with adjacent sentences.
- Overlap is specified in tokens, and the chunker will overlap sentences as needed to meet the overlap requirement.
- You can customize sentence splitting using the `delim` and `includeDelim` options.

### RecursiveChunker

The `RecursiveChunker` splits text hierarchically using customizable rules to create semantically meaningful chunks. It is ideal for preparing text for models that are hierarchical, or for consistent chunking across different texts.

**Parameters:**

- **tokenizer** (`string | Tokenizer`, optional):
  - The tokenizer to use for chunking. Can be a string (model name, e.g., `"Xenova/gpt2"`, default) or an initialized `Tokenizer` instance.
- **chunkSize** (`number`, optional):
  - The maximum number of tokens per chunk. Must be greater than 0. Default: `512`.
- **rules** (`RecursiveRules`, optional):
  - The rules that define how text should be recursively chunked. Allows for hierarchical, multi-level splitting (e.g., paragraphs, then sentences, then tokens). Default: `new RecursiveRules()`.
- **minCharactersPerChunk** (`number`, optional):
  - The minimum number of characters that should be in each chunk. Chunks shorter than this may be merged. Must be greater than 0. Default: `24`.
- **returnType** (`"chunks" | "texts"`, optional):
  - The type of output to return. `"chunks"` returns `Chunk` objects with metadata, while `"texts"` returns just the chunked text strings. Default: `"chunks"`.

**Methods:**

- **static async create(options: RecursiveChunkerOptions = {}): Promise<CallableRecursiveChunker>**
  - Creates and initializes a RecursiveChunker instance that is directly callable as a function.
  - Returns a callable chunker: `chunker(text: string | string[], showProgress?: boolean)`

- **static async fromRecipe(options: RecursiveChunkerRecipeOptions = {}): Promise<CallableRecursiveChunker>**
  - Creates and initializes a RecursiveChunker instance from a recipe loaded from the Chonkie hub.
  - The recipe's `recursive_rules.levels` define the hierarchical chunking rules, overriding the default rules.
  - Returns a callable chunker: `chunker(text: string | string[], showProgress?: boolean)`
  - Recipe options include:
    - `name` (`string`, optional): Recipe name. Default: `"default"`.
    - `language` (`string`, optional): Recipe language. Default: `"en"`.
    - `filePath` (`string`, optional): Local recipe file path (alternative to name/language).
    - `tokenizer`, `chunkSize`, `minCharactersPerChunk` can be provided to override recipe defaults.

- **chunk(text: string): Promise<Chunk[] | string[]>**
  - Recursively splits a single text into chunks or strings, according to the rules and parameters.
  - Returns an array of `Chunk` objects (with metadata) or strings, depending on `returnType`.

- **chunkBatch(texts: string[], showProgress?: boolean): Promise<Array<Chunk[] | string[]>>**
  - Recursively splits a batch of texts into chunks.
  - Returns an array of arrays, each containing the chunks for a corresponding input text.

- **toString(): string**
  - Returns a string representation of the RecursiveChunker instance.

**Example Usage:**

<details>
<summary><strong>Basic Example: Chunk a Simple String</strong></summary>

```ts
import { RecursiveChunker } from "chonkie";

async function run() {
  const chunker = await RecursiveChunker.create({ chunkSize: 128 });
  const text = "Hello world! This is a simple test. Let's see how the recursive chunker works.";
  const chunks = await chunker(text);
  console.log(chunks);
}

run();
```
</details>

<details>
<summary><strong>Advanced Example: Custom Rules and Batch Chunking</strong></summary>

```ts
import { RecursiveChunker, RecursiveRules } from "chonkie";

async function run() {
  // Custom rules: first split by paragraphs, then by sentences, then by tokens
  const rules = new RecursiveRules([
    { delimiters: ["\n\n"], includeDelim: "prev" }, // Paragraphs
    { delimiters: [". ", "! ", "? "], includeDelim: "prev" }, // Sentences
    {} // Fallback to token-based
  ]);

  const chunker = await RecursiveChunker.create({
    chunkSize: 64,
    minCharactersPerChunk: 20,
    rules,
    returnType: "chunks"
  });
  const texts = [
    "First paragraph. It has two sentences!\n\nSecond paragraph? Yes.",
    "Another document. With more structure."
  ];
  const batchChunks = await chunker(texts);
  batchChunks.forEach((chunks, i) => {
    console.log(`Text ${i + 1} Chunks:`);
    chunks.forEach(chunk => {
      if (typeof chunk === 'string') {
        console.log(chunk);
      } else {
        console.log(`Text: ${chunk.text}, Start: ${chunk.startIndex}, End: ${chunk.endIndex}, Tokens: ${chunk.tokenCount}, Level: ${chunk.level}`);
      }
    });
  });
}

run();
```
</details>

<details>
<summary><strong>Reconstructability Example: Ensure Chunks Can Be Rejoined</strong></summary>

```ts
import { RecursiveChunker } from "chonkie";

async function run() {
  const sampleText = "Your long document here...";
  const chunker = await RecursiveChunker.create({ chunkSize: 32 });
  const chunks = await chunker(sampleText);
  // Reconstruct the text from chunks
  const reconstructedText = chunks.map(chunk => typeof chunk === 'string' ? chunk : chunk.text).join("");
  console.log("Reconstruction Match:", reconstructedText === sampleText);
}

run();
```
</details>

**Notes:**

- The chunker is directly callable as a function after creation: `const chunks = await chunker(text)` or `await chunker([text1, text2])`.
- If `returnType` is set to `"chunks"`, each chunk includes metadata: `text`, `startIndex`, `endIndex`, `tokenCount`, and `level` (the recursion depth at which the chunk was created).
- The `rules` parameter allows for highly flexible, hierarchical chunking strategies (e.g., paragraphs → sentences → tokens). See the `RecursiveRules` and `RecursiveLevel` types for customization.
- Chunks shorter than `minCharactersPerChunk` may be merged with adjacent chunks to ensure minimum size.
- The chunker ensures that no chunk exceeds the specified `chunkSize` in tokens.
- The `chunkBatch` method (or calling with an array) allows efficient batch processing with optional progress reporting.

### CodeChunker

The `CodeChunker` intelligently splits source code into meaningful segments using Abstract Syntax Trees (ASTs) generated by Tree-sitter. It aims to create chunks that respect code structure (like functions, classes, blocks) while attempting to stay within a specified token `chunkSize`. This chunker is particularly useful for processing code for Large Language Models (LLMs), static analysis, or Retrieval Augmented Generation (RAG) systems that need to understand or embed code semantically.

**Parameters:**

- **tokenizer** (`string | Tokenizer`, optional):
  - The tokenizer for token counting. Can be a model name string (e.g., `"Xenova/gpt2"`, default) or an initialized `Tokenizer` instance.
- **chunkSize** (`number`, optional):
  - The target maximum token count per chunk. Must be positive. Default: `512`. The chunker will try to group AST nodes to achieve this size.
- **lang** (`string`, optional):
  - The programming language of the input code (e.g., `"typescript"`, `"python"`, `"javascript"`). Default: `"typescript"`. This is crucial for selecting the correct Tree-sitter parser.
- **includeNodes** (`boolean`, optional):
  - If `true`, the generated `CodeChunk` objects will include an array of `TreeSitterNode` objects that constitute the chunk. Default: `false`.

**Methods:**

- **static async create(options: CodeChunkerOptions = {}): Promise<CallableCodeChunker>**
  - Creates and initializes a `CodeChunker` instance that is directly callable.
  - Returns a callable chunker: `chunker(text: string | string[], showProgress?: boolean)`
- **chunk(text: string): Promise<CodeChunk[]>**
  - Splits a single code string into an array of `CodeChunk` objects. (This method is part of the underlying instance and is invoked by the callable interface).
- **chunkBatch(texts: string[], showProgress?: boolean): Promise<Array<CodeChunk[]>>**
  - Splits a batch of code strings into an array of `CodeChunk` arrays. (Available via the callable interface, typically handled by `BaseChunker`).
- **toString(): string**
  - Returns a string representation of the `CodeChunker` instance.

**Example Usage:**

<details>
<summary><strong>Basic Example: Chunking JavaScript Code</strong></summary>

```ts
import { CodeChunker } from "chonkie"; // Ensure CodeChunker is exported

async function run() {
  const chunker = await CodeChunker.create({
    lang: "javascript",
    chunkSize: 128
  });

  const jsCode = `
function greet(name) {
  // This is a comment
  console.log("Hello, " + name + "!");
}

class User {
  constructor(username) {
    this.username = username;
  }

  displayUsername() {
    greet(this.username);
  }
}

const myUser = new User("ChonkieDev");
myUser.displayUsername();
  `;

  const chunks = await chunker(jsCode);
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1} (Tokens: ${chunk.tokenCount}):`);
    console.log("```javascript");
    console.log(chunk.text.trim());
    console.log("```");
    console.log("---");
  });
}

run();
```
</details>

<details>
<summary><strong>Advanced Example: Batch Chunking with AST Nodes</strong></summary>

```ts
import { CodeChunker, CodeChunk } from "chonkie"; // Assuming CodeChunk is exported

async function run() {
  const chunker = await CodeChunker.create({
    lang: "python",
    chunkSize: 64,
    includeNodes: true // Set to true to get AST nodes
  });

  const pythonCodeSnippets = [
    `
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)
    `,
    `
class MathUtils:
    def add(self, a, b):
        return a + b
    def subtract(self, a, b):
        return a - b
    `
  ];

  const batchChunks = await chunker(pythonCodeSnippets);

  batchChunks.forEach((codeChunks, i) => {
    console.log(`\n--- Code Snippet ${i + 1} ---`);
    // Ensure codeChunks is treated as CodeChunk[] for type safety if needed
    (codeChunks as CodeChunk[]).forEach((chunk, j) => {
      console.log(` Chunk ${j + 1} (Tokens: ${chunk.tokenCount}):`);
      console.log("```python");
      console.log(chunk.text.trim());
      console.log("```");
      if (chunk.nodes && chunk.nodes.length > 0) {
        console.log(`  AST Nodes (${chunk.nodes.length}):`);
        chunk.nodes.forEach(node => {
          console.log(`    - Type: ${node.type}, Text: "${node.text.substring(0, 30)}..."`);
        });
      }
      console.log("---");
    });
  });
}

run();
```
</details>

**Notes:**

- The CodeChunker is directly callable as a function after creation: const chunks = await chunker(codeString) or await chunker([codeString1, codeString2]).
- It uses Tree-sitter and corresponding WASM parsers for the specified language (e.g., tree-sitter-typescript.wasm). Ensure the tree-sitter-wasms package is correctly installed and accessible in your node_modules directory.
- The lang parameter is crucial for selecting the correct parser.
- Unlike other chunkers, CodeChunker does not have an explicit chunkOverlap parameter. It chunks based on Abstract Syntax Tree (AST) node boundaries, trying to fit them within the chunkSize.
- The chunker attempts to create semantically meaningful chunks by respecting code structures like functions, classes, and blocks. If a structure is too large for chunkSize, it will be broken down further.
- If includeNodes is true, each CodeChunk will contain the raw TreeSitterNode objects that form the chunk, which can be useful for advanced analysis.
- The chunking process relies on byte offsets from the original text to ensure accurate reconstruction and mapping of chunks.

## Associated Types

`chonkie-ts` defines a bunch of types that are used to make the chunking process more flexible as well as to provide type safety. Here's an overview of the main types that we've created.

### Chunk

The `Chunk` type represents a chunk of text with metadata.

**Class Signature:**

```ts
class Chunk {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
}
```

**Properties:**

- `text`: The text content of the chunk.
- `startIndex`: The starting index of the chunk in the original text.
- `endIndex`: The ending index of the chunk in the original text.
- `tokenCount`: The number of tokens in the chunk.

**Methods:**

- `toString()`: Returns a string representation of the chunk.
- `toDict()`: Returns a dictionary representation of the chunk.

**Example:**

```ts
import { Chunk } from "chonkie";
const chunk = new Chunk({ text: "Hello, world!", startIndex: 0, endIndex: 13, tokenCount: 2 });
console.log(chunk.toString()); // "Hello, world!"
```

### CodeChunk

The `CodeChunk` class extends the base `Chunk` class and represents a chunk of code with additional metadata, including the programming language and (optionally) the AST nodes that make up the chunk.

**Class Signature:**

```ts
class CodeChunk extends Chunk {
  lang?: string;
  nodes?: TreeSitterNode[];

  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    lang?: string;
    nodes?: TreeSitterNode[];
  });

  toString(): string;
  toDict(): CodeChunkData;
  static fromDict(data: CodeChunkData): CodeChunk;
}
```

**Properties:**

- Inherits all properties from `Chunk`:
  - `text`: The code text content of the chunk.
  - `startIndex`: The starting index of the chunk in the original text.
  - `endIndex`: The ending index of the chunk in the original text.
  - `tokenCount`: The number of tokens in the chunk.
- `lang` (optional): The programming language of the code.
- `nodes` (optional): An array of `TreeSitterNode` objects representing the AST nodes in the chunk.

**Methods:**

- `toString()`: Returns a string representation of the `CodeChunk`.
- `toDict()`: Returns a dictionary representation of the `CodeChunk`.
- `static fromDict(data: CodeChunkData)`: Creates a `CodeChunk` object from a dictionary.

**Example:**

```ts
import { CodeChunk } from "chonkie";
const codeChunk = new CodeChunk({
  text: "function foo() { return 42; }",
  startIndex: 0,
  endIndex: 27,
  tokenCount: 7,
  lang: "javascript",
  nodes: [] // Typically filled by the chunker
});
console.log(codeChunk.toString());
// Output: CodeChunk(text=function foo() { return 42; }, startIndex=0, endIndex=27, tokenCount=7, lang=javascript, nodes=)
```

### TreeSitterNode

The `TreeSitterNode` interface represents a node in the Abstract Syntax Tree (AST) generated by Tree-sitter. It is a flexible interface whose properties depend on the language parser and the specific node type.

**Interface Signature:**

```ts
interface TreeSitterNode {
  [key: string]: any;
}
```

**Typical Properties:**

- `type`: The type of the AST node (e.g., "function_declaration", "identifier").
- `text`: The source code text of the node.
- `startIndex`: The starting byte offset of the node in the source text.
- `endIndex`: The ending byte offset of the node in the source text.
- `children`: An array of child `TreeSitterNode` objects.

**Notes:**
- The actual properties available on a `TreeSitterNode` may vary depending on the language and the node type.
- This interface is used internally by the `CodeChunker` when `includeNodes` is set to `true`.

### Sentence

The `Sentence` type represents a sentence of text with metadata.

**Class Signature:**

```ts
class Sentence {
  /** The text of the sentence */
  text: string;
  /** The starting index of the sentence in the original text */
  startIndex: number;
  /** The ending index of the sentence in the original text */
  endIndex: number;
  /** The number of tokens in the sentence */
  tokenCount: number;

  constructor(data: SentenceData): void;
  toString(): string;
  toDict(): SentenceData;
  static fromDict(data: SentenceData): Sentence;
}

interface SentenceData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
}
```

**Properties:**

- `text`: The text content of the sentence.
- `startIndex`: The starting index of the sentence in the original text.
- `endIndex`: The ending index of the sentence in the original text.
- `tokenCount`: The number of tokens in the sentence.

**Methods:**

- `toString()`: Returns a string representation of the sentence.
- `toDict()`: Returns a dictionary representation of the sentence.
- `static fromDict(data: { text: string, startIndex: number, endIndex: number, tokenCount: number })`: Creates a new `Sentence` object from a dictionary.

**Example:**

```ts
import { Sentence } from "chonkie";
const sentence = new Sentence({ text: "This is a sentence.", startIndex: 0, endIndex: 21, tokenCount: 4 });
console.log(sentence.toString()); // "This is a sentence."
```

### SentenceChunk

The `SentenceChunk` class represents a chunk of one or more sentences within a text. It extends the base `Chunk` class and provides additional functionality for managing groups of sentences.

**Class Signature:**

```ts
class SentenceChunk extends Chunk {
  /** List of sentences in the chunk */
  sentences: Sentence[];

  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    sentences: Sentence[];
  });
}
```

**Properties:**

- Inherits all properties from `Chunk`:
  - `text`: The combined text of all sentences in the chunk
  - `startIndex`: The starting index of the chunk in the original text
  - `endIndex`: The ending index of the chunk in the original text
  - `tokenCount`: The total number of tokens in the chunk
- `sentences`: An array of `Sentence` objects, each representing an individual sentence within the chunk

**Methods:**

- `toString()`: Returns a detailed string representation of the SentenceChunk, including its text, start and end indices, token count, and a list of all contained sentences with their metadata
- `toDict()`: Returns the SentenceChunk as a dictionary-like object containing the chunk's text, start and end indices, token count, and an array of sentence data
- `static fromDict(data: SentenceChunkData)`: Creates a SentenceChunk object from a dictionary-like object

**Example:**

```ts
import { SentenceChunk, Sentence } from "chonkie";

const sentence1 = new Sentence({
  text: "First sentence.",
  startIndex: 0,
  endIndex: 15,
  tokenCount: 2
});

const sentence2 = new Sentence({
  text: "Second sentence!",
  startIndex: 16,
  endIndex: 32,
  tokenCount: 2
});

const chunk = new SentenceChunk({
  text: "First sentence. Second sentence!",
  startIndex: 0,
  endIndex: 32,
  tokenCount: 4,
  sentences: [sentence1, sentence2]
});

console.log(chunk.toString());
// Output: SentenceChunk(text=First sentence. Second sentence!, startIndex=0, endIndex=32, tokenCount=4, sentences=[Sentence(text=First sentence., startIndex=0, endIndex=15, tokenCount=2), Sentence(text=Second sentence!, startIndex=16, endIndex=32, tokenCount=2)])
```

**Notes:**

- The `SentenceChunk` class extends the base `Chunk` class, inheriting its core functionality while adding sentence-specific features
- Each sentence in the chunk maintains its own metadata (text, position, token count)
- The chunk's text property contains the combined text of all sentences
- The chunk's token count represents the total number of tokens across all sentences


### RecursiveRules

The `RecursiveRules` class defines a set of hierarchical rules for recursively chunking text. It is used to configure a `RecursiveChunker` instance.

**Class Signature:**

```ts
class RecursiveRules {
  levels: RecursiveLevel[];
  constructor(data?: { levels?: RecursiveLevelData[] });
  toString(): string;
  get length(): number;
  getLevel(index: number): RecursiveLevel | undefined;
  [Symbol.iterator](): Iterator<RecursiveLevel>;
  static fromDict(data: { levels?: RecursiveLevelData[] }): RecursiveRules;
  toDict(): { levels: RecursiveLevelData[] };
  static async fromRecipe(name?: string, lang?: string, path?: string): Promise<RecursiveRules>;
}
```

**Default Behavior:**

- If no levels are provided, the default is a hierarchy of:
  1. Paragraphs (`\n\n`, `\r\n`, `\n`, `\r`)
  2. Sentences (`. `, `! `, `? `)
  3. Pauses/punctuation (`{`, `}`, `"`, `[`, `]`, `<`, `>`, `(`, `)`, `:`, `;`, `,`, `—`, `|`, `~`, `-`, `...`, `` ` ``, `'`)
  4. Words (whitespace)
  5. Tokens (fallback)

**Example:**

```ts
import { RecursiveRules } from "chonkie";
const rules = new RecursiveRules({
  levels: [
    { delimiters: ["\n\n"], includeDelim: "prev" },
    { delimiters: [". ", "! ", "? "], includeDelim: "prev" },
    { whitespace: true }
  ]
});
```

### RecursiveLevel

The `RecursiveLevel` class defines how to split text at a specific level of recursion.

**Class Signature:**

```ts
class RecursiveLevel {
  constructor(data?: {
    delimiters?: string | string[];
    whitespace?: boolean;
    includeDelim?: "prev" | "next";
  });
  delimiters?: string | string[];
  whitespace: boolean;
  includeDelim: "prev" | "next";
  toString(): string;
  toDict(): { delimiters?: string | string[]; whitespace?: boolean; includeDelim?: "prev" | "next" };
  static fromDict(data: { delimiters?: string | string[]; whitespace?: boolean; includeDelim?: "prev" | "next" }): RecursiveLevel;
  static async fromRecipe(name: string, lang?: string): Promise<RecursiveLevel>;
}
```

**Options:**

- `delimiters`: Custom string(s) to split on (cannot be used with `whitespace`).
- `whitespace`: If true, splits on whitespace (cannot be used with `delimiters`).
- `includeDelim`: Whether to include the delimiter with the previous chunk (`"prev"`, default) or the next chunk (`"next"`).

**Validation:**

- Cannot specify both `delimiters` and `whitespace`.
- Delimiters cannot be empty or whitespace-only.

**Example:**

```ts
import { RecursiveLevel } from "chonkie";
const level = new RecursiveLevel({ delimiters: [". ", "! "], includeDelim: "prev" });
```

### RecursiveChunk

The `RecursiveChunk` class represents a chunk of text produced by the `RecursiveChunker`, with additional metadata indicating the recursion level at which the chunk was created. It extends the base `Chunk` class, inheriting its core properties and methods, while adding a `level` property for hierarchical chunking.

**Class Signature:**

```ts
class RecursiveChunk extends Chunk {
  /** The level of recursion for the chunk */
  level?: number;

  constructor(data: {
    text: string;
    startIndex: number;
    endIndex: number;
    tokenCount: number;
    level?: number;
  });

  toString(): string;
  toDict(): RecursiveChunkData;
  static fromDict(data: RecursiveChunkData): RecursiveChunk;
}

interface RecursiveChunkData {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
  level?: number;
}
```

**Properties:**

- Inherits all properties from `Chunk`:
  - `text`: The text content of the chunk.
  - `startIndex`: The starting index of the chunk in the original text.
  - `endIndex`: The ending index of the chunk in the original text.
  - `tokenCount`: The number of tokens in the chunk.
- `level` (optional): The recursion depth at which the chunk was created. Lower numbers indicate higher-level (coarser) chunks; higher numbers indicate deeper (finer) splits.

**Methods:**

- `toString()`: Returns a string representation of the chunk, including its text, indices, token count, and recursion level.
- `toDict()`: Returns a dictionary representation of the chunk, including all properties.
- `static fromDict(data: RecursiveChunkData)`: Creates a new `RecursiveChunk` object from a dictionary.

**Example:**

```ts
import { RecursiveChunk } from "chonkie";

const chunk = new RecursiveChunk({
  text: "This is a recursively chunked text.",
  startIndex: 0,
  endIndex: 33,
  tokenCount: 7,
  level: 2
});

console.log(chunk.toString());
// Output: RecursiveChunk(text=This is a recursively chunked text., startIndex=0, endIndex=33, tokenCount=7, level=2)

console.log(chunk.toDict());
// Output: { text: 'This is a recursively chunked text.', startIndex: 0, endIndex: 33, tokenCount: 7, level: 2 }
```

**Notes:**

- The `level` property is useful for understanding the granularity of the chunk within a hierarchical chunking process.
- All methods and properties of the base `Chunk` class are available on `RecursiveChunk`.
- The `fromDict` and `toDict` methods facilitate easy serialization and deserialization of chunk data.


---
Fin.

That's all there is to it! With `chonkie-ts`, you've got a powerful, flexible toolkit for all your text chunking needs. Whether you're working with tokens, sentences, or complex hierarchical structures, we've got you covered. Happy chunking! 🦛✨