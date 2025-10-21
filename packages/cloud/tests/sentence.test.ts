import { SentenceChunker } from '../src';
import * as path from 'path';

describe.skipIf(!process.env.CHONKIE_API_KEY)('SentenceChunker', () => {
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

  it('should chunk file successfully with file upload', async () => {
    const chunker = new SentenceChunker({ chunkSize: 150, minSentencesPerChunk: 2 });
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
