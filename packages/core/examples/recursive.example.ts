import { RecursiveChunker, RecursiveRules } from '../src';

async function main() {
  console.log('🦛 Chonkie RecursiveChunker Example\n');
  console.log('='.repeat(60));

  // Example 1: Basic usage with default settings
  console.log('\n📝 Example 1: Basic Chunking\n');

  const chunker = await RecursiveChunker.create({
    chunkSize: 100,
    minCharactersPerChunk: 20
  });

  const text = `
Chonkie is a powerful text chunking library. It helps you break down large documents into manageable pieces.

The library uses a recursive approach. It starts by splitting on paragraphs, then sentences, then punctuation, and finally words.

This hierarchical method ensures that chunks are semantically meaningful. Each chunk respects the configured size limits while maintaining context.
  `.trim();

  const chunks = await chunker.chunk(text);

  console.log(`Input text length: ${text.length} characters`);
  console.log(`Number of chunks created: ${chunks.length}\n`);

  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}:`);
    console.log(`  Position: [${chunk.startIndex}:${chunk.endIndex}]`);
    console.log(`  Token count: ${chunk.tokenCount}`);
    console.log(`  Text: "${chunk.text.substring(0, 60)}${chunk.text.length > 60 ? '...' : ''}"`);
    console.log();
  });

  // Example 2: Custom rules
  console.log('='.repeat(60));
  console.log('\n📝 Example 2: Custom Rules (Paragraphs Only)\n');

  const customChunker = await RecursiveChunker.create({
    chunkSize: 150,
    rules: new RecursiveRules({
      levels: [
        { delimiters: ['\n\n'] },  // Only split on paragraphs
        { whitespace: true },       // Then words
        {}                          // Then characters
      ]
    })
  });

  const paragraphText = `First paragraph with some content.

Second paragraph with more information that needs to be chunked properly.

Third paragraph concludes the example.`;

  const customChunks = await customChunker.chunk(paragraphText);

  console.log(`Input text length: ${paragraphText.length} characters`);
  console.log(`Number of chunks: ${customChunks.length}\n`);

  customChunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}: ${chunk.tokenCount} tokens`);
    console.log(`"${chunk.text}"`);
    console.log();
  });

  // Example 3: Very long text
  console.log('='.repeat(60));
  console.log('\n📝 Example 3: Long Text Handling\n');

  const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
  const longChunker = await RecursiveChunker.create({ chunkSize: 100 });
  const longChunks = await longChunker.chunk(longText);

  console.log(`Input text length: ${longText.length} characters`);
  console.log(`Number of chunks: ${longChunks.length}`);
  console.log(`Average chunk size: ${Math.round(longText.length / longChunks.length)} characters`);
  console.log(`Max chunk tokens: ${Math.max(...longChunks.map(c => c.tokenCount))}`);
  console.log(`Min chunk tokens: ${Math.min(...longChunks.map(c => c.tokenCount))}`);

  // Example 4: Verification
  console.log('\n='.repeat(60));
  console.log('\n✅ Verification: Text Reconstruction\n');

  const reconstructed = chunks.map(c => c.text).join('');
  const matches = reconstructed === text;

  console.log(`Original length: ${text.length}`);
  console.log(`Reconstructed length: ${reconstructed.length}`);
  console.log(`Reconstruction matches: ${matches ? '✅ Yes' : '❌ No'}`);

  console.log('\n='.repeat(60));
  console.log('\n🎉 Example completed!\n');
}

main().catch(console.error);
