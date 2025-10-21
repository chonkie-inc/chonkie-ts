import { TokenChunker } from '../src';
import * as path from 'path';

describe.skipIf(!process.env.CHONKIE_API_KEY)('TokenChunker', () => {
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

  it('should chunk file successfully with file upload', async () => {
    const chunker = new TokenChunker({ chunkSize: 150, chunkOverlap: 20 });
    const testFilePath = path.join(__dirname, 'fixtures', 'test-document.md');

    const chunks = await chunker.chunk({ filepath: testFilePath });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('tokenCount');
    expect(chunks[0]).toHaveProperty('startIndex');
    expect(chunks[0]).toHaveProperty('endIndex');

    // Verify chunks respect chunk size
    chunks.forEach(chunk => {
      expect(chunk.tokenCount).toBeLessThanOrEqual(150);
    });
  });
});
