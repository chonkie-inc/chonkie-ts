import { RecursiveChunker } from "chonkie/cloud";
import { RecursiveChunk } from "chonkie/types";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const CHONKIE_API_KEY = process.env.CHONKIE_API_KEY || "";

async function main() {
    // Initialize the late chunker with your API key
    const chunker = new RecursiveChunker(CHONKIE_API_KEY, {
        chunkSize: 512,                      // Default chunk size
        recipe: "default",                   // Default recipe
        lang: "en",                          // Default language
        minCharactersPerChunk: 24            // Minimum characters per chunk
    });

    // Example text to chunk
    const text = `Retrieval-Augmented Generation (RAG) has emerged as a powerful paradigm for enhancing large language models with external knowledge. 
                The effectiveness of RAG systems heavily depends on the thoughtful implementation of appropriate chunking strategies. 
                While the field continues to evolve, practitioners must carefully consider their specific use cases and requirements when designing chunking solutions. 
                Factors such as document characteristics, retrieval patterns, and performance requirements should guide the selection and optimization of chunking strategies.`;

    try {
        // Chunk a single text
        console.log("Chunking single text...");
        const chunks = await chunker.chunk({ text: text });
        console.log("Chunks:", chunks);
        console.log("embeddings: ", (chunks as RecursiveChunk[]).map(chunk => chunk.embedding));
        console.log("\nNumber of chunks:", chunks.length);

        // Example of chunking multiple texts
        const texts = [
            "This is the first document to chunk.",
            "This is another document that needs to be processed."
        ];

        console.log("\nChunking multiple texts...");
        const batchChunks = await chunker.chunkBatch([{ text: texts[0] }, { text: texts[1] }]);
        console.log("Batch chunks:", batchChunks);
        console.log("\nNumber of documents processed:", batchChunks.length);

        // Example with custom configuration
        const customChunker = new RecursiveChunker(CHONKIE_API_KEY, {
            chunkSize: 256,                    // Smaller chunks
            recipe: "default",
            lang: "en",
            minCharactersPerChunk: 50          // Higher minimum characters
        });

        console.log("\nChunking with custom configuration...");
        const customChunks = await customChunker.chunk({ text: text });
        console.log("Custom chunks:", customChunks);
        console.log("\nNumber of custom chunks:", customChunks.length);

        // Chunk the main README.md file
        const markdownChunker = new RecursiveChunker(CHONKIE_API_KEY, {
            chunkSize: 512,
            recipe: "markdown",
            lang: "en",
            minCharactersPerChunk: 24
        });
        console.log("\nChunking README.md...");
        const readme = "README.md";  // run this from the root of the project
        const readmeChunks = await markdownChunker.chunk({ filepath: readme });
        console.log("README.md chunks:", readmeChunks);
        console.log("\nNumber of README.md chunks:", readmeChunks.length);
    } catch (error) {
        console.error("Error during chunking:", error);
    }
}

// Run the demo
main().catch(console.error); 