import { NeuralChunker } from '../src';

describe('NeuralChunker', () => {
  it('should chunk text successfully', async () => {
    const chunker = new NeuralChunker();
    const text = 'Neural networks learn patterns. Deep learning is powerful. Transformers changed NLP. Modern AI is impressive.';

    const chunks = await chunker.chunk({ text });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('tokenCount');
    expect(chunks[0]).toHaveProperty('startIndex');
    expect(chunks[0]).toHaveProperty('endIndex');
  });
});
