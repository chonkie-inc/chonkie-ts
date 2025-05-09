// Example of running Chonkie's tokenizer classes

import { Tokenizer } from "../src/chonkie/tokenizer";
// import { AutoTokenizer } from "@huggingface/transformers";

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

// async function testGPT2() {
//     try {
//         const tokenizer = await AutoTokenizer.from_pretrained("EleutherAI/gpt-j-6b");
//         const text = "Hello, world! This is a test of the token chunker. It should be able to chunk this text into smaller pieces.";
//         const encoding = await tokenizer.encode(text);
//         console.log("Raw encoding:", encoding);
//         console.log("Input IDs:", encoding);

//         // Check for undefined in input_ids
//         const hasUndefined = encoding.some(id => id === undefined);
//         console.log("Input IDs contain undefined:", hasUndefined);

//         const decodedText = tokenizer.decode(encoding, { skip_special_tokens: true });
//         console.log("Decoded text:", decodedText);

//     } catch (error) {
//         console.error("Error during direct tokenizer test:", error);
//     }
// }

// testGPT2();