/**
 * This example demonstrates using RecursiveChunker with HuggingFace tokenizers.
 * Requires: npm install @chonkiejs/token
 */

import { RecursiveChunker, TokenChunker } from '../src';

async function main() {
  console.log('🦛 Testing Chonkie with HuggingFace Tokenizers\n');
  console.log('Note: This requires @chonkiejs/token to be installed\n');
  console.log('='.repeat(60));

  const text = 'This is a test. We are testing GPT-2 tokenization with Chonkie!';

  // Test 1: TokenChunker with GPT-2
  console.log('\n📝 Test 1: TokenChunker with GPT-2\n');
  try {
    const tokenChunker = await TokenChunker.create({
      tokenizer: 'Xenova/gpt2',
      chunkSize: 10
    });

    console.log('✅ GPT-2 tokenizer loaded');
    const chunks = await tokenChunker.chunk(text);
    console.log(`Created ${chunks.length} chunks`);
    chunks.forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.tokenCount} tokens]: "${c.text}"`);
    });
  } catch (error) {
    console.log('ℹ️  Expected if @chonkiejs/token not installed:');
    console.log((error as Error).message);
  }

  // Test 2: RecursiveChunker with GPT-2
  console.log('\n' + '='.repeat(60));
  console.log('\n📝 Test 2: RecursiveChunker with GPT-2\n');
  try {
    const recursiveChunker = await RecursiveChunker.create({
      tokenizer: 'Xenova/gpt2',
      chunkSize: 15
    });

    console.log('✅ GPT-2 tokenizer loaded');
    const chunks = await recursiveChunker.chunk(text);
    console.log(`Created ${chunks.length} chunks`);
    chunks.forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.tokenCount} tokens]: "${c.text}"`);
    });
  } catch (error) {
    console.log('ℹ️  Expected if @chonkiejs/token not installed:');
    console.log((error as Error).message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n🎉 Example completed!\n');
}

main();
