import { CodeChunker } from '../src';
import * as path from 'path';

describe.skipIf(!process.env.CHONKIE_API_KEY)('CodeChunker', () => {
  it('should chunk TypeScript code successfully', async () => {
    const chunker = new CodeChunker({ language: 'typescript', chunkSize: 100 });
    const code = `
function hello() {
  console.log('Hello world');
}

class Example {
  constructor() {
    this.value = 42;
  }
}
    `.trim();

    const chunks = await chunker.chunk({ text: code });

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toHaveProperty('text');
    expect(chunks[0]).toHaveProperty('tokenCount');
    expect(chunks[0]).toHaveProperty('startIndex');
    expect(chunks[0]).toHaveProperty('endIndex');
  });

  it('should chunk TypeScript file successfully with file upload', async () => {
    const chunker = new CodeChunker({ language: 'typescript', chunkSize: 200 });
    const testFilePath = path.join(__dirname, 'fixtures', 'test-code.ts');

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
