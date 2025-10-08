import { TokenChunker, EmbeddingsRefinery } from '../src';

async function main() {
  console.log('🦛 Testing EmbeddingsRefinery with api.chonkie.ai\n');

  try {
    // Step 1: Create chunks
    console.log('Step 1: Creating chunks...\n');

    const chunker = new TokenChunker({ chunkSize: 50 });
    const text = 'Artificial intelligence is transforming technology. Machine learning enables new possibilities. Neural networks process complex patterns.';

    console.log(`📝 Input (${text.length} chars):`);
    console.log(`"${text}"\n`);

    const chunks = await chunker.chunk({ text });
    console.log(`✅ Created ${chunks.length} chunks\n`);

    chunks.forEach((chunk, i) => {
      console.log(`Chunk ${i + 1}: "${chunk.text}" (${chunk.tokenCount} tokens)`);
    });

    // Step 2: Add embeddings
    console.log('\n' + '='.repeat(60));
    console.log('\nStep 2: Adding embeddings to chunks...\n');

    const refinery = new EmbeddingsRefinery({
      embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2'
    });

    console.log('✅ EmbeddingsRefinery created');
    console.log(`Config: ${refinery.toString()}\n`);

    console.log('🔄 Calling API to add embeddings...\n');

    const refinedChunks = await refinery.refine(chunks);

    console.log(`✅ Refined ${refinedChunks.length} chunks with embeddings\n`);

    refinedChunks.forEach((chunk, i) => {
      console.log(`Refined Chunk ${i + 1}:`);
      console.log(`  Text: "${chunk.text}"`);
      console.log(`  Tokens: ${chunk.tokenCount}`);
      console.log(`  Position: [${chunk.startIndex}:${chunk.endIndex}]`);
      console.log();
    });

    console.log('='.repeat(60));
    console.log('\n🎉 Embeddings successfully added!\n');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
