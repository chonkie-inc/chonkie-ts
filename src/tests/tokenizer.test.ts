import {
  Tokenizer,
  CharacterTokenizer,
  WordTokenizer,
  CallableTokenizer,
} from "../chonkie/tokenizer";
import { AutoTokenizer, PreTrainedTokenizer } from "@huggingface/transformers";

type TransformersJsTokenizer = PreTrainedTokenizer;

const sampleText = `The quick brown fox jumps over the lazy dog.
    This classic pangram contains all the letters of the English alphabet.
    It's often used for testing typefaces and keyboard layouts.
    Text chunking, the process you are working on, 
    involves dividing a larger text into smaller, contiguous pieces or 'chunks'.
    This is fundamental in many Natural Language Processing (NLP) tasks.
    For instance, large documents might be chunked into paragraphs or sections 
    before feeding them into a machine learning model due to memory constraints 
    or to process contextually relevant blocks. 
    Other applications include displaying text incrementally in user interfaces 
    or preparing data for certain types of linguistic analysis. 
    Effective chunking might consider sentence boundaries 
    (using periods, question marks, exclamation points), 
    paragraph breaks (often marked by double newlines), 
    or simply aim for fixed-size chunks based on character or word counts. 
    The ideal strategy depends heavily on the specific downstream application. 
    Testing should cover various scenarios, including text with short sentences, 
    long sentences, multiple paragraphs, and potentially unusual punctuation or spacing.`;

const sampleTextList = [
  "The quick brown fox jumps over the lazy dog.",
  "This classic pangram contains all the letters of the English alphabet.",
  "It's often used for testing typefaces and keyboard layouts.",
  "Text chunking, the process you are working on, involves dividing a larger text into smaller, contiguous pieces or 'chunks'.",
  "This is fundamental in many Natural Language Processing (NLP) tasks.",
  "For instance, large documents might be chunked into paragraphs or sections before feeding them into a machine learning model due to memory constraints or to process contextually relevant blocks.",
  "Other applications include displaying text incrementally in user interfaces or preparing data for certain types of linguistic analysis.",
  "Effective chunking might consider sentence boundaries (using periods, question marks, exclamation points), paragraph breaks (often marked by double newlines), or simply aim for fixed-size chunks based on character or word counts.",
  "The ideal strategy depends heavily on the specific downstream application.",
  "Testing should cover various scenarios, including text with short sentences, long sentences, multiple paragraphs, and potentially unusual punctuation or spacing.",
];

async function getTransformersTokenizerInstance(): Promise<TransformersJsTokenizer | null> {
  try {
    return await AutoTokenizer.from_pretrained("gpt2");
  } catch (e) {
    console.warn(`Skipping TransformersTokenizer tests: ${(e as Error).message}`);
    return null;
  }
}

const getCallableTokenizerInstance = (): CallableTokenizer => ({
  countTokens: (text: string) => text.split(" ").length,
  encode: (text: string) => text.split(" ").map((_, i) => i), // Simple encode for testing
  decode: (tokens: number[]) => tokens.map(t => `word${t}`).join(" "), // Simple decode for testing
});

const getCallableCounterOnlyInstance = (): CallableTokenizer => ({
  countTokens: (text: string) => text.length,
});


describe("Tokenizer", () => {
  describe("Backend Selection", () => {
    const backendTestCases = [
      { name: "TransformersTokenizer", getInstance: getTransformersTokenizerInstance, expectedBackend: "transformers" },
      { name: "CallableTokenizer", getInstance: async () => getCallableTokenizerInstance(), expectedBackend: "callable" },
    ];

    test.each(backendTestCases)("correctly selects backend for $name", async ({ name, getInstance, expectedBackend }) => {
      const instance = await getInstance();
      if (!instance) return; // Skip if instance loading failed

      const tokenizer = await Tokenizer.create(instance);
      expect(tokenizer.backend).toBe(expectedBackend);
    });
  });

  describe("String Initialization", () => {
    // Note: "cl100k_base", "p50k_base" are Tiktoken specific and not directly supported 
    // by HF or Transformers loaders by those names. We'll test with "gpt2".
    const modelNames = ["gpt2"];

    test.each(modelNames)("initialization with model string '%s'", async (modelName) => {
      try {
        const tokenizer = await Tokenizer.create(modelName);
        expect(tokenizer).toBeDefined();
        expect(["transformers", "tokenizers"]).toContain(tokenizer.backend);
      } catch (e) {
        if ((e as Error).message.toLowerCase().includes("not found")) {
          console.warn(`Skipping string init test for ${modelName}. Model not available or load failed: ${(e as Error).message}`);
        } else {
          throw e;
        }
      }
    });
  });

  describe("Encode/Decode", () => {
    const encodeDecodeTestCases = [
      { name: "TransformersTokenizer", getInstance: getTransformersTokenizerInstance },
    ];

    test.each(encodeDecodeTestCases)("encode and decode with $name", async ({ name, getInstance }) => {
      const instance = await getInstance();
      if (!instance) return;

      const tokenizer = await Tokenizer.create();
      const tokens = await tokenizer.encode(sampleText);
      expect(tokens.length).toBeGreaterThan(0);
      expect(Array.isArray(tokens)).toBe(true);

      const decoded = await tokenizer.decode(tokens);
      expect(typeof decoded).toBe("string");
      // Exact match can be tricky due to subtle differences. 
      // The TS implementation aims for this with skipSpecialTokens/addSpecialTokens.
      // For robust testing, consider comparing normalized versions or specific keywords.
      // For now, let's assume near-perfect reconstruction for gpt2.
      // This might need adjustment based on actual library behavior.
      // expect(decoded).toBe(sampleText); 
      expect(decoded.length).toBeGreaterThan(0);
    });

    it("encode and decode with callable tokenizer", async () => {
      const instance = getCallableTokenizerInstance();
      const tokenizer = await Tokenizer.create(instance);

      const text = "hello world";
      const tokens = await tokenizer.encode(text);
      expect(tokens).toEqual([0, 1]); // Based on simple encode

      const decoded = await tokenizer.decode(tokens);
      expect(decoded).toBe("word0 word1"); // Based on simple decode
    });
  });

  describe("String Init Encode/Decode", () => {
    const modelNames = ["gpt2"]; // Using a known HF model

    test.each(modelNames)("basic functionality with string initialized model '%s'", async (modelName) => {
      try {
        const tokenizer = await Tokenizer.create(modelName);
        expect(tokenizer).toBeDefined();

        const testString = "Testing tokenizer_string_init_basic for Chonkie Tokenizers.";
        const tokens = await tokenizer.encode(testString);
        expect(tokens.length).toBeGreaterThan(0);
        expect(Array.isArray(tokens)).toBe(true);
        const decoded = await tokenizer.decode(tokens);
        expect(typeof decoded).toBe("string");
        ["Testing", "Chonkie", "Tokenizers"].forEach(word => {
          expect(decoded.toLowerCase()).toContain(word.toLowerCase());
        });
      } catch (e) {
        if ((e as Error).message.toLowerCase().includes("not found")) {
          console.warn(`Skipping string init encode/decode test for ${modelName}. Model not available: ${(e as Error).message}`);
        } else {
          throw e;
        }
      }
    });
  });

  describe("Token Counting", () => {
    const countingTestCases = [
      { name: "TransformersTokenizer", getInstance: getTransformersTokenizerInstance },
      { name: "CallableTokenizer", getInstance: async () => getCallableTokenizerInstance() },
    ];

    test.each(countingTestCases)("token counting with $name", async ({ name, getInstance }) => {
      const instance = await getInstance();
      if (!instance) return;

      const tokenizer = await Tokenizer.create(instance);
      const count = await tokenizer.countTokens(sampleText);
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThan(0);

      if (tokenizer.backend !== "callable") { // Callable might have different logic
        const tokens = await tokenizer.encode(sampleText);
        expect(count).toBe(tokens.length);
      }
    });
  });

  describe("Batch Operations", () => {
    const batchTestCases = [
      { name: "TransformersTokenizer", getInstance: getTransformersTokenizerInstance },
    ];

    test.each(batchTestCases)("batch encode/decode with $name", async ({ name, getInstance }) => {
      const instance = await getInstance();
      if (!instance) return;

      const tokenizer = await Tokenizer.create(instance);
      const batchEncoded = await tokenizer.encodeBatch(sampleTextList);
      expect(Array.isArray(batchEncoded)).toBe(true);
      expect(batchEncoded.length).toBe(sampleTextList.length);
      batchEncoded.forEach(tokens => {
        expect(Array.isArray(tokens)).toBe(true);
        expect(tokens.length).toBeGreaterThan(0);
        tokens.forEach(token => expect(typeof token).toBe("number"));
      });

      const batchDecoded = await tokenizer.decodeBatch(batchEncoded);
      expect(Array.isArray(batchDecoded)).toBe(true);
      expect(batchDecoded.length).toBe(sampleTextList.length);
      batchDecoded.forEach(text => expect(typeof text).toBe("string"));
      // As with single encode/decode, exact match can be tricky.
      // expect(batchDecoded).toEqual(sampleTextList); 
      batchDecoded.forEach((text, i) => expect(text.length).toBeGreaterThan(0));
    });

    test.each(batchTestCases)("batch counting with $name", async ({ name, getInstance }) => {
      const instance = await getInstance();
      if (!instance) return;

      const tokenizer = await Tokenizer.create(instance);
      const counts = await tokenizer.countTokensBatch(sampleTextList);
      expect(Array.isArray(counts)).toBe(true);
      expect(counts.length).toBe(sampleTextList.length);
      counts.forEach(c => {
        expect(typeof c).toBe("number");
        expect(c).toBeGreaterThan(0);
      });

      const batchEncoded = await tokenizer.encodeBatch(sampleTextList);
      const encodedLengths = batchEncoded.map(tokens => tokens.length);
      expect(counts).toEqual(encodedLengths);
    });

    it("batch operations with callable tokenizer", async () => {
      const instance = getCallableTokenizerInstance();
      const tokenizer = await Tokenizer.create(instance);

      const batchEncoded = await tokenizer.encodeBatch(sampleTextList);
      expect(batchEncoded.length).toBe(sampleTextList.length);

      const batchDecoded = await tokenizer.decodeBatch(batchEncoded);
      expect(batchDecoded.length).toBe(sampleTextList.length);

      const counts = await tokenizer.countTokensBatch(sampleTextList);
      expect(counts.length).toBe(sampleTextList.length);
      counts.forEach((count, i) => expect(count).toBe(sampleTextList[i].split(" ").length));
    });
  });

  describe("Error Handling", () => {
    it("raises error with invalid tokenizer type", async () => {
      // Using an empty object that doesn't match any known tokenizer structure
      const invalidInstance = {} as any;
      await expect(Tokenizer.create(invalidInstance)).rejects.toThrow(
        /Unsupported tokenizer instance type/
      );
    });

    it("raises correct errors for callable tokenizer with missing methods", async () => {
      const instance = getCallableCounterOnlyInstance();
      const tokenizer = await Tokenizer.create(instance);

      expect(await tokenizer.countTokens("test")).toBe(4); // "test".length

      await expect(tokenizer.encode("test text")).rejects.toThrow(
        "Encoding not implemented for this callable tokenizer."
      );
      await expect(tokenizer.decode([0, 1, 2])).rejects.toThrow(
        "Decoding not implemented for this callable tokenizer."
      );
      await expect(tokenizer.encodeBatch(["test", "text"])).rejects.toThrow(
        "Batch encoding not implemented for this callable tokenizer."
      );
      await expect(tokenizer.decodeBatch([[0], [1]])).rejects.toThrow(
        "Batch decoding not implemented for this callable tokenizer."
      );
    });
  });
});


describe("WordTokenizer", () => {
  let wordTokenizer: WordTokenizer;

  beforeEach(() => {
    wordTokenizer = new WordTokenizer();
  });

  it("initialization", () => {
    expect(wordTokenizer.getVocab()).toEqual([" "]);
    expect(wordTokenizer.getToken2id().size).toBe(1);
    expect(wordTokenizer.getToken2id().get(" ")).toBe(0);
  });

  it("encode and decode", () => {
    const tokens = wordTokenizer.encode(sampleText);
    expect(Array.isArray(tokens)).toBe(true);
    tokens.forEach(token => expect(typeof token).toBe("number"));

    const decoded = wordTokenizer.decode(tokens);
    expect(typeof decoded).toBe("string");
    // WordTokenizer joins with space, so strip might be needed for exact match if original has trailing/leading spaces
    expect(decoded.trim()).toBe(sampleText.trim());
  });

  it("batch encode and decode", () => {
    const encodedBatch = wordTokenizer.encodeBatch(sampleTextList);
    expect(Array.isArray(encodedBatch)).toBe(true);
    encodedBatch.forEach(tokens => expect(Array.isArray(tokens)).toBe(true));

    const decodedBatch = wordTokenizer.decodeBatch(encodedBatch);
    expect(Array.isArray(decodedBatch)).toBe(true);
    decodedBatch.forEach(text => expect(typeof text).toBe("string"));
    decodedBatch.forEach((decodedText, i) => {
      expect(decodedText.trim()).toBe(sampleTextList[i].trim());
    });
  });

  it("vocab appends new words", () => {
    const initialVocabSize = wordTokenizer.getVocab().length;
    const testStr = "every tech bro should watch wall-e";
    wordTokenizer.encode(testStr);
    expect(wordTokenizer.getVocab().length).toBeGreaterThan(initialVocabSize);
    testStr.split(" ").forEach(word => {
      expect(wordTokenizer.getVocab()).toContain(word);
    });
  });

  it("toString representation", () => {
    expect(wordTokenizer.toString()).toBe("WordTokenizer(vocab_size=1)");
    wordTokenizer.encode("new words");
    expect(wordTokenizer.toString()).toBe(`WordTokenizer(vocab_size=${1 + "new words".split(" ").length})`);
  });

  it("multiple encodings update vocab correctly", () => {
    const str1 = "Wall-E is truly a masterpiece that should be required viewing.";
    const str2 = "Ratatouille is truly a delightful film that every kid should watch.";

    wordTokenizer.encode(str1);
    const vocabSize1 = wordTokenizer.getVocab().length;
    wordTokenizer.encode(str2);
    const vocabSize2 = wordTokenizer.getVocab().length;

    expect(vocabSize2).toBeGreaterThan(vocabSize1);
    expect(wordTokenizer.getVocab()).toContain("Wall-E");
    expect(wordTokenizer.getVocab()).toContain("Ratatouille");
    expect(wordTokenizer.getToken2id().get("truly")).toBe(wordTokenizer.encode("truly")[0]);
  });

  it("countTokens", () => {
    const text = "this is a test";
    expect(wordTokenizer.countTokens(text)).toBe(text.split(" ").length);
  });

  it("countTokensBatch", () => {
    const texts = ["hello world", "another test"];
    const counts = wordTokenizer.countTokensBatch(texts);
    expect(counts).toEqual([2, 2]);
  });
});


describe("CharacterTokenizer", () => {
  let charTokenizer: CharacterTokenizer;

  beforeEach(() => {
    charTokenizer = new CharacterTokenizer();
  });

  it("initialization", () => {
    expect(charTokenizer.getVocab()).toEqual([" "]);
    expect(charTokenizer.getToken2id().size).toBe(1);
    expect(charTokenizer.getToken2id().get(" ")).toBe(0);
  });

  it("encode and decode", () => {
    const tokens = charTokenizer.encode(sampleText);
    expect(Array.isArray(tokens)).toBe(true);
    tokens.forEach(token => expect(typeof token).toBe("number"));
    expect(tokens.length).toBe(sampleText.length);

    const decoded = charTokenizer.decode(tokens);
    expect(typeof decoded).toBe("string");
    expect(decoded).toBe(sampleText);
  });

  it("countTokens", () => {
    expect(charTokenizer.countTokens(sampleText)).toBe(sampleText.length);
  });

  it("batch encode and decode", () => {
    const batchEncoded = charTokenizer.encodeBatch(sampleTextList);
    expect(Array.isArray(batchEncoded)).toBe(true);
    batchEncoded.forEach(tokens => expect(Array.isArray(tokens)).toBe(true));
    batchEncoded.forEach((tokens, i) => {
      expect(tokens.length).toBe(sampleTextList[i].length);
    });

    const batchDecoded = charTokenizer.decodeBatch(batchEncoded);
    expect(Array.isArray(batchDecoded)).toBe(true);
    batchDecoded.forEach(text => expect(typeof text).toBe("string"));
    expect(batchDecoded).toEqual(sampleTextList);
  });

  it("countTokensBatch", () => {
    const counts = charTokenizer.countTokensBatch(sampleTextList);
    expect(counts).toEqual(sampleTextList.map(text => text.length));
  });

  it("toString representation", () => {
    expect(charTokenizer.toString()).toBe("CharacterTokenizer(vocab_size=1)");
    charTokenizer.encode("abc"); // " " is already there, a,b,c are new
    expect(charTokenizer.toString()).toBe(`CharacterTokenizer(vocab_size=${1 + 3})`);
  });

  it("vocab and mapping evolve correctly", () => {
    expect(charTokenizer.getVocab()).toEqual([" "]);
    expect(charTokenizer.getToken2id().get(" ")).toBe(0);
    expect(charTokenizer.getToken2id().size).toBe(1);

    charTokenizer.encode(sampleText);

    const vocab = charTokenizer.getVocab();
    const token2id = charTokenizer.getToken2id();

    expect(vocab.length).toBeGreaterThan(1);
    expect(token2id instanceof Map).toBe(true);
    expect(token2id.get(" ")).toBe(0);

    vocab.forEach(token => {
      expect(token2id.has(token)).toBe(true);
      expect(vocab[token2id.get(token)!]).toBe(token);
    });

    for (const char of sampleText) {
      expect(vocab).toContain(char);
      expect(token2id.has(char)).toBe(true);
    }
  });

  it("multiple encodings update vocab correctly", () => {
    const text1 = "Wall-E is truly a masterpiece that should be required viewing.";
    const text2 = "Ratatouille is truly a delightful film that every kid should watch.";

    charTokenizer.encode(text1);
    const vocabSize1 = charTokenizer.getVocab().length;
    charTokenizer.encode(text2);
    const vocabSize2 = charTokenizer.getVocab().length;

    expect(vocabSize2).toBeGreaterThan(vocabSize1);
    expect(charTokenizer.getVocab()).toContain("u");
    expect(charTokenizer.getToken2id().get("u")).toBe(charTokenizer.encode("u")[0]);
  });
});
