import { NeuralChunker } from "chonkie/cloud";

const CHONKIE_API_KEY = "e895eea7-390d-42d2-9f32-d368db22df57";

async function main() {
    // Initialize the neural chunker with your API key
    const chunker = new NeuralChunker(CHONKIE_API_KEY, {
        model: "mirth/chonky_modernbert_large_1",
        minCharactersPerChunk: 10,
    });

    // Example text to chunk
    const text = `Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. 
    AI research has been defined as the field of study of intelligent agents, which refers to any system that perceives its environment and takes actions that maximize its chance of achieving its goals.
    The traditional goals of AI research include reasoning, knowledge representation, planning, learning, natural language processing, perception, and the ability to move and manipulate objects.`;

    try {
        // Chunk the text
        console.log("Chunking text with neural chunker...");
        const chunks = await chunker.chunk({ text });

        console.log("Neural chunks:");
        chunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk.text);
            console.log(`--- (${chunk.text.length} characters)`);
        });

        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during neural chunking:", error);
    }
}

// Run the demo
main().catch(console.error);
