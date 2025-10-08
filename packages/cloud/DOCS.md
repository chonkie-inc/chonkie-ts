# @chonkiejs/cloud Documentation

Complete API reference and usage guide for @chonkiejs/cloud.

## Table of Contents

- [Installation](#installation)
- [Authentication](#authentication)
- [TokenChunker](#tokenchunker)
- [SentenceChunker](#sentencechunker)
- [RecursiveChunker](#recursivechunker)
- [SemanticChunker](#semanticchunker)
- [NeuralChunker](#neuralchunker)
- [Common Types](#common-types)
- [Error Handling](#error-handling)

## Installation

```bash
npm install @chonkiejs/cloud
```

## Authentication

All chunkers require a Chonkie API key. You can provide it in two ways:

### Option 1: Environment Variable (Recommended)

```bash
export CHONKIE_API_KEY=your-api-key-here
```

```typescript
import { TokenChunker } from '@chonkiejs/cloud';

const chunker = new TokenChunker({ chunkSize: 512 });
```

### Option 2: Constructor Option

```typescript
import { TokenChunker } from '@chonkiejs/cloud';

const chunker = new TokenChunker({
  apiKey: 'your-api-key-here',
  chunkSize: 512
});
```

Get your API key at: https://api.chonkie.ai/dashboard

## TokenChunker

Splits text into fixed-size token chunks with optional overlap.

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tokenizer` | `string` | `"gpt2"` | Tokenizer to use |
| `chunkSize` | `number` | `512` | Maximum tokens per chunk |
| `chunkOverlap` | `number` | `0` | Tokens to overlap between chunks |
| `apiKey` | `string` | `process.env.CHONKIE_API_KEY` | API key |
| `baseUrl` | `string` | `"https://api.chonkie.ai"` | API base URL |

### Example

```typescript
import { TokenChunker } from '@chonkiejs/cloud';

const chunker = new TokenChunker({
  chunkSize: 256,
  chunkOverlap: 50
});

const chunks = await chunker.chunk({ text: 'Your text here...' });
```

### Methods

#### `chunk(input: ChunkerInput): Promise<Chunk[]>`

Chunks text or a file.

**Input:**
- `{ text: string }` - Chunk text directly
- `{ filepath: string }` - Chunk a file

**Returns:** Array of `Chunk` objects

## SentenceChunker

Splits text into sentence-based chunks respecting sentence boundaries.

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tokenizer` | `string` | `"gpt2"` | Tokenizer to use |
| `chunkSize` | `number` | `512` | Maximum tokens per chunk |
| `chunkOverlap` | `number` | `0` | Tokens to overlap |
| `minSentencesPerChunk` | `number` | `1` | Minimum sentences per chunk |
| `minCharactersPerSentence` | `number` | `12` | Minimum chars per sentence |
| `approximate` | `boolean` | `false` | Use approximate token counting |
| `delim` | `string \| string[]` | `[".", "!", "?", "\n"]` | Sentence delimiters |
| `includeDelim` | `'prev' \| 'next' \| null` | `'prev'` | Where to include delimiter |
| `apiKey` | `string` | `process.env.CHONKIE_API_KEY` | API key |
| `baseUrl` | `string` | `"https://api.chonkie.ai"` | API base URL |

### Example

```typescript
import { SentenceChunker } from '@chonkiejs/cloud';

const chunker = new SentenceChunker({
  chunkSize: 256,
  minSentencesPerChunk: 2
});

const chunks = await chunker.chunk({ text: 'Sentence one. Sentence two. Sentence three.' });
```

## RecursiveChunker

Uses hierarchical rules for chunking with customizable recipes.

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tokenizer` | `string` | `"gpt2"` | Tokenizer to use |
| `chunkSize` | `number` | `512` | Maximum tokens per chunk |
| `recipe` | `string` | `"default"` | Recipe name to use |
| `lang` | `string` | `"en"` | Language for recipe |
| `minCharactersPerChunk` | `number` | `12` | Minimum chars per chunk |
| `apiKey` | `string` | `process.env.CHONKIE_API_KEY` | API key |
| `baseUrl` | `string` | `"https://api.chonkie.ai"` | API base URL |

### Example

```typescript
import { RecursiveChunker } from '@chonkiejs/cloud';

const chunker = new RecursiveChunker({
  chunkSize: 512,
  recipe: 'default',
  lang: 'en'
});

const chunks = await chunker.chunk({ text: 'Your document...' });
```

## SemanticChunker

Creates semantically coherent chunks using embedding-based similarity.

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `embeddingModel` | `string` | `"minishlab/potion-base-8M"` | Embedding model |
| `threshold` | `number` | `0.5` | Similarity threshold (0-1) |
| `chunkSize` | `number` | `512` | Maximum tokens per chunk |
| `similarityWindow` | `number` | `1` | Window for similarity comparison |
| `minSentences` | `number` | `1` | Minimum sentences per chunk |
| `minChunkSize` | `number` | `2` | Minimum chunk size |
| `minCharactersPerSentence` | `number` | `12` | Minimum chars per sentence |
| `thresholdStep` | `number` | `0.01` | Threshold adjustment step |
| `delim` | `string \| string[]` | `[".", "!", "?", "\n"]` | Sentence delimiters |
| `includeDelim` | `'prev' \| 'next' \| null` | `'prev'` | Where to include delimiter |
| `apiKey` | `string` | `process.env.CHONKIE_API_KEY` | API key |
| `baseUrl` | `string` | `"https://api.chonkie.ai"` | API base URL |

### Example

```typescript
import { SemanticChunker } from '@chonkiejs/cloud';

const chunker = new SemanticChunker({
  threshold: 0.5,
  chunkSize: 512
});

const chunks = await chunker.chunk({
  text: 'AI is advancing. Technology evolves. Climate needs action.'
});
```

## NeuralChunker

Uses neural networks for intelligent, context-aware chunking.

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | `string` | `"mirth/chonky_modernbert_large_1"` | Neural model to use |
| `minCharactersPerChunk` | `number` | `10` | Minimum chars per chunk |
| `apiKey` | `string` | `process.env.CHONKIE_API_KEY` | API key |
| `baseUrl` | `string` | `"https://api.chonkie.ai"` | API base URL |

### Example

```typescript
import { NeuralChunker } from '@chonkiejs/cloud';

const chunker = new NeuralChunker();

const chunks = await chunker.chunk({
  text: 'Neural networks process information efficiently.'
});
```

## Common Types

### ChunkerInput

```typescript
interface ChunkerInput {
  text?: string;      // Text to chunk
  filepath?: string;  // Or path to file
}
```

**Usage:**

```typescript
// Chunk text
const chunks = await chunker.chunk({ text: 'Your text...' });

// Chunk file
const chunks = await chunker.chunk({ filepath: '/path/to/file.txt' });
```

### Chunk

All chunkers return `Chunk` objects from `@chonkiejs/core`:

```typescript
class Chunk {
  text: string;         // The chunk text
  startIndex: number;   // Start position in original
  endIndex: number;     // End position in original
  tokenCount: number;   // Number of tokens
}
```

## Error Handling

The cloud package provides helpful error messages:

```typescript
try {
  const chunks = await chunker.chunk({ text: 'Your text...' });
} catch (error) {
  console.error(error.message);
  // Will show:
  // - Clear error description
  // - Troubleshooting steps
  // - Links to support/issues
}
```

Common errors:
- **401 Invalid API key** - Check your CHONKIE_API_KEY
- **429 Rate limit** - Wait before retrying
- **500 Server error** - Temporary API issue

## Batch Processing

All chunkers support batch processing:

```typescript
const chunker = new TokenChunker({ chunkSize: 256 });

const inputs = [
  { text: 'First document...' },
  { text: 'Second document...' },
  { text: 'Third document...' }
];

const results = await chunker.chunkBatch(inputs);
// Returns: Chunk[][]
```

## Examples

### Token Chunking with Overlap

```typescript
import { TokenChunker } from '@chonkiejs/cloud';

const chunker = new TokenChunker({
  chunkSize: 100,
  chunkOverlap: 20
});

const chunks = await chunker.chunk({ text: 'Long document...' });
```

### Semantic Chunking

```typescript
import { SemanticChunker } from '@chonkiejs/cloud';

const chunker = new SemanticChunker({
  threshold: 0.6,  // Higher = more semantic breaks
  chunkSize: 512
});

const chunks = await chunker.chunk({
  text: 'Text with different topics...'
});
```

### File Processing

```typescript
import { RecursiveChunker } from '@chonkiejs/cloud';

const chunker = new RecursiveChunker({ chunkSize: 512 });

const chunks = await chunker.chunk({
  filepath: './document.txt'
});
```

### Custom API URL

```typescript
import { NeuralChunker } from '@chonkiejs/cloud';

const chunker = new NeuralChunker({
  baseUrl: 'https://custom-api.example.com',
  apiKey: 'your-key'
});
```

## TypeScript Types

All exports include full TypeScript type definitions:

```typescript
import type {
  TokenChunkerOptions,
  SentenceChunkerOptions,
  RecursiveChunkerOptions,
  SemanticChunkerOptions,
  NeuralChunkerOptions,
  ChunkerInput,
  CloudClientConfig
} from '@chonkiejs/cloud';
```

## FAQ

### Top-level await error with tsx/esbuild

**Error:**
```
ERROR: Top-level await is currently not supported with the "cjs" output format
```

**Solution:**

If you're using top-level await, ensure your project is configured for ESM:

**Option 1: Use ESM (Recommended)**

Add to your `package.json`:
```json
{
  "type": "module"
}
```

**Option 2: Wrap in async function**

```typescript
// Instead of top-level await:
const chunker = new TokenChunker();
const chunks = await chunker.chunk({ text: 'Test' }); // ❌ Error

// Use this:
async function main() {
  const chunker = new TokenChunker();
  const chunks = await chunker.chunk({ text: 'Test' }); // ✅ Works
}

main();
```

**Option 3: Use .mjs extension**

Rename your file from `script.ts` to `script.mts` or `script.js` to `script.mjs`.

### Invalid API key error

**Error:**
```
API Error (401): Invalid API key
```

**Solutions:**

1. **Check environment variable:**
   ```bash
   echo $CHONKIE_API_KEY
   ```

2. **Set the environment variable:**
   ```bash
   export CHONKIE_API_KEY=your-api-key-here
   ```

3. **Or pass explicitly:**
   ```typescript
   const chunker = new TokenChunker({
     apiKey: 'your-api-key-here'
   });
   ```

4. **Get your API key:**
   Visit https://api.chonkie.ai/dashboard

### Cannot find module '@chonkiejs/core'

Make sure both packages are installed:

```bash
npm install @chonkiejs/cloud @chonkiejs/core
```

The cloud package requires `@chonkiejs/core` as a peer dependency.

## Support

If you encounter issues:
- Open an issue: https://github.com/chonkie-inc/chonkie-ts/issues
- Contact: bhavnick@chonkie.ai
- Check API status: https://api.chonkie.ai
