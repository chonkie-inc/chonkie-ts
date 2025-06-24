# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 22-05-2025

### BREAKING CHANGES

#### Removed from Main Package Export
- **CodeChunker** - Now only available via selective import:
  ```typescript
  import { CodeChunker } from "chonkie/chunker/code";
  ```
- **CodeChunk** - Now only available via selective import:
  ```typescript
  import { CodeChunk } from "chonkie/types";
  ```
- **TreeSitterNode** - Now only available via selective import:
  ```typescript
  import { TreeSitterNode } from "chonkie/types";
  ```
- **ChromaHandshake** - Now only available via selective import:
  ```typescript
  import { ChromaHandshake } from "chonkie/friends";
  ```

### Why This Change?

The main package export (`import { ... } from "chonkie"`) was causing bundler resolution errors for users because it loaded ALL chunkers, including:
- `web-tree-sitter` dependency from CodeChunker
- `chromadb` dependency from ChromaHandshake

This caused build failures even when users only wanted RecursiveChunker or TokenChunker.

### Migration Guide

**Before (v0.2.x):**
```typescript
import { CodeChunker, RecursiveChunker, ChromaHandshake } from "chonkie";
```

**After (v0.3.x):**
```typescript
import { RecursiveChunker } from "chonkie"; // Still works for common chunkers
import { CodeChunker } from "chonkie/chunker/code"; // Selective import required
import { ChromaHandshake } from "chonkie/friends"; // Selective import required
```

### Added

- **New package exports** for selective imports:
  ```typescript
  // Individual chunker imports
  import { TokenChunker } from "chonkie/chunker/token";
  import { SentenceChunker } from "chonkie/chunker/sentence";
  import { RecursiveChunker } from "chonkie/chunker/recursive";
  import { CodeChunker } from "chonkie/chunker/code"; // Includes web-tree-sitter
  
  // Friends and utilities
  import { ChromaHandshake } from "chonkie/friends";
  
  // Types
  import { CodeChunk, TreeSitterNode } from "chonkie/types";
  ```

### Improved

- **Significantly smaller bundles** for users not using CodeChunker or ChromaHandshake
- **Better tree-shaking** with explicit dependency loading
- **Bundler compatibility** - No more resolution errors for optional dependencies
- **All examples updated** to demonstrate selective import patterns

### Still Available in Main Export

These remain available from the main package export for convenience:
```typescript
// Common chunkers (no optional dependencies)
import { TokenChunker, SentenceChunker, RecursiveChunker } from "chonkie";

// Utilities
import { Tokenizer, Visualizer, Hubbie } from "chonkie";

// Basic types
import { Chunk, SentenceChunk, RecursiveChunk } from "chonkie";
```

## [0.2.6] - Previous release

- Enhanced export patterns for better tree-shaking
- Explicit named exports instead of wildcard re-exports
