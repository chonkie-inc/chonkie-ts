import { SdpmChunker } from "chonkie/cloud";

const CHONKIE_API_KEY = "<YOUR API KEY HERE>";

async function main() {
    // Initialize the SDPM chunker with your API key
    const chunker = new SdpmChunker(CHONKIE_API_KEY, {
        model: "sdpm-v1",           // SDPM model version
        chunkSize: 512,             // Target chunk size in tokens
        strategy: "semantic",       // Chunking strategy
        preserveStructure: true     // Whether to preserve document structure
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
            console.log(chunk.text);
            console.log(`--- (${chunk.text.length} characters)`);
            if ('metadata' in chunk) {
                console.log("Metadata:", chunk.metadata);
            }
        });
        
        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during SDPM chunking:", error);
    }
}

// Run the demo
main().catch(console.error);
