import { TokenChunker } from "chonkie/cloud";

const CHONKIE_API_KEY = "<YOUR API KEY HERE>";

async function main() {
    // Initialize the token chunker with your API key
    const chunker = new TokenChunker(CHONKIE_API_KEY, {});

    // Example text to chunk
    const text = `Tokenization is the process of converting a sequence of characters into a sequence of tokens. 
    Tokens can be words, characters, or subwords, depending on the tokenizer. 
    This chunker splits text based on token counts rather than characters or words, which is useful for models with context windows.`;

    try {
        // Chunk the text by tokens
        console.log("Chunking text with token chunker...");
        const chunks = await chunker.chunk({ text });

        console.log("Token chunks:");
        chunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk.text);
        });

        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during token chunking:", error);
    }
}

// Run the demo
main().catch(console.error);
