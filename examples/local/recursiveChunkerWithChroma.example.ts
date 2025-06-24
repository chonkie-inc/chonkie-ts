// Example of using RecursiveChunker with ChromaHandshake for vector storage

// Using selective imports for better tree-shaking (avoids loading web-tree-sitter and other deps)
import { RecursiveChunker } from "chonkie/chunker/recursive";
import { ChromaHandshake } from "chonkie/friends";

async function main() {
    // Sample text for testing
    const sampleText = `# Chunking Strategies in Retrieval-Augmented Generation: A Comprehensive Analysis

In the rapidly evolving landscape of natural language processing, Retrieval-Augmented Generation (RAG) has emerged as a groundbreaking approach that bridges the gap between large language models and external knowledge bases. At the heart of these systems lies a crucial yet often overlooked process: chunking. This fundamental operation, which involves the systematic decomposition of large text documents into smaller, semantically meaningful units, plays a pivotal role in determining the overall effectiveness of RAG implementations.

The process of text chunking in RAG applications represents a delicate balance between competing requirements. On one side, we have the need for semantic coherence – ensuring that each chunk maintains meaningful context that can be understood and processed independently. On the other, we must optimize for information density, ensuring that each chunk carries sufficient signal without excessive noise that might impede retrieval accuracy. This balancing act becomes particularly crucial when we consider the downstream implications for vector databases and embedding models that form the backbone of modern RAG systems.

The selection of appropriate chunk size emerges as a fundamental consideration that significantly impacts system performance. Through extensive experimentation and real-world implementations, researchers have identified that chunks typically perform optimally in the range of 256 to 1024 tokens. However, this range should not be treated as a rigid constraint but rather as a starting point for optimization based on specific use cases and requirements. The implications of chunk size selection ripple throughout the entire RAG pipeline, affecting everything from storage requirements to retrieval accuracy and computational overhead.

Fixed-size chunking represents the most straightforward approach to document segmentation, offering predictable memory usage and consistent processing time. However, this apparent simplicity comes with significant drawbacks. By arbitrarily dividing text based on token or character count, fixed-size chunking risks fragmenting semantic units and disrupting the natural flow of information. Consider, for instance, a technical document where a complex concept is explained across several paragraphs – fixed-size chunking might split this explanation at critical junctures, potentially compromising the system's ability to retrieve and present this information coherently.

In response to these limitations, semantic chunking has gained prominence as a more sophisticated alternative. This approach leverages natural language understanding to identify meaningful boundaries within the text, respecting the natural structure of the document. Semantic chunking can operate at various levels of granularity, from simple sentence-based segmentation to more complex paragraph-level or topic-based approaches. The key advantage lies in its ability to preserve the inherent semantic relationships within the text, leading to more meaningful and contextually relevant retrieval results.`;

    // Create a RecursiveChunker with a reasonable chunk size
    const recursiveChunker = await RecursiveChunker.create({
        tokenizer: 'Xenova/gpt2',
        chunkSize: 200
    });

    // Chunk the text
    console.log("Chunking text...");
    const chunks = await recursiveChunker(sampleText);
    console.log(`Created ${chunks.length} chunks`);

    // Initialize ChromaHandshake with localhost:8000 path
    // Default logLevel is 'verbose' - set to 'silent' to suppress logs
    const chromaHandshake = new ChromaHandshake(
        undefined, // client (will be created automatically)
        "rag_example_collection", // collection name
        "http://localhost:8000", // path to Chroma instance
        'verbose' // logLevel: 'verbose' or 'silent'
    );

    try {
        // Store chunks in Chroma
        console.log("\nStoring chunks in Chroma...");
        await chromaHandshake.write(chunks);

        // Query the stored chunks
        console.log("\nQuerying stored chunks...");
        const queryResults = await chromaHandshake.query("semantic chunking", 3);
        
        console.log(`Found ${queryResults.length} relevant chunks:`);
        queryResults.forEach((chunk: any, index: number) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(`Text: ${chunk.text.substring(0, 100)}...`);
            console.log(`Token count: ${chunk.tokenCount}`);
            console.log(`Start index: ${chunk.startIndex}`);
            console.log(`End index: ${chunk.endIndex}`);
        });

    } catch (error) {
        console.error("Error connecting to Chroma:", error);
        console.log("Make sure Chroma is running on localhost:8000");
        console.log("You can start it with: docker run -p 8000:8000 chromadb/chroma");
    }
}

main().catch(console.error);