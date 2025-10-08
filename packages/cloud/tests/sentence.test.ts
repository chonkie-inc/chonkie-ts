import { SentenceChunker } from '../src';

describe('SentenceChunker', () => {
  it('should chunk text successfully', async () => {
    const chunker = new SentenceChunker({ chunkSize: 50 });
    const text = 'First sentence here. Second sentence. Third one too.';

    const chunks = await chunker.chunk({ text });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('tokenCount');
    expect(chunks[0]).toHaveProperty('startIndex');
    expect(chunks[0]).toHaveProperty('endIndex');
  });
});
