# @chonkie/core Documentation

Complete API reference and usage guide for @chonkie/core.

## Table of Contents

- [Installation](#installation)
- [RecursiveChunker](#recursivechunker)
- [Tokenizer](#tokenizer)
- [Chunk](#chunk)
- [RecursiveRules](#recursiverules)
- [RecursiveLevel](#recursivelevel)
- [Examples](#examples)

## Installation

```bash
npm install @chonkie/core
```

## RecursiveChunker

Main class for recursive text chunking. Splits text hierarchically using customizable rules.

### Constructor

```typescript
new RecursiveChunker(options?: RecursiveChunkerOptions)
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `chunkSize` | `number` | `512` | Maximum tokens per chunk |
| `minCharactersPerChunk` | `number` | `24` | Minimum characters when merging small splits |
| `rules` | `RecursiveRules` | Default rules | Custom chunking hierarchy |
| `tokenizer` | `Tokenizer` | Character tokenizer | Custom tokenizer instance |

**Example:**

```typescript
import { RecursiveChunker } from '@chonkie/core';

const chunker = new RecursiveChunker({
  chunkSize: 512,
  minCharactersPerChunk: 24
});
```

### Methods

#### `chunk(text: string): Promise<Chunk[]>`

Chunks a single text into an array of chunks.

**Parameters:**
- `text` (string) - The text to chunk

**Returns:**
- `Promise<Chunk[]>` - Array of chunks

**Example:**

```typescript
const chunks = await chunker.chunk('Your text here...');

for (const chunk of chunks) {
  console.log(chunk.text);
  console.log(`Position: ${chunk.startIndex}-${chunk.endIndex}`);
  console.log(`Tokens: ${chunk.tokenCount}`);
}
```

### How Recursive Chunking Works

The `RecursiveChunker` splits text hierarchically:

1. **Paragraphs** - Split on `\n\n`, `\r\n`, `\n`, `\r`
2. **Sentences** - Split on `. `, `! `, `? `
3. **Punctuation** - Split on `{`, `}`, `(`, `)`, `,`, etc.
4. **Words** - Split on whitespace
5. **Characters** - Token-level splitting (final fallback)

Each level only activates if chunks from the previous level exceed `chunkSize`.

## Tokenizer

Simple character-based tokenizer where 1 character = 1 token.

### Constructor

```typescript
new Tokenizer()
```

### Methods

#### `countTokens(text: string): number`

Counts the number of tokens (characters) in text.

```typescript
const tokenizer = new Tokenizer();
const count = tokenizer.countTokens('Hello'); // Returns 5
```

#### `encode(text: string): number[]`

Encodes text into character codes.

```typescript
const tokens = tokenizer.encode('Hi'); // Returns [72, 105]
```

#### `decode(tokens: number[]): string`

Decodes character codes back into text.

```typescript
const text = tokenizer.decode([72, 105]); // Returns 'Hi'
```

#### `decodeBatch(tokensBatch: number[][]): string[]`

Decodes multiple token arrays.

```typescript
const texts = tokenizer.decodeBatch([[72, 105], [66, 121, 101]]);
// Returns ['Hi', 'Bye']
```

## Chunk

Represents a text chunk with metadata.

### Constructor

```typescript
new Chunk(data: {
  text: string;
  startIndex: number;
  endIndex: number;
  tokenCount: number;
})
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `text` | `string` | The chunk text content |
| `startIndex` | `number` | Starting position in original text |
| `endIndex` | `number` | Ending position in original text |
| `tokenCount` | `number` | Number of tokens in the chunk |

### Methods

#### `toString(): string`

Returns the chunk's text content.

```typescript
const chunk = new Chunk({
  text: 'Hello',
  startIndex: 0,
  endIndex: 5,
  tokenCount: 5
});

console.log(chunk.toString()); // 'Hello'
```

## RecursiveRules

Defines the hierarchy of rules for recursive chunking.

### Constructor

```typescript
new RecursiveRules(config?: RecursiveRulesConfig)
```

**Config:**
- `levels` (optional) - Array of `RecursiveLevelConfig` objects

If no levels provided, uses default hierarchy (paragraphs → sentences → punctuation → words → characters).

**Example:**

```typescript
import { RecursiveRules } from '@chonkie/core';

// Use default rules
const defaultRules = new RecursiveRules();

// Custom rules
const customRules = new RecursiveRules({
  levels: [
    { delimiters: ['\n\n'] },    // Paragraphs only
    { whitespace: true },         // Words
    {}                            // Characters
  ]
});
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `levels` | `RecursiveLevel[]` | Array of chunking levels |
| `length` | `number` | Number of levels |

### Methods

#### `getLevel(index: number): RecursiveLevel | undefined`

Gets a level by index.

```typescript
const firstLevel = rules.getLevel(0);
```

## RecursiveLevel

Represents one level in the recursive chunking hierarchy.

### Constructor

```typescript
new RecursiveLevel(config?: RecursiveLevelConfig)
```

**Config:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delimiters` | `string \| string[]` | `undefined` | Delimiters to split on |
| `whitespace` | `boolean` | `false` | Use whitespace as delimiter |
| `includeDelim` | `'prev' \| 'next' \| 'none'` | `'prev'` | Where to include delimiter |

**Examples:**

```typescript
import { RecursiveLevel } from '@chonkie/core';

// Split on newlines
const paragraphLevel = new RecursiveLevel({
  delimiters: ['\n\n', '\n']
});

// Split on punctuation, include delimiter with previous chunk
const sentenceLevel = new RecursiveLevel({
  delimiters: ['. ', '! ', '? '],
  includeDelim: 'prev'
});

// Split on whitespace
const wordLevel = new RecursiveLevel({
  whitespace: true
});

// Token level (no splitting)
const tokenLevel = new RecursiveLevel();
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `delimiters` | `string \| string[] \| undefined` | Delimiters for splitting |
| `whitespace` | `boolean` | Whether to use whitespace |
| `includeDelim` | `'prev' \| 'next' \| 'none'` | Delimiter placement |

## Examples

### Basic Usage

```typescript
import { RecursiveChunker } from '@chonkie/core';

const chunker = new RecursiveChunker({ chunkSize: 256 });
const chunks = await chunker.chunk('Your long text here...');

chunks.forEach(chunk => {
  console.log(`[${chunk.startIndex}-${chunk.endIndex}]: ${chunk.text}`);
});
```

### Custom Rules

```typescript
import { RecursiveChunker, RecursiveRules } from '@chonkie/core';

// Create custom rules for code chunking
const codeRules = new RecursiveRules({
  levels: [
    { delimiters: ['\n\n'] },           // Blank lines (blocks)
    { delimiters: ['\n'] },             // Single lines
    { delimiters: [';', '{', '}'] },    // Statements
    { whitespace: true },                // Words
    {}                                   // Characters
  ]
});

const chunker = new RecursiveChunker({
  chunkSize: 512,
  rules: codeRules
});

const chunks = await chunker.chunk(codeString);
```

### Custom Tokenizer

```typescript
import { RecursiveChunker, Tokenizer } from '@chonkie/core';

const tokenizer = new Tokenizer();
const chunker = new RecursiveChunker({
  chunkSize: 1000,
  tokenizer
});

const chunks = await chunker.chunk('Your text here...');
```

### Processing Chunks

```typescript
import { RecursiveChunker } from '@chonkie/core';

const chunker = new RecursiveChunker({ chunkSize: 512 });
const text = 'Your very long document text...';
const chunks = await chunker.chunk(text);

// Filter small chunks
const largeChunks = chunks.filter(chunk => chunk.tokenCount > 100);

// Get chunk statistics
const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
const avgTokens = totalTokens / chunks.length;

console.log(`Total chunks: ${chunks.length}`);
console.log(`Average tokens per chunk: ${avgTokens.toFixed(2)}`);

// Reconstruct original text
const reconstructed = chunks.map(c => c.text).join('');
console.log('Match:', reconstructed === text);
```

## TypeScript Types

All exports include full TypeScript type definitions:

```typescript
import type {
  RecursiveChunkerOptions,
  RecursiveLevelConfig,
  RecursiveRulesConfig,
  IncludeDelim
} from '@chonkie/core';
```

## License

MIT © Bhavnick Minhas
