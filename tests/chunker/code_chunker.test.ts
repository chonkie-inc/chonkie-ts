import { CodeChunker } from 'chonkie/chunker/code';
import { CodeChunk } from 'chonkie/types/code';
import { Chunk } from 'chonkie/types/base';

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

  it('should initialize correctly', async () => {
    const chunker = await CodeChunker.create(
      'gpt2',
      128,
      'chunks',
      'python'
    );
    expect(chunker.chunkSize).toBe(128);
    expect(chunker.returnType).toBe('chunks');
    expect(chunker.lang).toBe('python');
  });

  it('should chunk Python code correctly', async () => {
    const chunker = await CodeChunker.create(
      'gpt2',
      50,
      'chunks',
      'python',
      true // include nodes
    );
    const chunks = await chunker.chunk(pythonCode) as Chunk[];

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every(chunk => chunk instanceof CodeChunk)).toBe(true);
    expect(chunks.every(chunk => (chunk as CodeChunk).text)).toBe(true);
    expect(chunks.every(chunk => (chunk as CodeChunk).startIndex !== undefined)).toBe(true);
    expect(chunks.every(chunk => (chunk as CodeChunk).endIndex !== undefined)).toBe(true);
    expect(chunks.every(chunk => (chunk as CodeChunk).tokenCount !== undefined)).toBe(true);
    expect(chunks.every(chunk => (chunk as CodeChunk).nodes !== undefined)).toBe(true);
  });

  it('should reconstruct Python code correctly', async () => {
    const chunker = await CodeChunker.create(
      'gpt2',
      50,
      'chunks',
      'python'
    );
    const chunks = await chunker.chunk(pythonCode) as Chunk[];
    const reconstructedText = chunks.map(chunk => (chunk as CodeChunk).text).join('');
    expect(reconstructedText).toBe(pythonCode);
  });

  it('should respect chunk size limits for Python code', async () => {
    const chunkSize = 50;
    const chunker = await CodeChunker.create(
      'gpt2',
      chunkSize,
      'chunks',
      'python'
    );
    const chunks = await chunker.chunk(pythonCode) as Chunk[];
    
    // Check all but last chunk rigorously
    chunks.slice(0, -1).forEach(chunk => {
      expect((chunk as CodeChunk).tokenCount).toBeLessThan(chunkSize + 20);
    });
    // Last chunk must have content
    expect(chunks[chunks.length - 1].tokenCount).toBeGreaterThan(0);
  });

  it('should have correct indices for Python code chunks', async () => {
    const chunker = await CodeChunker.create(
      'gpt2',
      50,
      'chunks',
      'python'
    );
    const chunks = await chunker.chunk(pythonCode) as Chunk[];
    let currentIndex = 0;

    chunks.forEach(chunk => {
      const codeChunk = chunk as CodeChunk;
      expect(codeChunk.startIndex).toBe(currentIndex);
      expect(codeChunk.endIndex).toBe(currentIndex + codeChunk.text.length);
      expect(codeChunk.text).toBe(pythonCode.slice(codeChunk.startIndex, codeChunk.endIndex));
      currentIndex = codeChunk.endIndex;
    });
    expect(currentIndex).toBe(pythonCode.length);
  });

  it('should return texts when returnType is texts', async () => {
    const chunker = await CodeChunker.create(
      'gpt2',
      50,
      'texts',
      'python'
    );
    const texts = await chunker.chunk(pythonCode) as string[];

    expect(Array.isArray(texts)).toBe(true);
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.every(text => typeof text === 'string')).toBe(true);
    const reconstructedText = texts.join('');
    expect(reconstructedText).toBe(pythonCode);
  });

  it('should handle empty input', async () => {
    const chunker = await CodeChunker.create(
      'gpt2',
      50,
      'chunks',
      'python'
    );
    const chunks = await chunker.chunk('');
    expect(chunks).toEqual([]);

    // Test returnType='texts'
    const textChunker = await CodeChunker.create(
      'gpt2',
      50,
      'texts',
      'python'
    );
    const texts = await textChunker.chunk('');
    expect(texts).toEqual([]);
  });

  it('should handle whitespace-only input', async () => {
    const chunker = await CodeChunker.create(
      'gpt2',
      50,
      'chunks',
      'python'
    );
    const chunks = await chunker.chunk('   \n\t\n  ');
    expect(chunks).toEqual([]);

    // Test returnType='texts'
    const textChunker = await CodeChunker.create(
      'gpt2',
      50,
      'texts',
      'python'
    );
    const texts = await textChunker.chunk('   \n\t\n  ');
    expect(texts).toEqual([]);
  });

  it('should chunk JavaScript code correctly', async () => {
    const chunker = await CodeChunker.create(
      'gpt2',
      30,
      'chunks',
      'javascript'
    );
    const chunks = await chunker.chunk(jsCode) as Chunk[];

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.every(chunk => chunk instanceof CodeChunk)).toBe(true);
    const reconstructedText = chunks.map(chunk => (chunk as CodeChunk).text).join('');
    expect(reconstructedText).toBe(jsCode);
  });

  it('should reconstruct JavaScript code correctly', async () => {
    const chunker = await CodeChunker.create(
      'gpt2',
      30,
      'chunks',
      'javascript'
    );
    const chunks = await chunker.chunk(jsCode) as Chunk[];
    const reconstructedText = chunks.map(chunk => (chunk as CodeChunk).text).join('');
    expect(reconstructedText).toBe(jsCode);
  });

  it('should respect chunk size limits for JavaScript code', async () => {
    const chunkSize = 30;
    const chunker = await CodeChunker.create(
      'gpt2',
      chunkSize,
      'chunks',
      'javascript'
    );
    const chunks = await chunker.chunk(jsCode) as Chunk[];
    
    // Check all but last chunk rigorously
    chunks.slice(0, -1).forEach(chunk => {
      expect((chunk as CodeChunk).tokenCount).toBeLessThan(chunkSize + 15);
    });
    // Last chunk must have content
    expect(chunks[chunks.length - 1].tokenCount).toBeGreaterThan(0);
  });
}); 