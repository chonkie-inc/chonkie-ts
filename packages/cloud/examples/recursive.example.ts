import { RecursiveChunker } from '../src';

async function main() {
  console.log('🦛 Testing RecursiveChunker with api.chonkie.ai\n');

  try {
    const chunker = new RecursiveChunker({
      chunkSize: 60,
      recipe: 'default',
      lang: 'en'
    });

    console.log('✅ RecursiveChunker created');
    console.log(`Config: ${chunker.toString()}\n`);

    const text = `First paragraph with some content here.

Second paragraph with more details. It contains multiple sentences.

Third paragraph to test the recursive splitting.`;

    console.log(`📝 Input (${text.length} chars):`);
    console.log(`"${text}"\n`);

    const chunks = await chunker.chunk({ text });

    console.log(`✅ Received ${chunks.length} chunks:\n`);

    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1}:`);
      console.log(`  Tokens: ${chunk.tokenCount}`);
      console.log(`  Position: [${chunk.startIndex}:${chunk.endIndex}]`);
      console.log(`  Text: "${chunk.text}"`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
