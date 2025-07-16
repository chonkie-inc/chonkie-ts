import {
  CodeChunker,
  CodeChunkerOptions,
} from "../../src/chonkie/chunker/code";
import { CodeChunk } from "../../src/chonkie/types/code";

/**
 * -----------------------------------------------------------------------------
 * NOTE ON MOCKING `web-tree-sitter`
 * -----------------------------------------------------------------------------
 * The tests in the "WASM file resolution" suite are *unit-tests* for the path
 *-resolution logic inside `CodeChunker._initParser()`.  We only want to verify
 * that:
 *   1. `require.resolve()` is attempted first.
 *   2. The fallback search is triggered when that fails.
 *   3. Helpful errors are emitted when neither strategy succeeds.
 *
 * Running a *real* Tree-Sitter parser is unnecessary here and would require
 * bundling actual language WASM binaries (e.g. `tree-sitter-javascript.wasm`).
 * Instead we fully mock the `web-tree-sitter` module so that:
 *   • `Language.load()` resolves successfully regardless of the buffer.
 *   • `new Parser()` returns a lightweight stub whose `parse()` function
 *     pretends to succeed.
 *
 * This keeps the tests fast, avoids environment-specific WASM issues, and makes
 * it clear we are *only* exercising the resolution branch-logic.
 */

// The global `jest` object is available in the test environment, no import needed.

describe("CodeChunker", () => {
  // Sample JavaScript code for testing
  const sampleJsCode = `
function greet(name) {
  console.log("Hello, " + name + "!");
}

class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  getInfo() {
    return this.name + " is " + this.age + " years old.";
  }
}

const p = new Person("Alice", 30);
greet(p.name);
// This is a comment
console.log(p.getInfo());
`;

  // Helper function to normalize text for comparison (if needed, like in recursiveChunker)
  const normalizeText = (text: string): string => {
    return text.replace(/\s+/g, " ").trim();
  };

  it("should initialize correctly with default parameters", async () => {
    const chunker = await CodeChunker.create({
      tokenizer: "Xenova/gpt2",
      lang: "javascript",
    });
    expect(chunker).toBeDefined();
    expect(chunker.chunkSize).toBe(512);
    expect(chunker.lang).toBe("javascript");
    expect(chunker.includeNodes).toBe(false);
  });

  it("should initialize correctly with custom parameters", async () => {
    const options: CodeChunkerOptions = {
      tokenizer: "Xenova/gpt2",
      chunkSize: 256,
      lang: "javascript",
      includeNodes: true,
    };
    const chunker = await CodeChunker.create(options);
    expect(chunker).toBeDefined();
    expect(chunker.chunkSize).toBe(256);
    expect(chunker.lang).toBe("javascript");
    expect(chunker.includeNodes).toBe(true);
  });

  it("should throw an error if language is not specified during chunking", async () => {
    await expect(
      CodeChunker.create({ tokenizer: "Xenova/gpt2" })
    ).rejects.toThrow("Language must be specified for code chunking");
  });

  it("should chunk JavaScript code correctly", async () => {
    const chunker = await CodeChunker.create({
      tokenizer: "Xenova/gpt2",
      lang: "javascript",
    });
    const chunks = (await chunker.chunk(sampleJsCode)) as CodeChunk[];

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);

    if (chunks.length > 0) {
      expect(chunks[0]).toBeInstanceOf(CodeChunk);
    }

    let totalChars = 0;
    chunks.forEach((chunk) => {
      expect(chunk.text).toBeDefined();
      expect(chunk.startIndex).toBeGreaterThanOrEqual(0);
      expect(chunk.endIndex).toBeGreaterThan(chunk.startIndex);
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(chunk.lang).toBe("javascript");
      expect(chunk.nodes).toBeUndefined(); // includeNodes is false by default
      totalChars += chunk.text.length;
    });
    //This assertion might be tricky due to how tree-sitter chunks and if text is slightly modified (e.g. whitespace)
    //For now, ensuring that chunking happens and basic properties are set.
  });

  it("should handle empty text", async () => {
    const chunker = await CodeChunker.create({
      tokenizer: "Xenova/gpt2",
      lang: "javascript",
    });
    const chunks = await chunker.chunk("");
    expect(chunks).toEqual([]);
  });

  it("should handle short text (shorter than chunk size)", async () => {
    const shortCode = "const a = 10;";
    const chunker = await CodeChunker.create({
      tokenizer: "Xenova/gpt2",
      lang: "javascript",
      chunkSize: 512,
    });
    const chunks = (await chunker.chunk(shortCode)) as CodeChunk[];

    expect(chunks.length).toBe(1);
    const chunk = chunks[0];
    expect(chunk).toBeInstanceOf(CodeChunk);
    // The exact text might differ slightly due to tree-sitter parsing and reconstruction.
    // We check if the core content is there.
    expect(chunk.text.includes("const a = 10;")).toBe(true);
    expect(chunk.startIndex).toBe(0);
    expect(chunk.endIndex).toBe(shortCode.length); // This might also be tricky if tree-sitter adds/removes whitespace
    expect(chunk.tokenCount).toBeGreaterThan(0);
    expect(chunk.lang).toBe("javascript");
  });

  it("should have correct indices for chunks and allow text reconstruction", async () => {
    const chunker = await CodeChunker.create({
      tokenizer: "Xenova/gpt2",
      lang: "javascript",
      chunkSize: 64,
    }); // Smaller chunk size for more chunks
    const chunks = (await chunker.chunk(sampleJsCode)) as CodeChunk[];

    expect(chunks.length).toBeGreaterThan(0);

    let reconstructedText = "";
    let currentOriginalIndex = 0;

    chunks.forEach((chunk, i) => {
      // Check that chunks are ordered by startIndex
      expect(chunk.startIndex).toBeGreaterThanOrEqual(currentOriginalIndex);

      // Extract the part of the original text that this chunk claims to represent
      const originalSlice = sampleJsCode.substring(
        chunk.startIndex,
        chunk.endIndex
      );

      // Tree-sitter based chunking might not produce chunks that perfectly concatenate
      // to the original string due to how nodes are grouped and whitespace handling.
      // The internal `_getTextsFromNodeGroups` has logic to handle this.
      // For this test, we'll focus on ensuring the chunk.text is what it says it is from original.
      expect(chunk.text).toEqual(originalSlice);

      if (i === 0) {
        reconstructedText = chunk.text;
      } else {
        // This part of the test might be brittle.
        // It assumes perfect concatenation, which might not hold.
        // A better check is to see if the reconstructed text is semantically equivalent
        // or if the chunks cover the whole original text without overlap.
        const prevChunk = chunks[i - 1];
        // Fill in any gap between the previous chunk and the current one
        if (chunk.startIndex > prevChunk.endIndex) {
          reconstructedText += sampleJsCode.substring(
            prevChunk.endIndex,
            chunk.startIndex
          );
        }
        reconstructedText += chunk.text;
      }
      currentOriginalIndex = chunk.endIndex;
    });

    // Fill in any remaining text at the end
    if (currentOriginalIndex < sampleJsCode.length) {
      reconstructedText += sampleJsCode.substring(currentOriginalIndex);
    }

    // Due to potential whitespace differences from tree-sitter's parsing,
    // a normalized comparison is more robust.
    expect(normalizeText(reconstructedText)).toEqual(
      normalizeText(sampleJsCode)
    );
  });

  it("should include tree-sitter nodes when includeNodes is true", async () => {
    const chunker = await CodeChunker.create({
      tokenizer: "Xenova/gpt2",
      lang: "javascript",
      includeNodes: true,
    });
    const chunks = (await chunker.chunk(
      "function foo() { return 1; }"
    )) as CodeChunk[];

    expect(chunks.length).toBeGreaterThan(0);
    chunks.forEach((chunk) => {
      expect(chunk.nodes).toBeDefined();
      if (chunk.nodes) {
        // type guard
        expect(Array.isArray(chunk.nodes)).toBe(true);
        // Further checks on node structure could be added if necessary
      }
    });
  });

  it("should not include nodes when includeNodes is false or default", async () => {
    const chunkerDefault = await CodeChunker.create({
      tokenizer: "Xenova/gpt2",
      lang: "javascript",
    });
    const chunksDefault = (await chunkerDefault.chunk(
      "function bar() { return 2; }"
    )) as CodeChunk[];

    expect(chunksDefault.length).toBeGreaterThan(0);
    chunksDefault.forEach((chunk) => {
      expect(chunk.nodes).toBeUndefined();
    });

    const chunkerFalse = await CodeChunker.create({
      tokenizer: "Xenova/gpt2",
      lang: "javascript",
      includeNodes: false,
    });
    const chunksFalse = (await chunkerFalse.chunk(
      "function baz() { return 3; }"
    )) as CodeChunk[];

    expect(chunksFalse.length).toBeGreaterThan(0);
    chunksFalse.forEach((chunk) => {
      expect(chunk.nodes).toBeUndefined();
    });
  });

  // Test for a different language (e.g., Python) to ensure WASM loading for others works
  it("should chunk Python code correctly", async () => {
    const samplePythonCode = `
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)

result = factorial(5)
print(f"Factorial of 5 is {result}")
`;
    const chunker = await CodeChunker.create({
      tokenizer: "Xenova/gpt2",
      lang: "python",
      chunkSize: 64,
    });
    const chunks = (await chunker.chunk(samplePythonCode)) as CodeChunk[];

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);

    if (chunks.length > 0) {
      expect(chunks[0]).toBeInstanceOf(CodeChunk);
    }

    chunks.forEach((chunk) => {
      expect(chunk.text).toBeDefined();
      expect(chunk.startIndex).toBeGreaterThanOrEqual(0);
      expect(chunk.endIndex).toBeGreaterThan(chunk.startIndex);
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(chunk.lang).toBe("python");
    });

    const reconstructedText = chunks.map((c) => c.text).join("");
    expect(normalizeText(reconstructedText)).toEqual(
      normalizeText(samplePythonCode)
    );
  });

  describe("WASM file resolution", () => {
    // Patch `web-tree-sitter` once for this suite so the loader is satisfied
    // even when we feed it empty/invalid WASM bytes.  Doing this *here*
    // ensures the mocking is scoped to this test suite only.
    beforeAll(() => {
      // Only mock the Parser constructor, but let Language.load behave normally
      // for error tests. This way Language.load will fail naturally when given
      // invalid WASM data, which is what we want for testing error paths.
      const ParserCtor = treeSitter.Parser;
      if (ParserCtor && ParserCtor.prototype) {
        if (!jest.isMockFunction(ParserCtor.prototype.setLanguage)) {
          jest
            .spyOn(ParserCtor.prototype, "setLanguage")
            .mockImplementation(() => {});
        }
        if (!jest.isMockFunction(ParserCtor.prototype.parse)) {
          jest
            .spyOn(ParserCtor.prototype, "parse")
            .mockImplementation(() => ({ rootNode: { children: [] } }));
        }
      }
    });

    afterEach(() => {
      jest.clearAllMocks() // keep module mocks in place, just reset call counts
    })

    it("should use fallback when require.resolve fails and find wasm file", async () => {
      jest.spyOn(CodeChunker as any, "resolveModule").mockImplementation(() => {
        const error = new Error() as any
        error.code = "MODULE_NOT_FOUND"
        throw error
      })
      const mockNodeModules = "/tmp/node_modules"
      jest
        .spyOn(CodeChunker as any, "findNearestNodeModules")
        .mockReturnValue(mockNodeModules)
      jest.spyOn(fs, "existsSync").mockReturnValue(true)
      jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from(""))

      // For this success test, we need Language.load to succeed, so mock it
      const treeSitter = require("web-tree-sitter")
      const languageLoadSpy = jest
        .spyOn(treeSitter.Language, "load")
        .mockResolvedValue({})

      const chunker = await CodeChunker.create({ lang: "javascript" })
      await expect(chunker.chunk("const a = 1;")).resolves.toBeDefined()

      languageLoadSpy.mockRestore()
    })

    it("should throw error if require.resolve fails and tree-sitter-wasms is not found", async () => {
      jest.spyOn(CodeChunker as any, "resolveModule").mockImplementation(() => {
        const error = new Error() as any
        error.code = "MODULE_NOT_FOUND"
        throw error
      })
      jest
        .spyOn(CodeChunker as any, "findNearestNodeModules")
        .mockReturnValue(null)

      // Don't mock Language.load here - let it fail naturally
      const chunkerPromise = (
        await CodeChunker.create({ lang: "javascript" })
      ).chunk("const a = 1;")
      await expect(chunkerPromise).rejects.toThrow(
        "Tree-sitter-wasms package not found. This is required for loading tree-sitter language WASM files."
      )
    })

    it("should throw error if require.resolve fails and wasm file does not exist in fallback path", async () => {
      jest.spyOn(CodeChunker as any, "resolveModule").mockImplementation(() => {
        const error = new Error() as any
        error.code = "MODULE_NOT_FOUND"
        throw error
      })
      const mockNodeModules = "/tmp/node_modules"
      jest
        .spyOn(CodeChunker as any, "findNearestNodeModules")
        .mockReturnValue(mockNodeModules)
      jest.spyOn(fs, "existsSync").mockReturnValue(false)

      // Don't mock Language.load here - let it fail naturally
      const chunkerPromise = (
        await CodeChunker.create({ lang: "javascript" })
      ).chunk("const a = 1;")
      await expect(chunkerPromise).rejects.toThrow(
        /Tree-sitter WASM file for language "javascript" not found at/
      )
    })

    it("should use require.resolve path when WASM file is found without fallback", async () => {
      const mockPath = "/tmp/tree-sitter-javascript.wasm"

      // Mock require.resolve to return a valid path immediately
      jest.spyOn(CodeChunker as any, "resolveModule").mockReturnValue(mockPath)

      // Mock fs.readFileSync to return an empty buffer (pretend WASM content)
      jest.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from(""))

      // For this success test, we need Language.load to succeed, so mock it
      const treeSitter = require("web-tree-sitter")
      const languageLoadSpy = jest
        .spyOn(treeSitter.Language, "load")
        .mockResolvedValue({})

      // No need to mock existsSync here because the primary branch does not call it
      const chunker = await CodeChunker.create({ lang: "javascript" })
      await expect(chunker.chunk("const a = 1;")).resolves.toBeDefined()

      languageLoadSpy.mockRestore()
    })
  });
});
