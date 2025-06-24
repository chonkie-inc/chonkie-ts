// Example of running Chonkie's token chunker classes

// Using selective import for better tree-shaking (avoids loading web-tree-sitter)
import { TokenChunker } from "chonkie/chunker/token";
import { Chunk } from "chonkie/types";

async function main() {
    // Sample text for testing
    const simpleText = "Hello, World! This is a simple text. I am testing the token chunker and seeing if it works.";

    // Let's create a token chunker with the default tokenizer type
    const tokenChunker = await TokenChunker.create({ tokenizer: 'Xenova/gpt2', chunkSize: 5, chunkOverlap: 0 });
    const chunks = await tokenChunker(simpleText);
    console.log("Chunks:", chunks);

    // Let's check for reconstructability of the chunks
    const reconstructedText = chunks.map(chunk => {
        if (typeof chunk === 'string') {
            return chunk;
        }
        return chunk.text;
    }).join("");
    console.log("Reconstructed Text:", reconstructedText);
    console.log("Original Text     :", simpleText);
    console.log("Reconstruction Match:", reconstructedText === simpleText);

    // Verifying that the start and end index of the chunks are correct
    for (const chunk of chunks) {
        if (typeof chunk === 'string') {
            continue;
        }
        if (simpleText.slice(chunk.startIndex, chunk.endIndex) !== chunk.text) {
            console.log("Chunk:", chunk.text);
            console.log("Start Index:", chunk.startIndex);
            console.log("End Index:", chunk.endIndex);
            console.log("Text:", simpleText.slice(chunk.startIndex, chunk.endIndex));
            throw new Error("Chunk is not correct");
        }
    }
}

main().catch(console.error);