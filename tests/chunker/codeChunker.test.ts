import { CodeChunker, CodeChunkerOptions } from '../../src/chonkie/chunker/code';
import { CodeChunk } from '../../src/chonkie/types/code';

describe('CodeChunker', () => {
  // Sample JavaScript code for testing
  const sampleJsCode = `
function greet(name) {
  console.log("Hello, " + name + "!");
}

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  getInfo() {
    return this.name + " is " + this.age + " years old.";
  }
}

const p = new Person("Alice", 30);
greet(p.name);
// This is a comment
console.log(p.getInfo());
`;

  // Helper function to normalize text for comparison (if needed, like in recursiveChunker)
  const normalizeText = (text: string): string => {
    return text.replace(/\s+/g, ' ').trim();
  };

  it('should initialize correctly with default parameters', async () => {
    const chunker = await CodeChunker.create({ tokenizer: 'Xenova/gpt2', lang: 'javascript' });
    expect(chunker).toBeDefined();
    expect(chunker.chunkSize).toBe(512);
    expect(chunker.lang).toBe('javascript');
    expect(chunker.includeNodes).toBe(false);
  });

  it('should initialize correctly with custom parameters', async () => {
    const options: CodeChunkerOptions = {
      tokenizer: 'Xenova/gpt2',
      chunkSize: 256,
      lang: 'javascript',
      includeNodes: true,
    };
    const chunker = await CodeChunker.create(options);
    expect(chunker).toBeDefined();
    expect(chunker.chunkSize).toBe(256);
    expect(chunker.lang).toBe('javascript');
    expect(chunker.includeNodes).toBe(true);
  });

  it('should throw an error if language is not specified during chunking', async () => {
    await expect(CodeChunker.create({ tokenizer: 'Xenova/gpt2' })).rejects.toThrow("Language must be specified for code chunking");
  });

  it('should chunk JavaScript code correctly', async () => {
    const chunker = await CodeChunker.create({ tokenizer: 'Xenova/gpt2', lang: 'javascript' });
    const chunks = await chunker.chunk(sampleJsCode) as CodeChunk[];

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);

    if (chunks.length > 0) {
      expect(chunks[0]).toBeInstanceOf(CodeChunk);
    }

    let totalChars = 0;
    chunks.forEach(chunk => {
      expect(chunk.text).toBeDefined();
      expect(chunk.startIndex).toBeGreaterThanOrEqual(0);
      expect(chunk.endIndex).toBeGreaterThan(chunk.startIndex);
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(chunk.lang).toBe('javascript');
      expect(chunk.nodes).toBeUndefined(); // includeNodes is false by default
      totalChars += chunk.text.length;
    });
    //This assertion might be tricky due to how tree-sitter chunks and if text is slightly modified (e.g. whitespace)
    //For now, ensuring that chunking happens and basic properties are set.
  });

  it('should handle empty text', async () => {
    const chunker = await CodeChunker.create({ tokenizer: 'Xenova/gpt2', lang: 'javascript' });
    const chunks = await chunker.chunk('');
    expect(chunks).toEqual([]);
  });

  it('should handle short text (shorter than chunk size)', async () => {
    const shortCode = 'const a = 10;';
    const chunker = await CodeChunker.create({ tokenizer: 'Xenova/gpt2', lang: 'javascript', chunkSize: 512 });
    const chunks = await chunker.chunk(shortCode) as CodeChunk[];

    expect(chunks.length).toBe(1);
    const chunk = chunks[0];
    expect(chunk).toBeInstanceOf(CodeChunk);
    // The exact text might differ slightly due to tree-sitter parsing and reconstruction.
    // We check if the core content is there.
    expect(chunk.text.includes('const a = 10;')).toBe(true);
    expect(chunk.startIndex).toBe(0);
    expect(chunk.endIndex).toBe(shortCode.length); // This might also be tricky if tree-sitter adds/removes whitespace
    expect(chunk.tokenCount).toBeGreaterThan(0);
    expect(chunk.lang).toBe('javascript');
  });

  it('should have correct indices for chunks and allow text reconstruction', async () => {
    const chunker = await CodeChunker.create({ tokenizer: 'Xenova/gpt2', lang: 'javascript', chunkSize: 64 }); // Smaller chunk size for more chunks
    const chunks = await chunker.chunk(sampleJsCode) as CodeChunk[];

    expect(chunks.length).toBeGreaterThan(0);

    let reconstructedText = "";
    let currentOriginalIndex = 0;

    chunks.forEach((chunk, i) => {
      // Check that chunks are ordered by startIndex
      expect(chunk.startIndex).toBeGreaterThanOrEqual(currentOriginalIndex);

      // Extract the part of the original text that this chunk claims to represent
      const originalSlice = sampleJsCode.substring(chunk.startIndex, chunk.endIndex);

      // Tree-sitter based chunking might not produce chunks that perfectly concatenate
      // to the original string due to how nodes are grouped and whitespace handling.
      // The internal `_getTextsFromNodeGroups` has logic to handle this.
      // For this test, we'll focus on ensuring the chunk.text is what it says it is from original.
      expect(chunk.text).toEqual(originalSlice);

      if (i === 0) {
        reconstructedText = chunk.text;
      } else {
        // If chunks are perfectly contiguous and non-overlapping:
        // reconstructedText += sampleJsCode.substring(chunks[i-1].endIndex, chunk.startIndex); // Gap text
        // reconstructedText += chunk.text;
        // However, code chunker might make them contiguous by its design
        // For code, it's more about semantic units rather than perfect string reconstruction by simple concatenation of chunk.text.
        // The test in _getTextsFromNodeGroups seems to try to make them contiguous.
        // Let's assume the chunks are meant to be contiguous based on startIndex/endIndex relative to original.
      }
      currentOriginalIndex = chunk.endIndex;
    });

    // Reconstruct based on chunk.text. This should ideally match the original text.
    const directReconstruction = chunks.map(c => c.text).join('');

    // Normalizing might be necessary if whitespace differences are expected.
    // The current implementation of _getTextsFromNodeGroups attempts to make chunks that will concatenate back.
    expect(normalizeText(directReconstruction)).toEqual(normalizeText(sampleJsCode));
  });


  it('should have correct string representation', async () => {
    const chunker = await CodeChunker.create({
      tokenizer: 'Xenova/gpt2',
      lang: 'python',
      chunkSize: 128,
      includeNodes: true
    });
    const representation = chunker.toString();
    expect(representation).toContain('CodeChunker(tokenizer=');
    expect(representation).toContain('chunkSize=128');
    expect(representation).toContain('lang=python');
    expect(representation).toContain('includeNodes=true');
  });

  it('should include nodes when includeNodes is true', async () => {
    const chunker = await CodeChunker.create({
      tokenizer: 'Xenova/gpt2',
      lang: 'javascript',
      includeNodes: true
    });
    const chunks = await chunker.chunk("function foo() { return 1; }") as CodeChunk[];

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach(chunk => {
      expect(chunk.nodes).toBeDefined();
      if (chunk.nodes) { // type guard
        expect(Array.isArray(chunk.nodes)).toBe(true);
        // Further checks on node structure could be added if necessary
      }
    });
  });

  it('should not include nodes when includeNodes is false or default', async () => {
    const chunkerDefault = await CodeChunker.create({ tokenizer: 'Xenova/gpt2', lang: 'javascript' });
    const chunksDefault = await chunkerDefault.chunk("function bar() { return 2; }") as CodeChunk[];

    expect(chunksDefault.length).toBeGreaterThan(0);
    chunksDefault.forEach(chunk => {
      expect(chunk.nodes).toBeUndefined();
    });

    const chunkerFalse = await CodeChunker.create({
      tokenizer: 'Xenova/gpt2',
      lang: 'javascript',
      includeNodes: false
    });
    const chunksFalse = await chunkerFalse.chunk("function baz() { return 3; }") as CodeChunk[];

    expect(chunksFalse.length).toBeGreaterThan(0);
    chunksFalse.forEach(chunk => {
      expect(chunk.nodes).toBeUndefined();
    });
  });

  // Test for a different language (e.g., Python) to ensure WASM loading for others works
  it('should chunk Python code correctly', async () => {
    const samplePythonCode = `
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)

result = factorial(5)
print(f"Factorial of 5 is {result}")
`;
    const chunker = await CodeChunker.create({ tokenizer: 'Xenova/gpt2', lang: 'python', chunkSize: 64 });
    const chunks = await chunker.chunk(samplePythonCode) as CodeChunk[];

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);

    if (chunks.length > 0) {
      expect(chunks[0]).toBeInstanceOf(CodeChunk);
    }

    chunks.forEach(chunk => {
      expect(chunk.text).toBeDefined();
      expect(chunk.startIndex).toBeGreaterThanOrEqual(0);
      expect(chunk.endIndex).toBeGreaterThan(chunk.startIndex);
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(chunk.lang).toBe('python');
    });

    const reconstructedText = chunks.map(c => c.text).join('');
    expect(normalizeText(reconstructedText)).toEqual(normalizeText(samplePythonCode));
  });

});
