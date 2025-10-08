import { TokenChunker, OverlapRefinery } from '../src';

describe('OverlapRefinery', () => {
  it('should add overlap to chunks successfully', async () => {
    // First create some chunks
    const chunker = new TokenChunker({ chunkSize: 30 });
    const chunks = await chunker.chunk({ text: 'This is a test for overlap refinery functionality.' });

    // Add overlap
    const refinery = new OverlapRefinery({
      contextSize: 0.25,
      method: 'suffix'
    });

    const refinedChunks = await refinery.refine(chunks);

    expect(refinedChunks.length).toBeGreaterThan(0);
    expect(refinedChunks[0]).toHaveProperty('text');
    expect(refinedChunks[0]).toHaveProperty('tokenCount');
    expect(refinedChunks[0]).toHaveProperty('startIndex');
    expect(refinedChunks[0]).toHaveProperty('endIndex');
  });
});
