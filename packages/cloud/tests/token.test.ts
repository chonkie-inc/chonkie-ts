import { TokenChunker } from '../src';

describe('TokenChunker', () => {
  it('should chunk text successfully', async () => {
    const chunker = new TokenChunker({ chunkSize: 30 });
    const text = 'This is a test. It should be chunked properly.';

    const chunks = await chunker.chunk({ text });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('tokenCount');
    expect(chunks[0]).toHaveProperty('startIndex');
    expect(chunks[0]).toHaveProperty('endIndex');
  });
});
