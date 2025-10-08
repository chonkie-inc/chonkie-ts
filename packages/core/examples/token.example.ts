import { TokenChunker } from '../src';

async function main() {
  console.log('🦛 Testing TokenChunker (Character-based)\n');

  try {
    const chunker = await TokenChunker.create({
      chunkSize: 50,
      chunkOverlap: 10
    });

    console.log('✅ TokenChunker created');
    console.log(`Config: ${chunker.toString()}\n`);

    const text = 'This is a test of the TokenChunker. It splits text into fixed-size token chunks. With character-based tokenization, each character is one token.';

    console.log(`📝 Input (${text.length} chars):`);
    console.log(`"${text}"\n`);

    const chunks = await chunker.chunk(text);

    console.log(`✅ Created ${chunks.length} chunks:\n`);

    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1}:`);
      console.log(`  Tokens: ${chunk.tokenCount}`);
      console.log(`  Position: [${chunk.startIndex}:${chunk.endIndex}]`);
      console.log(`  Text: "${chunk.text}"`);
      console.log();
    });

    // Test dynamic tokenizer (will show helpful error)
    console.log('='.repeat(60));
    console.log('\n🔍 Testing dynamic tokenizer detection:\n');

    try {
      const gpt2Chunker = await TokenChunker.create({
        tokenizer: 'gpt2',
        chunkSize: 50
      });
      console.log('✅ GPT-2 tokenizer loaded (you have @chonkiejs/token installed!)');
    } catch (error) {
      console.log('ℹ️  Expected behavior - @chonkiejs/token not installed:');
      console.log((error as Error).message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
