// Example of running Chonkie's token chunker classes

import { TokenChunker } from "../src/chonkie";

async function main() {
    const tokenChunker = await TokenChunker.create({tokenizerOrName: 'gpt2'});
    const chunks = await tokenChunker('Hello, world!');
    console.log(chunks);
}

main().catch(console.error);