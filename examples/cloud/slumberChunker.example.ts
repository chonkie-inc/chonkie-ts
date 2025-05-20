import { SlumberChunker } from "chonkie/cloud";

const CHONKIE_API_KEY = "<YOUR API KEY HERE>";

async function main() {
    // Initialize the slumber chunker with your API key
    const chunker = new SlumberChunker(CHONKIE_API_KEY, {
        chunkSize: 100,           // Target chunk size in tokens
        overlap: 20,              // Token overlap between chunks
        model: "gpt-3.5-turbo",   // Model to use for chunking
        temperature: 0.7          // Temperature for any generative steps
    });

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
            console.log(chunk.text);
            console.log(`--- (${chunk.text.length} characters)`);
        });
        
        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during slumber chunking:", error);
    }
}

// Run the demo
main().catch(console.error);
