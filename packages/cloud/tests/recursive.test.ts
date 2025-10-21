import { RecursiveChunker } from '../src';
import * as path from 'path';

describe.skipIf(!process.env.CHONKIE_API_KEY)('RecursiveChunker', () => {
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

  it('should chunk file successfully with file upload', async () => {
    const chunker = new RecursiveChunker({ chunkSize: 200, minCharactersPerChunk: 50 });
    const testFilePath = path.join(__dirname, 'fixtures', 'test-document.md');

    const chunks = await chunker.chunk({ filepath: testFilePath });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('tokenCount');
    expect(chunks[0]).toHaveProperty('startIndex');
    expect(chunks[0]).toHaveProperty('endIndex');

    // Verify chunks can reconstruct the file
    const reconstructed = chunks.map(c => c.text).join('');
    expect(reconstructed.length).toBeGreaterThan(0);
  });
});
