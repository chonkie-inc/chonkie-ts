/*
 * This example shows how to use the SentenceChunker.fromRecipe method to create
 * a chunker instance using delimiters and settings from a recipe loaded from the hub.
 */

// Using selective import for better tree-shaking (avoids loading web-tree-sitter)
import { SentenceChunker } from "chonkie/chunker/sentence";

async function main() {
    console.log("=== SentenceChunker fromRecipe Example ===\n");

    // Sample text to chunk
    const text = `
    Natural language processing is a fascinating field. It combines linguistics and computer science!
    What makes it particularly interesting? The ability to understand human language.
    
    Machine learning has revolutionized this domain. Deep learning models can now process text effectively.
    However, challenges remain in understanding context and nuance.
    `.trim();

    console.log("Sample text:");
    console.log(text);
    console.log("\n" + "=".repeat(50) + "\n");

    try {
        // Create a SentenceChunker using the default recipe from the hub
        console.log("Creating SentenceChunker from default recipe...");
        const chunker = await SentenceChunker.fromRecipe({
            name: 'default',
            language: 'en',
            chunkSize: 100,  // Override chunk size
            chunkOverlap: 10
        });

        console.log("✓ SentenceChunker created successfully!");
        console.log("Recipe delimiters:", chunker.delim);
        console.log("Include delimiter mode:", chunker.includeDelim);
        console.log("Chunk size:", chunker.chunkSize);
        console.log("Chunk overlap:", chunker.chunkOverlap);
        console.log();

        // Chunk the text
        console.log("Chunking text...");
        const chunks = await chunker(text);

        console.log(`✓ Created ${chunks.length} chunks:\n`);

        // Display each chunk
        chunks.forEach((chunk, index) => {
            console.log(`Chunk ${index + 1}:`);
            console.log(`  Text: "${chunk.text}"`);
            console.log(`  Token count: ${chunk.tokenCount}`);
            console.log(`  Sentences: ${chunk.sentences.length}`);
            console.log(`  Start index: ${chunk.startIndex}, End index: ${chunk.endIndex}`);
            console.log();
        });

        // Example with different recipe options
        console.log("=".repeat(50));
        console.log("Creating chunker with custom options...");
        
        const customChunker = await SentenceChunker.fromRecipe({
            name: 'default',
            language: 'en',
            chunkSize: 50,
            minSentencesPerChunk: 2,
            minCharactersPerSentence: 20
        });

        const customChunks = await customChunker(text);
        console.log(`✓ Created ${customChunks.length} chunks with custom options`);

    } catch (error) {
        console.error("✗ Error:", error);
    }
}

main().catch(console.error);