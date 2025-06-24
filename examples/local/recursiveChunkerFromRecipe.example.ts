/*
 * This example shows how to use the RecursiveChunker.fromRecipe method to create
 * a chunker instance using recursive rules from a recipe loaded from the hub.
 */

// Using selective import for better tree-shaking (avoids loading web-tree-sitter)
import { RecursiveChunker } from "chonkie/chunker/recursive";

async function main() {
    console.log("=== RecursiveChunker fromRecipe Example ===\n");

    // Sample text to chunk
    const text = `
    Natural language processing is a fascinating field. It combines linguistics and computer science!
    What makes it particularly interesting? The ability to understand human language.
    
    Machine learning has revolutionized this domain. Deep learning models can now process text effectively.
    However, challenges remain in understanding context and nuance.
    
    Recent advances in transformer models have shown remarkable capabilities in various tasks:
    1. Text generation
    2. Translation
    3. Summarization
    4. Question answering
    
    These developments continue to push the boundaries of what's possible in AI.
    `.trim();

    console.log("Sample text:");
    console.log(text);
    console.log("\n" + "=".repeat(50) + "\n");

    try {
        // Create a RecursiveChunker using the default recipe from the hub
        console.log("Creating RecursiveChunker from default recipe...");
        const chunker = await RecursiveChunker.fromRecipe({
            name: 'default',
            language: 'en',
            chunkSize: 150,  // Override chunk size
            minCharactersPerChunk: 30
        });

        console.log("✓ RecursiveChunker created successfully!");
        console.log("Chunk size:", chunker.chunkSize);
        console.log("Min characters per chunk:", chunker.minCharactersPerChunk);
        console.log("Number of recursive levels:", chunker.rules.length);
        console.log();

        // Display the recursive rules from the recipe
        console.log("Recursive rules from recipe:");
        for (let i = 0; i < chunker.rules.length; i++) {
            const level = chunker.rules.getLevel(i);
            console.log(`  Level ${i}: ${level?.toString()}`);
        }
        console.log();

        // Chunk the text
        console.log("Chunking text...");
        const chunks = await chunker(text);

        console.log(`✓ Created ${chunks.length} chunks:\n`);

        // Display each chunk
        chunks.forEach((chunk, index) => {
            console.log(`Chunk ${index + 1} (Level ${chunk.level}):`);
            console.log(`  Text: "${chunk.text}"`);
            console.log(`  Token count: ${chunk.tokenCount}`);
            console.log(`  Start index: ${chunk.startIndex}, End index: ${chunk.endIndex}`);
            console.log();
        });

        // Example with different recipe options
        console.log("=".repeat(50));
        console.log("Creating chunker with smaller chunk size...");
        
        const smallChunker = await RecursiveChunker.fromRecipe({
            name: 'default',
            language: 'en',
            chunkSize: 75,
            minCharactersPerChunk: 20
        });

        const smallChunks = await smallChunker(text);
        console.log(`✓ Created ${smallChunks.length} chunks with smaller chunk size`);
        
        // Show distribution by recursion level
        const levelCounts = new Map<number, number>();
        smallChunks.forEach(chunk => {
            const level = chunk.level ?? 0;
            levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
        });
        
        console.log("Chunk distribution by recursion level:");
        Array.from(levelCounts.entries()).sort().forEach(([level, count]) => {
            console.log(`  Level ${level}: ${count} chunks`);
        });

    } catch (error) {
        console.error("✗ Error:", error);
    }
}

main().catch(console.error);