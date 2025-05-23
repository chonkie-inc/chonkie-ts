import { SlumberChunker } from "chonkie/cloud";
import { Chunk } from "chonkie/types";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const CHONKIE_API_KEY = process.env.CHONKIE_API_KEY || "";

async function main() {
    // Initialize the slumber chunker with your API key
    const chunker = new SlumberChunker(CHONKIE_API_KEY, {});

    // Example text to chunk
    const text = `The Slumber chunker is designed to handle long documents efficiently. 
    It uses smart strategies to break down content while preserving context. 
    This is particularly useful for processing large documents where maintaining semantic coherence is important. 
    The chunker can handle various types of content including technical documentation, articles, and more.`;

    try {
        // Chunk the text
        console.log("Chunking text with slumber chunker...");
        const chunks = await chunker.chunk({ text });

        console.log("Slumber chunks:");
        chunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk);
        });

        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during slumber chunking:", error);
    }
}

// Run the demo
main().catch(console.error);
