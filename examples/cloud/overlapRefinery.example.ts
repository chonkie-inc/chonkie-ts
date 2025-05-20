import { OverlapRefinery } from "chonkie/cloud";

const CHONKIE_API_KEY = "<YOUR API KEY HERE>";

async function main() {
    // Initialize the overlap refinery with your API key
    const refinery = new OverlapRefinery(CHONKIE_API_KEY, {
        overlapSize: 50,       // Number of characters to overlap
        minChunkSize: 100,    // Minimum chunk size after overlapping
        maxChunkSize: 500     // Maximum chunk size after overlapping
    });

    // Example chunks to refine with overlap
    const chunks = [
        { text: "Artificial intelligence is transforming industries across the globe. " +
                "From healthcare to finance, AI applications are becoming increasingly sophisticated." },
        { text: "Machine learning, a subset of AI, enables systems to learn from data without being explicitly programmed. " +
                "This technology powers many modern applications." },
        { text: "Deep learning takes this further with neural networks that mimic the human brain's structure and function. " +
                "These models can process complex patterns in data." }
    ];

    try {
        // Add overlap between chunks
        console.log("Adding overlap between chunks...");
        const refinedChunks = await refinery.refine(chunks);
        
        console.log("Refined chunks with overlap:");
        refinedChunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk.text);
            console.log(`--- (${chunk.text.length} characters)`);
        });
        
        console.log("\nTotal chunks after refinement:", refinedChunks.length);
    } catch (error) {
        console.error("Error during overlap refinement:", error);
    }
}

// Run the demo
main().catch(console.error);
