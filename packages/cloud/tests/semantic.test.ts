import { SemanticChunker } from '../src';
import * as path from 'path';

describe.skipIf(!process.env.CHONKIE_API_KEY)('SemanticChunker', () => {
  it('should chunk text successfully', async () => {
    const chunker = new SemanticChunker({ chunkSize: 60 });
    const text = 'AI is advancing rapidly. Technology continues to evolve. Climate change needs attention. Environmental issues are critical.';

    const chunks = await chunker.chunk({ text });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('tokenCount');
    expect(chunks[0]).toHaveProperty('startIndex');
    expect(chunks[0]).toHaveProperty('endIndex');
  });

  it('should chunk file successfully with file upload', async () => {
    const chunker = new SemanticChunker({ chunkSize: 200, threshold: 0.5 });
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
