// Example of running Chonkie's tokenizer classes

import { Tokenizer } from "../src/chonkie/tokenizer";

async function main() {
    const tokenizer = await Tokenizer.create('gpt2');
    const tokens = await tokenizer.encode('Hello, world!');
    console.log(tokens);
}

main().catch(console.error);