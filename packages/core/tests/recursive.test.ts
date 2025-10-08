import { RecursiveChunker, RecursiveRules, Tokenizer } from '../src';

describe('RecursiveChunker', () => {
  describe('Basic Functionality', () => {
    it('should create a chunker with default options', async () => {
      const chunker = await RecursiveChunker.create();
      expect(chunker).toBeInstanceOf(RecursiveChunker);
      expect(chunker.chunkSize).toBe(512);
      expect(chunker.minCharactersPerChunk).toBe(24);
    });

    it('should create a chunker with custom options', async () => {
      const chunker = await RecursiveChunker.create({
        chunkSize: 256,
        minCharactersPerChunk: 10
      });
      expect(chunker.chunkSize).toBe(256);
      expect(chunker.minCharactersPerChunk).toBe(10);
    });

    it('should throw error for invalid chunkSize', async () => {
      await expect(RecursiveChunker.create({ chunkSize: 0 })).rejects.toThrow('chunkSize must be greater than 0');
      await expect(RecursiveChunker.create({ chunkSize: -1 })).rejects.toThrow('chunkSize must be greater than 0');
    });

    it('should throw error for invalid minCharactersPerChunk', async () => {
      await expect(RecursiveChunker.create({ minCharactersPerChunk: 0 })).rejects.toThrow('minCharactersPerChunk must be greater than 0');
      await expect(RecursiveChunker.create({ minCharactersPerChunk: -1 })).rejects.toThrow('minCharactersPerChunk must be greater than 0');
    });
  });

  describe('Chunking', () => {
    it('should chunk short text into single chunk', async () => {
      const chunker = await RecursiveChunker.create({ chunkSize: 100 });
      const text = 'This is a short text.';
      const chunks = await chunker.chunk(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0].text).toBe(text);
      expect(chunks[0].startIndex).toBe(0);
      expect(chunks[0].endIndex).toBe(text.length);
      expect(chunks[0].tokenCount).toBe(text.length);
    });

    it('should chunk text with paragraphs', async () => {
      const chunker = await RecursiveChunker.create({ chunkSize: 50 });
      const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const chunks = await chunker.chunk(text);

      expect(chunks.length).toBeGreaterThan(1);

      // Verify chunks reconstruct original text
      const reconstructed = chunks.map(c => c.text).join('');
      expect(reconstructed).toBe(text);
    });

    it('should chunk text with sentences', async () => {
      const chunker = await RecursiveChunker.create({ chunkSize: 30 });
      const text = 'First sentence. Second sentence. Third sentence.';
      const chunks = await chunker.chunk(text);

      expect(chunks.length).toBeGreaterThan(1);

      // Verify text reconstruction
      const reconstructed = chunks.map(c => c.text).join('');
      expect(reconstructed).toBe(text);
    });

    it('should handle empty text', async () => {
      const chunker = await RecursiveChunker.create();
      const chunks = await chunker.chunk('');
      expect(chunks).toHaveLength(0);
    });

    it('should maintain correct indices', async () => {
      const chunker = await RecursiveChunker.create({ chunkSize: 20 });
      const text = 'Hello world. How are you? I am fine.';
      const chunks = await chunker.chunk(text);

      // Verify each chunk's indices are correct
      for (const chunk of chunks) {
        const extractedText = text.substring(chunk.startIndex, chunk.endIndex);
        expect(extractedText).toBe(chunk.text);
      }
    });

    it('should respect chunk size limits', async () => {
      const chunkSize = 50;
      const chunker = await RecursiveChunker.create({ chunkSize });
      const text = 'A'.repeat(200); // Long text without delimiters
      const chunks = await chunker.chunk(text);

      // Each chunk should not exceed chunk size (except possibly last one)
      for (const chunk of chunks) {
        expect(chunk.tokenCount).toBeLessThanOrEqual(chunkSize);
      }
    });
  });

  describe('Custom Rules', () => {
    it('should work with custom rules', async () => {
      const rules = new RecursiveRules({
        levels: [
          { delimiters: ['\n\n'] },  // Paragraphs
          { whitespace: true },       // Words
          {}                          // Characters
        ]
      });

      const chunker = await RecursiveChunker.create({ chunkSize: 30, rules });
      const text = 'First paragraph.\n\nSecond paragraph.';
      const chunks = await chunker.chunk(text);

      expect(chunks.length).toBeGreaterThan(0);

      // Verify reconstruction
      const reconstructed = chunks.map(c => c.text).join('');
      expect(reconstructed).toBe(text);
    });

    it('should handle single-level rules', async () => {
      const rules = new RecursiveRules({
        levels: [{ whitespace: true }]
      });

      const chunker = await RecursiveChunker.create({ chunkSize: 10, rules });
      const text = 'one two three four five';
      const chunks = await chunker.chunk(text);

      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('Custom Tokenizer', () => {
    it('should work with custom tokenizer', async () => {
      const tokenizer = new Tokenizer();
      const chunker = await RecursiveChunker.create({
        chunkSize: 50,
        tokenizer
      });

      const text = 'Testing custom tokenizer functionality.';
      const chunks = await chunker.chunk(text);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].tokenCount).toBe(tokenizer.countTokens(chunks[0].text));
    });
  });

  describe('Edge Cases', () => {
    it('should handle text with only delimiters', async () => {
      const chunker = await RecursiveChunker.create({ chunkSize: 10 });
      const text = '\n\n\n\n';
      const chunks = await chunker.chunk(text);

      // Should handle gracefully
      expect(chunks.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long text', async () => {
      const chunker = await RecursiveChunker.create({ chunkSize: 100 });
      const text = 'Lorem ipsum dolor sit amet. '.repeat(100);
      const chunks = await chunker.chunk(text);

      expect(chunks.length).toBeGreaterThan(1);

      // Verify reconstruction
      const reconstructed = chunks.map(c => c.text).join('');
      expect(reconstructed).toBe(text);
    });

    it('should handle text with mixed delimiters', async () => {
      const chunker = await RecursiveChunker.create({ chunkSize: 30 });
      const text = 'Line one.\nLine two.\n\nParagraph.\rAnother line.';
      const chunks = await chunker.chunk(text);

      expect(chunks.length).toBeGreaterThan(0);

      // Verify reconstruction
      const reconstructed = chunks.map(c => c.text).join('');
      expect(reconstructed).toBe(text);
    });

    it('should handle unicode characters', async () => {
      const chunker = await RecursiveChunker.create({ chunkSize: 50 });
      const text = 'Hello 世界! 🦛 Émojis and spëcial çhars.';
      const chunks = await chunker.chunk(text);

      expect(chunks.length).toBeGreaterThan(0);

      // Verify reconstruction
      const reconstructed = chunks.map(c => c.text).join('');
      expect(reconstructed).toBe(text);
    });
  });

  describe('Chunk Properties', () => {
    it('should have correct chunk properties', async () => {
      const chunker = await RecursiveChunker.create({ chunkSize: 30 });
      const text = 'First sentence. Second sentence.';
      const chunks = await chunker.chunk(text);

      for (const chunk of chunks) {
        expect(chunk).toHaveProperty('text');
        expect(chunk).toHaveProperty('startIndex');
        expect(chunk).toHaveProperty('endIndex');
        expect(chunk).toHaveProperty('tokenCount');
        expect(typeof chunk.text).toBe('string');
        expect(typeof chunk.startIndex).toBe('number');
        expect(typeof chunk.endIndex).toBe('number');
        expect(typeof chunk.tokenCount).toBe('number');
        expect(chunk.startIndex).toBeGreaterThanOrEqual(0);
        expect(chunk.endIndex).toBeGreaterThan(chunk.startIndex);
      }
    });
  });
});
