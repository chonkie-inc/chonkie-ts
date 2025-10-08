import { RecursiveChunker } from '../src';

describe('RecursiveChunker', () => {
  it('should chunk text successfully', async () => {
    const chunker = new RecursiveChunker({ chunkSize: 50 });
    const text = 'Paragraph one.\n\nParagraph two with more text.';

    const chunks = await chunker.chunk({ text });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('tokenCount');
    expect(chunks[0]).toHaveProperty('startIndex');
    expect(chunks[0]).toHaveProperty('endIndex');
  });
});
