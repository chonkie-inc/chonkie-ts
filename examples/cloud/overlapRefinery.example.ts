// Using selective imports for better tree-shaking and consistency
import { OverlapRefinery } from "chonkie/cloud";
import { TokenChunker } from "chonkie/chunker/token";
import { Chunk } from "chonkie/types";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const CHONKIE_API_KEY = process.env.CHONKIE_API_KEY || "";

async function main() {
    // Initialize the overlap refinery with your API key
    const refinery = new OverlapRefinery(CHONKIE_API_KEY, {
        tokenizerOrTokenCounter: "character",
        contextSize: 0.25,
        mode: "token",
        method: "suffix",
        recipe: "default",
        lang: "en",
        merge: true,
    });

    // Example chunks to refine with overlap
    const text = "Artificial intelligence is transforming industries across the globe. " +
        "From healthcare to finance, AI applications are becoming increasingly sophisticated. Machine learning, a subset of AI, enables systems to learn from data without being explicitly programmed. " +
        "This technology powers many modern applications. Deep learning takes this further with neural networks that mimic the human brain's structure and function. These models can process complex patterns in data.";

    // chunk the text
    const chunker = await TokenChunker.create({
        chunkSize: 64,
    });
    const chunks = await chunker.chunk(text);
    console.log("Original chunks:")
    chunks.forEach((chunk, index) => {
        console.log(`\nChunk ${index + 1}:`);
        console.log(chunk);
    });
    try {
        // Add overlap between chunks
        console.log("Adding overlap between chunks...");
        const refinedChunks = await refinery.refine(chunks as Chunk[]);

        console.log("Refined chunks with overlap:");
        refinedChunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk);
        });

        console.log("\nTotal chunks after refinement:", refinedChunks.length);
    } catch (error) {
        console.error("Error during overlap refinement:", error);
    }
}

// Run the demo
main().catch(console.error);
