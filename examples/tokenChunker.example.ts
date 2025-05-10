// Example of running Chonkie's token chunker classes

import { TokenChunker } from "../src/chonkie";

async function main() {
    // Sample text for testing
   const sampleText = `According to all known laws of aviation, there is no way a bee should be able to fly. Its wings are too small to get its fat little body off the ground. The bee, of course, flies anyway because bees don't care what humans think is impossible. Yellow, black. Yellow, black. Yellow, black. Yellow, black. Ooh, black and yellow! Let's shake it up a little. Barry! Breakfast is ready! Coming! Hang on a second. Hello? - Barry? - Adam? - Can you believe this is happening? - I can't. I'll pick you up. Looking sharp. Use the stairs. Your father paid good money for those. Sorry. I'm excited. Here's the graduate. We're very proud of you, son. A perfect report card, all B's. Very proud. Ma! I got a thing going here.`;

    // Let's create a token chunker with the default tokenizer type
    const tokenChunker = await TokenChunker.create({tokenizerOrName: 'EleutherAI/gpt-j-6b', chunkSize: 100, chunkOverlap: 10});
    const chunks = await tokenChunker(sampleText);
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
    console.log("Original Text:", sampleText);
    console.log("Reconstruction Match:", reconstructedText === sampleText);

    // Verifying that the start and end index of the chunks are correct
    for (const chunk of chunks) {
      if (typeof chunk === 'string') {
        continue;
      }
      if (sampleText.slice(chunk.startIndex, chunk.endIndex) !== chunk.text) {
        console.log("Chunk:", chunk.text);
        console.log("Start Index:", chunk.startIndex);
        console.log("End Index:", chunk.endIndex);
        console.log("Text:", sampleText.slice(chunk.startIndex, chunk.endIndex));
        throw new Error("Chunk is not correct");
      }
    }
}

main().catch(console.error);