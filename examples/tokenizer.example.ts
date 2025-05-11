// Example of running Chonkie's tokenizer classes

import { Tokenizer } from "../src/chonkie/tokenizer";

async function main() {
    // Firstly, let's define some text to chunk
    const text = "Hello, world! This is a test of the token chunker. It should be able to chunk this text into smaller pieces.";

    // Let's create a tokenizer with the default tokenizer type
    const tokenizer = await Tokenizer.create('EleutherAI/gpt-j-6b');
    const tokens = await tokenizer.encode(text);
    console.log("Tokens:", tokens); 

    // Now, let's decode the tokens back to text
    const decodedText = await tokenizer.decode(tokens);
    console.log("Decoded Text:", decodedText);
}

main().catch(console.error);