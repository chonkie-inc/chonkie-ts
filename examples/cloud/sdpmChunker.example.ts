import { SDPMChunker } from "chonkie/cloud";
import { SemanticChunk } from "chonkie/types";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const CHONKIE_API_KEY = process.env.CHONKIE_API_KEY || "";

async function main() {
    // Initialize the SDPM chunker with your API key
    const chunker = new SDPMChunker(CHONKIE_API_KEY, {
        chunkSize: 512,             // Target chunk size in tokens
    });

    // Example document text
    const text = `# Document Processing with SDPM

SDPM (Semantic Document Processing Model) is designed for advanced document understanding. 

## Features
- Semantic chunking of documents
- Structure-aware processing
- Support for various document types
- Context preservation across chunks

## Use Cases
- Legal document analysis
- Research paper processing
- Technical documentation
- Contract review`;

    try {
        // Chunk the document
        console.log("Chunking document with SDPM chunker...");
        const chunks = await chunker.chunk({ text });

        console.log("SDPM chunks:");
        chunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk);
        });

        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during SDPM chunking:", error);
    }
}

// Run the demo
main().catch(console.error);
