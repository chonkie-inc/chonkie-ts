import { SemanticChunker } from '../src';

async function main() {
  console.log('🦛 Testing SemanticChunker with api.chonkie.ai\n');

  try {
    const chunker = new SemanticChunker({
      chunkSize: 60,
      threshold: 0.5
    });

    console.log('✅ SemanticChunker created');
    console.log(`Config: ${chunker.toString()}\n`);

    const text = 'Artificial intelligence is transforming technology. Machine learning models are becoming more powerful. Meanwhile, climate change poses significant challenges. Environmental protection is crucial for our future.';

    console.log(`📝 Input (${text.length} chars):`);
    console.log(`"${text}"\n`);

    console.log('🔄 Analyzing semantic similarity...\n');

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
