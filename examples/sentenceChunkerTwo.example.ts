// Example of running Chonkie's sentence chunker classes

import { SentenceChunker } from "../src/chonkie";

async function main() {
    // Firstly, let's define some text to chunk
    const text = "Hello, world! This is a test of the sentence chunker. It should be able to chunk this text into smaller pieces.";

    // Let's create a token chunker with the default tokenizer type
    const sentenceChunker = await SentenceChunker.create({tokenizerOrName: 'EleutherAI/gpt-j-6b', chunkSize: 5});
    const splits = sentenceChunker._splitText(text);
    console.log("Splits:", splits);
}

main().catch(console.error);