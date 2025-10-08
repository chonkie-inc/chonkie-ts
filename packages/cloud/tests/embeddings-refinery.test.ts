import { TokenChunker, EmbeddingsRefinery } from '../src';

describe.skipIf(!process.env.CHONKIE_API_KEY)('EmbeddingsRefinery', () => {
  it('should add embeddings to chunks successfully', async () => {
    // First create some chunks
    const chunker = new TokenChunker({ chunkSize: 30 });
    const chunks = await chunker.chunk({ text: 'This is a test for embeddings refinery.' });

    // Verify chunks don't have embeddings initially
    expect(chunks[0].embedding).toBeUndefined();

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

    // Verify embeddings are now present
    expect(refinedChunks[0]).toHaveProperty('embedding');
    expect(refinedChunks[0].embedding).toBeDefined();
    expect(Array.isArray(refinedChunks[0].embedding)).toBe(true);
    expect(refinedChunks[0].embedding!.length).toBeGreaterThan(0);
  });
});
