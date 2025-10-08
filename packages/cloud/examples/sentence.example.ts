import { SentenceChunker } from '../src';

async function main() {
  console.log('🦛 Testing SentenceChunker with api.chonkie.ai\n');

  try {
    const chunker = new SentenceChunker({
      chunkSize: 50,
      minSentencesPerChunk: 2
    });

    console.log('✅ SentenceChunker created');
    console.log(`Config: ${chunker.toString()}\n`);

    const text = 'This is the first sentence. Here is the second one. And a third sentence for testing. Finally, a fourth sentence to complete the example.';

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
