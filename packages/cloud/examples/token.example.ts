import { TokenChunker } from '../src';

async function main() {
  console.log('🦛 Testing TokenChunker with api.chonkie.ai\n');

  try {
    // Create chunker (will use CHONKIE_API_KEY from environment)
    const chunker = new TokenChunker({
      chunkSize: 50,
      chunkOverlap: 10,
      tokenizer: 'gpt2'
    });

    console.log('✅ TokenChunker created successfully');
    console.log(`Config: ${chunker.toString()}\n`);

    // Test chunking
    const text = 'This is a simple test to verify that the Chonkie cloud API is working correctly. We are testing the TokenChunker to make sure it can split text into token-based chunks using the remote API.';

    console.log(`📝 Input text (${text.length} chars):`);
    console.log(`"${text}"\n`);

    console.log('🔄 Sending request to api.chonkie.ai...\n');

    const chunks = await chunker.chunk({ text });

    console.log(`✅ Received ${chunks.length} chunks:\n`);

    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1}:`);
      console.log(`  Tokens: ${chunk.tokenCount}`);
      console.log(`  Position: [${chunk.startIndex}:${chunk.endIndex}]`);
      console.log(`  Text: "${chunk.text}"`);
      console.log();
    });

    // Verify reconstruction
    const reconstructed = chunks.map(c => c.text).join('');
    const matches = reconstructed === text;
    console.log(`🔍 Reconstruction: ${matches ? '✅ Perfect match' : '❌ Mismatch'}`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
