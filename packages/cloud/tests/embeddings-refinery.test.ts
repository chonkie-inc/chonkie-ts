import { TokenChunker, EmbeddingsRefinery } from '../src';

describe('EmbeddingsRefinery', () => {
  it('should add embeddings to chunks successfully', async () => {
    // First create some chunks
    const chunker = new TokenChunker({ chunkSize: 30 });
    const chunks = await chunker.chunk({ text: 'This is a test for embeddings refinery.' });

    // Add embeddings
    const refinery = new EmbeddingsRefinery({
      embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2'
    });

    const refinedChunks = await refinery.refine(chunks);

    expect(refinedChunks.length).toBeGreaterThan(0);
    expect(refinedChunks[0]).toHaveProperty('text');
    expect(refinedChunks[0]).toHaveProperty('tokenCount');
    expect(refinedChunks[0]).toHaveProperty('startIndex');
    expect(refinedChunks[0]).toHaveProperty('endIndex');
  });
});
