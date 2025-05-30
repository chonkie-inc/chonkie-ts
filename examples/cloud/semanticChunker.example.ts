import { SemanticChunker } from "chonkie/cloud";
import { SemanticChunk } from "chonkie/types";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const CHONKIE_API_KEY = process.env.CHONKIE_API_KEY || "";

async function main() {
    // Initialize the semantic chunker with your API key
    const chunker = new SemanticChunker(CHONKIE_API_KEY, {
        embeddingModel: "all-MiniLM-L6-v2",
    });

    // Example text about artificial intelligence
    const text = `Artificial intelligence (AI) is transforming industries across the globe. 
    From healthcare to finance, AI applications are becoming increasingly sophisticated. 
    Machine learning, a subset of AI, enables systems to learn from data without being explicitly programmed. 
    Deep learning takes this further with neural networks that mimic the human brain's structure and function. 
    Natural language processing allows machines to understand and generate human language.`;

    try {
        // Chunk the text semantically
        console.log("Chunking text with semantic chunker...");
        const chunks = await chunker.chunk({ text });
        
        console.log("Semantic chunks:");
        chunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk);
        });
        
        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during semantic chunking:", error);
    }
}

// Run the demo
main().catch(console.error);
