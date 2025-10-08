import { SemanticChunker } from '../src';

describe.skipIf(!process.env.CHONKIE_API_KEY)('SemanticChunker', () => {
  it('should chunk text successfully', async () => {
    const chunker = new SemanticChunker({ chunkSize: 60 });
    const text = 'AI is advancing rapidly. Technology continues to evolve. Climate change needs attention. Environmental issues are critical.';

    const chunks = await chunker.chunk({ text });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('tokenCount');
    expect(chunks[0]).toHaveProperty('startIndex');
    expect(chunks[0]).toHaveProperty('endIndex');
  });
});
