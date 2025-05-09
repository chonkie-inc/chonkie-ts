import { Context, Chunk } from '../../src/chonkie/types/base';

describe('Context', () => {
  it('should initialize correctly', () => {
    const context = new Context({ text: 'test', tokenCount: 1 });
    expect(context.text).toBe('test');
    expect(context.tokenCount).toBe(1);
    expect(context.startIndex).toBeUndefined();
    expect(context.endIndex).toBeUndefined();
  });

  it('should raise error for illegal field values as per validate()', () => {
    // Test case 1: text is not a string (Python: ValueError)
    expect(() => new Context({ text: 9000 as any, tokenCount: 1 })).toThrowError(
      'Text must be a string.'
    );

    // Test case 2: tokenCount is negative (Python: ValueError for Context(text="test", token_count=-1, start_index="0"))
    // The TS error is due to tokenCount: -1. startIndex: 0 is valid.
    expect(
      () => new Context({ text: 'test', tokenCount: -1, startIndex: 0 })
    ).toThrowError('Token count must be a non-negative integer.');

    // Test case 3: Python: Context(text="test", token_count="1") -> TypeError
    // The current TS validate() method does not throw an error if tokenCount is a string like "1" (passed via `as any`).
    // A TypeError would occur at compile time if not for `as any`.
    // Instead, we test other validation rules from the validate() method.
    expect(
      () => new Context({ text: 'test', tokenCount: 1, startIndex: -1 })
    ).toThrowError('Start index must be a non-negative integer.');

    expect(
      () => new Context({ text: 'test', tokenCount: 1, endIndex: -1 })
    ).toThrowError('End index must be a non-negative integer.');


    // Test case 4: startIndex > endIndex (Python: ValueError)
    expect(
      () =>
        new Context({ text: 'test', tokenCount: 1, startIndex: 10, endIndex: 5 })
    ).toThrowError('Start index must be less than or equal to end index.');
  });

  it('should serialize and deserialize correctly', () => {
    const context = new Context({
      text: 'test',
      tokenCount: 1,
      startIndex: 0,
      endIndex: 4,
    });
    const contextDict = context.toDict();
    const restored = Context.fromDict(contextDict);

    expect(restored.text).toBe(context.text);
    expect(restored.tokenCount).toBe(context.tokenCount);
    expect(restored.startIndex).toBe(context.startIndex);
    expect(restored.endIndex).toBe(context.endIndex);
  });

  it('should have correct length property', () => {
    const context = new Context({ text: 'hello', tokenCount: 1 });
    expect(context.length).toBe(5);
  });

  it('should convert to string correctly', () => {
    const context = new Context({ text: 'hello world', tokenCount: 2 });
    expect(context.toString()).toBe('hello world');
  });

  it('should convert to representation string correctly', () => {
    const context = new Context({ text: 'repr', tokenCount: 1, startIndex:0, endIndex: 4 });
    expect(context.toRepresentation()).toBe("Context(text='repr', tokenCount=1, startIndex=0, endIndex=4)");
  });
});

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
    expect(chunk.context).toBeUndefined();
  });

  it('should initialize with context', () => {
    const context = new Context({ text: 'context', tokenCount: 1 });
    const chunk = new Chunk({
      text: 'test chunk',
      startIndex: 0,
      endIndex: 10,
      tokenCount: 2,
      context: context,
    });
    expect(chunk.context).toBe(context);
    expect(chunk.context?.text).toBe('context');
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
    const context = new Context({ text: 'context', tokenCount: 1, startIndex: 0, endIndex: 7 });
    const chunk = new Chunk({
      text: 'test chunk',
      startIndex: 0,
      endIndex: 10,
      tokenCount: 2,
      context: context,
    });
    const chunkDict = chunk.toDict();
    const restored = Chunk.fromDict(chunkDict);

    expect(restored.text).toBe(chunk.text);
    expect(restored.startIndex).toBe(chunk.startIndex);
    expect(restored.endIndex).toBe(chunk.endIndex);
    expect(restored.tokenCount).toBe(chunk.tokenCount);

    expect(restored.context).toBeDefined();
    expect(restored.context!.text).toBe(chunk.context!.text);
    expect(restored.context!.tokenCount).toBe(chunk.context!.tokenCount);
    expect(restored.context!.startIndex).toBe(chunk.context!.startIndex);
    expect(restored.context!.endIndex).toBe(chunk.context!.endIndex);
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
    expect(restored.context).toBeUndefined();
  });

  it('should have correct length property', () => {
    const chunk = new Chunk({ text: 'sample', startIndex:0, endIndex:6, tokenCount: 1 });
    expect(chunk.length).toBe(6);
  });

  it('should convert to string correctly', () => {
    const chunk = new Chunk({ text: 'sample chunk', startIndex:0, endIndex:12, tokenCount: 2 });
    expect(chunk.toString()).toBe('sample chunk');
  });

  it('should convert to representation string correctly with context', () => {
    const context = new Context({ text: 'ctx', tokenCount: 1 });
    const chunk = new Chunk({ text: 'repr chunk', startIndex:0, endIndex:10, tokenCount:2, context });
    expect(chunk.toRepresentation()).toBe(`Chunk(text='repr chunk', tokenCount=2, startIndex=0, endIndex=10, context=${context.toRepresentation()})`);
  });

  it('should convert to representation string correctly without context', () => {
    const chunk = new Chunk({ text: 'repr chunk', startIndex:0, endIndex:10, tokenCount:2 });
    expect(chunk.toRepresentation()).toBe("Chunk(text='repr chunk', tokenCount=2, startIndex=0, endIndex=10)");
  });

  it('should be iterable', () => {
    const chunk = new Chunk({ text: 'abc', startIndex:0, endIndex:3, tokenCount:1 });
    const chars: string[] = [];
    for (const char of chunk) {
      chars.push(char);
    }
    expect(chars).toEqual(['a', 'b', 'c']);
  });

  it('should slice text correctly', () => {
    const chunk = new Chunk({ text: 'slicing', startIndex:0, endIndex:7, tokenCount:1 });
    expect(chunk.slice(0, 3)).toBe('sli');
    expect(chunk.slice(3)).toBe('cing');
    expect(chunk.slice()).toBe('slicing');
  });

  it('should perform a deep copy', () => {
    const context = new Context({ text: 'original context', tokenCount: 2 });
    const originalChunk = new Chunk({
      text: 'original chunk',
      startIndex: 0,
      endIndex: 14,
      tokenCount: 3,
      context: context,
    });

    const copiedChunk = originalChunk.copy();

    // Check if it's a new instance
    expect(copiedChunk).not.toBe(originalChunk);
    // Check if properties are equal
    expect(copiedChunk.text).toBe(originalChunk.text);
    expect(copiedChunk.startIndex).toBe(originalChunk.startIndex);
    expect(copiedChunk.endIndex).toBe(originalChunk.endIndex);
    expect(copiedChunk.tokenCount).toBe(originalChunk.tokenCount);

    // Check context (should also be a new instance but with same values)
    expect(copiedChunk.context).toBeDefined();
    expect(copiedChunk.context).not.toBe(originalChunk.context);
    expect(copiedChunk.context!.text).toBe(originalChunk.context!.text);
    expect(copiedChunk.context!.tokenCount).toBe(originalChunk.context!.tokenCount);

    // Modify copied chunk and context to ensure original is not affected
    copiedChunk.text = 'modified chunk';
    copiedChunk.context!.text = 'modified context';

    expect(originalChunk.text).toBe('original chunk');
    expect(originalChunk.context!.text).toBe('original context');
  });
});
