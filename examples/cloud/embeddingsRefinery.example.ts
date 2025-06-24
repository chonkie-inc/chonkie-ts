// Using selective imports for better tree-shaking and consistency
import { TokenChunker } from "chonkie/chunker/token";
import { Chunk } from "chonkie/types";
import { EmbeddingsRefinery } from "chonkie/cloud";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const CHONKIE_API_KEY = process.env.CHONKIE_API_KEY || "";

async function main() {
    // Initialize the embeddings refinery with your API key
    const refinery = new EmbeddingsRefinery(CHONKIE_API_KEY, {
        embeddingModel: "all-MiniLM-L6-v2",  // Embedding model to use
    });

    // Chunk some text to get chunks first.
    const chunker = await TokenChunker.create({
        chunkSize: 512,
        chunkOverlap: 50,
    });
    const chunks = await chunker.chunk("Some sample text to chunk. Here is some more text to chunk. And here is some more text to chunk.");

    try {
        // Add embeddings to chunks
        console.log("Adding embeddings to chunks...");
        const refinedChunks = await refinery.refine(chunks as Chunk[]);

        console.log("Refined chunks with embeddings:");
        refinedChunks.forEach((chunk: Chunk, index: number) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk);
        });
        
        console.log("\nTotal chunks processed:", refinedChunks.length);
    } catch (error) {
        console.error("Error during embeddings refinement:", error);
    }
}

// Run the demo
main().catch(console.error);
