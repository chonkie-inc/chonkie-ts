// Example of running Chonkie's token chunker classes

import { TokenChunker } from "../src/chonkie";

async function main() {
    // Firstly, let's define some text to chunk
    const text = "Hello, world! This is a test of the token chunker. It should be able to chunk this text into smaller pieces.";

    // Let's create a token chunker with the default tokenizer type
    const tokenChunker = await TokenChunker.create({tokenizerOrName: 'EleutherAI/gpt-j-6b', chunkSize: 5});
    const chunks = await tokenChunker(text);
    console.log("Chunks:")
    console.log(chunks);

    // Let's check for reconstructability of the chunks
    const reconstructedText = chunks.map(chunk => {
      if (typeof chunk === 'string') {
        return chunk;
      }
      return chunk.text;
    }).join("");
    console.log("Reconstructed Text:", reconstructedText);
    console.log("Original Text:", text);
    console.log("Reconstruction Match:", reconstructedText === text);

    // Verifying that the start and end index of the chunks are correct
    for (const chunk of chunks) {
      if (typeof chunk === 'string') {
        continue;
      }
      if (text.slice(chunk.startIndex, chunk.endIndex) !== chunk.text) {
        console.log("Chunk:", chunk.text);
        console.log("Start Index:", chunk.startIndex);
        console.log("End Index:", chunk.endIndex);
        console.log("Text:", text.slice(chunk.startIndex, chunk.endIndex));
        throw new Error("Chunk is not correct");
      }
    }
}

main().catch(console.error);