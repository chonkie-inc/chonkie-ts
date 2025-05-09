/*
 * Instructions:
 * 1. Build the project in src: `npm run build`
 * 2. Go to the demo directory: `cd demo`
 * 3. (Run only once) `npm init -y`
 * 4. (Uninstall if already installed) `npm uninstall chonkie`
 * 5. In the demo directory, `npm install ../`
 * 6. Run the script: `npx ts-node index.ts`
 */


import { SentenceChunker, SentenceChunk, CodeChunker, CodeChunk, RecursiveChunker, RecursiveChunk, Visualizer, Chunk, LateChunker } from 'chonkie';
import { SentenceChunker as CloudSentenceChunker, CodeChunker as CloudCodeChunker } from 'chonkie/cloud';

async function main() {
    // Example 1: Using local chunkers
    const sentenceChunker = await LateChunker.create({embeddingModel: 'all-MiniLM-L6-v2'});
    const codeChunker = await CodeChunker.create({lang: 'python', chunkSize: 1500});
    const recursiveChunker = await RecursiveChunker.create({chunkSize: 1500});

    // const text = "This is a sample text. It has multiple sentences. Each sentence should be chunked separately.";
    // const chunks = await sentenceChunker(text, true);
    // console.log('Local Sentence Chunks:', chunks);
    // for (const chunk of chunks) {
    //     if (chunk instanceof SentenceChunk) {
    //         console.log(chunk.sentences);
    //     }
    // }

    // // // Chunk some code
    const code = `
     def add(a, b):
        return a + b
    `;
    const codeChunks = await codeChunker.chunk(code);
    console.log('Local Code Chunks:', codeChunks);


    // Example 2: Using cloud chunkers
    // const cloudSentenceChunker = new CloudSentenceChunker(
    //     "e895eea7-390d-42d2-9f32-d368db22df57",
    //     {
    //         chunkSize: 1024,
    //         returnType: 'chunks'
    //     }
    // );
    // const cloudCodeChunker = new CloudCodeChunker(
    //     "e895eea7-390d-42d2-9f32-d368db22df57", 
    //     {
    //         chunkSize: 1024,
    //         returnType: 'chunks',
    //         language: 'python'
    //     }
    // );

    // // Chunk text using cloud
    // const cloudChunks = await cloudSentenceChunker.chunk(text);
    //     console.log('Cloud Sentence Chunks:', cloudChunks);

    //     // Chunk code using cloud
    //     const cloudCodeChunks = await cloudCodeChunker.chunk(code);
    //     console.log('Cloud Code Chunks:', cloudCodeChunks);
    // 
}

main().catch(console.error); 