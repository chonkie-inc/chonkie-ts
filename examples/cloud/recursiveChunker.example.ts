import { RecursiveChunker } from "chonkie/cloud";

const CHONKIE_API_KEY = "<YOUR API KEY HERE>";

async function main() {
    // Initialize the recursive chunker with your API key
    const chunker = new RecursiveChunker(CHONKIE_API_KEY, {
        chunkSize: 300,           // Target chunk size in characters
        minChunkSize: 100,        // Minimum chunk size
        maxChunkSize: 500,        // Maximum chunk size
        separators: ["\n\n", ". ", "? ", "! ", " ", ""]  // Separators to try in order
    });

    // Example text with multiple paragraphs
    const text = `Machine learning is a branch of artificial intelligence (AI) and computer science which focuses on the use of data and algorithms to imitate the way that humans learn, gradually improving its accuracy.

Deep learning is a subset of machine learning, which is essentially a neural network with three or more layers. These neural networks attempt to simulate the behavior of the human brain—albeit far from matching its ability—allowing it to "learn" from large amounts of data.

Natural language processing (NLP) refers to the branch of computer science—and more specifically, the branch of artificial intelligence or AI—concerned with giving computers the ability to understand text and spoken words in much the same way human beings can.`;

    try {
        // Chunk the text recursively
        console.log("Chunking text with recursive chunker...");
        const chunks = await chunker.chunk({ text });
        
        console.log("Recursive chunks:");
        chunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk.text);
            console.log(`--- (${chunk.text.length} characters)`);
        });
        
        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during recursive chunking:", error);
    }
}

// Run the demo
main().catch(console_error);
