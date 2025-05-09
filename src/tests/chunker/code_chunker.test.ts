import { CodeChunker } from '../../chonkie/chunker/code';
import { Tokenizer } from '../../chonkie/tokenizer';
import { CodeChunk } from '../../chonkie/types/code';
import { Chunk } from '../../chonkie/types/base';

describe('CodeChunker', () => {
  // Sample code snippets for testing
  const pythonCode = `
import os
import sys

def hello_world(name: str):
    """Prints a greeting."""
    print(f"Hello, {name}!")

class MyClass:
    def __init__(self, value):
        self.value = value

    def get_value(self):
        return self.value

if __name__ == "__main__":
    hello_world("World")
    instance = MyClass(10)
    print(instance.get_value())
`;

  const jsCode = `
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

class Calculator {
  add(a, b) {
    return a + b;
  }
}

const calc = new Calculator();
greet('Developer');
console.log(calc.add(5, 3));
`;

  it('should initialize correctly with default parameters', async () => {
    const chunker = await CodeChunker.create('google-bert/bert-base-uncased');
    expect(chunker).toBeDefined();
    expect(chunker.chunkSize).toBe(512);
    expect(chunker.returnType).toBe('chunks');
  });

  it('should initialize correctly with custom parameters', async () => {
    const chunker = await CodeChunker.create('google-bert/bert-base-uncased', 256);
    expect(chunker).toBeDefined();
    expect(chunker.chunkSize).toBe(256);
    expect(chunker.returnType).toBe('chunks');
  });

  it('should chunk code correctly', async () => {
    const chunker = await CodeChunker.create('google-bert/bert-base-uncased');
    const chunks = await chunker.chunk(pythonCode) as Chunk[];

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toBeInstanceOf(CodeChunk);

    chunks.forEach(chunk => {
      const codeChunk = chunk as CodeChunk;
      expect(codeChunk.text).toBeDefined();
      expect(codeChunk.startIndex).toBeGreaterThanOrEqual(0);
      expect(codeChunk.endIndex).toBeGreaterThan(codeChunk.startIndex);
      expect(codeChunk.tokenCount).toBeGreaterThan(0);
      expect(codeChunk.lang).toBe('python');
    });
  });

  it('should handle empty text', async () => {
    const chunker = await CodeChunker.create('google-bert/bert-base-uncased');
    const chunks = await chunker.chunk('');
    expect(chunks).toEqual([]);
  });

  it('should handle whitespace-only text', async () => {
    const chunker = await CodeChunker.create('google-bert/bert-base-uncased');
    const chunks = await chunker.chunk('   \n\t\n  ');
    expect(chunks).toEqual([]);
  });

  it('should have correct indices for chunks', async () => {
    const chunker = await CodeChunker.create('google-bert/bert-base-uncased');
    const chunks = await chunker.chunk(pythonCode) as Chunk[];

    const reconstructedText = chunks.map(chunk => (chunk as CodeChunk).text).join('');
    expect(normalizeText(reconstructedText)).toBe(normalizeText(pythonCode));
  });

  it('should respect chunk size limits', async () => {
    const chunkSize = 100;
    const chunker = await CodeChunker.create('google-bert/bert-base-uncased', chunkSize);
    const chunks = await chunker.chunk(pythonCode) as Chunk[];

    chunks.forEach(chunk => {
      const codeChunk = chunk as CodeChunk;
      expect(codeChunk.tokenCount).toBeLessThan(chunkSize + 20);
    });
    expect(chunks[chunks.length - 1].tokenCount).toBeGreaterThan(0);
  });

  it('should maintain code structure', async () => {
    const chunker = await CodeChunker.create('google-bert/bert-base-uncased');
    const chunks = await chunker.chunk(pythonCode) as Chunk[];

    let currentIndex = 0;
    chunks.forEach(chunk => {
      const codeChunk = chunk as CodeChunk;
      expect(codeChunk.startIndex).toBe(currentIndex);
      expect(codeChunk.endIndex).toBe(currentIndex + codeChunk.text.length);
      expect(codeChunk.text).toBe(pythonCode.slice(codeChunk.startIndex, codeChunk.endIndex));
      currentIndex = codeChunk.endIndex;
    });
  });

  it('should have correct string representation', async () => {
    const chunker = await CodeChunker.create('google-bert/bert-base-uncased');
    const chunks = await chunker.chunk(pythonCode) as Chunk[];
    if (chunks.length === 0) {
      return; // Skip if no chunks generated
    }

    const chunk = chunks[0] as CodeChunk;
    const representation = chunk.toString();
    expect(representation).toContain(`text=${chunk.text}`);
    expect(representation).toContain(`startIndex=${chunk.startIndex}`);
    expect(representation).toContain(`endIndex=${chunk.endIndex}`);
    expect(representation).toContain(`tokenCount=${chunk.tokenCount}`);
    expect(representation).toContain(`lang=${chunk.lang}`);
  });

  // Helper function to normalize text for comparison
  const normalizeText = (text: string): string => {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  };

  // Remove fromRecipe tests as they are not implemented
}); 