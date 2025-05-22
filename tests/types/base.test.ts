import { Chunk } from '../../src/chonkie/types/base';

describe('Chunk', () => {
  it('should initialize correctly', () => {
    const chunk = new Chunk({
      text: 'test chunk',
      startIndex: 0,
      endIndex: 10,
      tokenCount: 2,
    });
    expect(chunk.text).toBe('test chunk');
    expect(chunk.startIndex).toBe(0);
    expect(chunk.endIndex).toBe(10);
    expect(chunk.tokenCount).toBe(2);
  });

  it('should raise error for illegal field values from constructor validation', () => {
    expect(
      () =>
        new Chunk({ text: 'test', startIndex: 10, endIndex: 5, tokenCount: 1 })
    ).toThrowError('Start index must be less than or equal to end index.');

    expect(
      () =>
        new Chunk({ text: 'test', startIndex: 0, endIndex: 5, tokenCount: -1 })
    ).toThrowError('Token count must be a non-negative integer.');
  });

  it('should serialize and deserialize correctly', () => {
    const chunk = new Chunk({
      text: 'test chunk',
      startIndex: 0,
      endIndex: 10,
      tokenCount: 2
    });
    const chunkDict = chunk.toDict();
    const restored = Chunk.fromDict(chunkDict);

    expect(restored.text).toBe(chunk.text);
    expect(restored.startIndex).toBe(chunk.startIndex);
    expect(restored.endIndex).toBe(chunk.endIndex);
    expect(restored.tokenCount).toBe(chunk.tokenCount);
  });

  it('should serialize and deserialize correctly when context is undefined', () => {
    const chunk = new Chunk({
      text: 'test chunk no context',
      startIndex: 0,
      endIndex: 20,
      tokenCount: 3,
    });
    const chunkDict = chunk.toDict();
    const restored = Chunk.fromDict(chunkDict);

    expect(restored.text).toBe(chunk.text);
    expect(restored.startIndex).toBe(chunk.startIndex);
    expect(restored.endIndex).toBe(chunk.endIndex);
    expect(restored.tokenCount).toBe(chunk.tokenCount);
  });

  it('should convert to string correctly', () => {
    const chunk = new Chunk({ text: 'sample chunk', startIndex: 0, endIndex: 12, tokenCount: 2 });
    expect(chunk.toString()).toBe('sample chunk');
  });

  it('should convert to representation string correctly without context', () => {
    const chunk = new Chunk({ text: 'repr chunk', startIndex: 0, endIndex: 10, tokenCount: 2 });
    expect(chunk.toRepresentation()).toBe("Chunk(text='repr chunk', tokenCount=2, startIndex=0, endIndex=10)");
  });

  it('should slice text correctly', () => {
    const chunk = new Chunk({ text: 'slicing', startIndex: 0, endIndex: 7, tokenCount: 1 });
    expect(chunk.slice(0, 3)).toBe('sli');
    expect(chunk.slice(3)).toBe('cing');
    expect(chunk.slice()).toBe('slicing');
  });

  it('should perform a deep copy', () => {
    const originalChunk = new Chunk({
      text: 'original chunk',
      startIndex: 0,
      endIndex: 14,
      tokenCount: 3,
    });

    const copiedChunk = originalChunk.copy();

    // Check if it's a new instance
    expect(copiedChunk).not.toBe(originalChunk);
    // Check if properties are equal
    expect(copiedChunk.text).toBe(originalChunk.text);
    expect(copiedChunk.startIndex).toBe(originalChunk.startIndex);
    expect(copiedChunk.endIndex).toBe(originalChunk.endIndex);
    expect(copiedChunk.tokenCount).toBe(originalChunk.tokenCount);

    // Modify copied chunk and context to ensure original is not affected
    copiedChunk.text = 'modified chunk';
    expect(originalChunk.text).toBe('original chunk');
  });
});
