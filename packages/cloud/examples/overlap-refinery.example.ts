import { TokenChunker, OverlapRefinery } from '../src';

async function main() {
  console.log('🦛 Testing OverlapRefinery with api.chonkie.ai\n');

  try {
    // Step 1: Create chunks
    console.log('Step 1: Creating chunks without overlap...\n');

    const chunker = new TokenChunker({
      chunkSize: 40,
      chunkOverlap: 0  // No overlap initially
    });

    const text = 'The quick brown fox jumps over the lazy dog. This sentence demonstrates overlap refinement. Context is preserved across boundaries.';

    console.log(`📝 Input (${text.length} chars):`);
    console.log(`"${text}"\n`);

    const chunks = await chunker.chunk({ text });
    console.log(`✅ Created ${chunks.length} chunks (no overlap)\n`);

    chunks.forEach((chunk, i) => {
      console.log(`Chunk ${i + 1}: "${chunk.text.substring(0, 50)}${chunk.text.length > 50 ? '...' : ''}" (${chunk.tokenCount} tokens)`);
    });

    // Step 2: Add overlap
    console.log('\n' + '='.repeat(60));
    console.log('\nStep 2: Adding overlap for context...\n');

    const refinery = new OverlapRefinery({
      contextSize: 0.25,  // 25% overlap
      mode: 'token',
      method: 'suffix'
    });

    console.log('✅ OverlapRefinery created');
    console.log(`Config: ${refinery.toString()}\n`);

    console.log('🔄 Calling API to add overlap...\n');

    const refinedChunks = await refinery.refine(chunks);

    console.log(`✅ Refined ${refinedChunks.length} chunks with overlap\n`);

    refinedChunks.forEach((chunk, i) => {
      console.log(`Refined Chunk ${i + 1}:`);
      console.log(`  Text: "${chunk.text.substring(0, 60)}${chunk.text.length > 60 ? '...' : ''}"`);
      console.log(`  Tokens: ${chunk.tokenCount}`);
      console.log(`  Position: [${chunk.startIndex}:${chunk.endIndex}]`);
      console.log();
    });

    console.log('='.repeat(60));
    console.log('\n💡 Notice: Chunks now have overlapping context for better coherence!\n');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
