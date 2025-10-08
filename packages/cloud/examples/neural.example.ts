import { NeuralChunker } from '../src';

async function main() {
  console.log('🦛 Testing NeuralChunker with api.chonkie.ai\n');

  try {
    const chunker = new NeuralChunker();

    console.log('✅ NeuralChunker created');
    console.log(`Config: ${chunker.toString()}\n`);

    const text = 'Neural networks are used for pattern recognition. They learn from data to make predictions. Deep learning has revolutionized AI applications. Modern architectures like transformers are very powerful.';

    console.log(`📝 Input (${text.length} chars):`);
    console.log(`"${text}"\n`);

    console.log('🔄 Processing with neural model...\n');

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
