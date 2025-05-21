import { SentenceChunker } from "chonkie/cloud";
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
const CHONKIE_API_KEY = process.env.CHONKIE_API_KEY || "";

async function main() {
    // Initialize the sentence chunker with your API key
    const chunker = new SentenceChunker(CHONKIE_API_KEY, {
    });

    // Example text with multiple sentences and paragraphs
    const text = `The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet. It's often used for typing practice.

Artificial intelligence is revolutionizing many industries. From healthcare to finance, AI applications are becoming increasingly sophisticated. Machine learning, a subset of AI, enables systems to learn from data.

Natural language processing allows computers to understand human language. This technology powers virtual assistants and translation services. The field continues to advance rapidly.`;

    try {
        // Chunk the text by sentences
        console.log("Chunking text with sentence chunker...");
        const chunks = await chunker.chunk({ text });

        console.log("Sentence chunks:");
        chunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk);
        });

        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during sentence chunking:", error);
    }
}

// Run the demo
main().catch(console.error);
