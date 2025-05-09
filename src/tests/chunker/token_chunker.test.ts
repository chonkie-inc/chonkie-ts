import { TokenChunker } from '../../chonkie/chunker/token';
import { Tokenizer } from '../../chonkie/tokenizer';
import { Chunk } from '../../chonkie/types/base';
import { AutoTokenizer, PreTrainedTokenizer } from "@huggingface/transformers";


const sampleText = `According to all known laws of aviation, there is no way a bee should be able to fly. Its wings are too small to get its fat little body off the ground. The bee, of course, flies anyway because bees don't care what humans think is impossible. Yellow, black. Yellow, black. Yellow, black. Yellow, black. Ooh, black and yellow! Let's shake it up a little. Barry! Breakfast is ready! Coming! Hang on a second. Hello? - Barry? - Adam? - Can you believe this is happening? - I can't. I'll pick you up. Looking sharp. Use the stairs. Your father paid good money for those. Sorry. I'm excited. Here's the graduate. We're very proud of you, son. A perfect report card, all B's. Very proud. Ma! I got a thing going here.`;

const sampleBatch: string[] = [
    "Hello, world! This is a test.",
    "Another test with a longer sentence to see how the chunking works.",
    "Short one.",
    "This is a test with some special characters: !@#$%^&*()_+",
    "A very very very very very very long sentence that should definitely be chunked into multiple parts because it exceeds the maximum token limit set for the chunker."
]
const sampleComplexMarkdownText = `# Heading 1
    This is a paragraph with some **bold text** and _italic text_. 
    ## Heading 2
    - Bullet point 1
    - Bullet point 2 with \`inline code\`
    \`\`\`python
    # Code block
    def hello_world():
        print("Hello, world!")
    \`\`\`
    Another paragraph with [a link](https://example.com) and an image:
    ![Alt text](https://example.com/image.jpg)
    > A blockquote with multiple lines
    > that spans more than one line.
    Finally, a paragraph at the end.
    `;

// Helper to get a Chonkie Tokenizer instance
async function getChonkieTokenizer(modelName: string = "google-bert/bert-base-uncased"): Promise<Tokenizer> {
    return Tokenizer.create(modelName);
}

// Helper to get an HF PreTrainedTokenizer instance
async function getHfTokenizer(modelName: string = "google-bert/bert-base-uncased"): Promise<PreTrainedTokenizer | null> {
    try {
        return await AutoTokenizer.from_pretrained(modelName);
    } catch (e) {
        console.warn(`Could not load HF tokenizer ${modelName}: ${(e as Error).message}`);
        return null;
    }
}


describe('TokenChunker', () => {
    // Default model for most tests
    const defaultModel = "google-bert/bert-base-uncased"; // A small, common model

    it('should initialize correctly with a Chonkie Tokenizer instance', async () => {
        const chonkieTokenizer = await getChonkieTokenizer(defaultModel);
        const chunker = await TokenChunker.create(chonkieTokenizer, 512, 128);

        expect(chunker).toBeInstanceOf(TokenChunker);
        expect(chunker.chunkSize).toBe(512);
        expect(chunker.chunkOverlap).toBe(128);
        // Check via toString as tokenizer property is protected in BaseChunker
        expect(chunker.toString()).toContain(`tokenizer=${chonkieTokenizer.backend}`);
    });

    it('should initialize correctly with a tokenizer model string', async () => {
        const chunker = await TokenChunker.create(defaultModel, 256, 64);
        expect(chunker).toBeInstanceOf(TokenChunker);
        expect(chunker.chunkSize).toBe(256);
        expect(chunker.chunkOverlap).toBe(64);
        // The backend will be determined by Tokenizer.create(defaultModel)
        const tempTokenizer = await getChonkieTokenizer(defaultModel);
        expect(chunker.toString()).toContain(`tokenizer=${tempTokenizer.backend}`);
    });

    it('should initialize with an HF PreTrainedTokenizer instance via Chonkie Tokenizer wrapper', async () => {
        const hfTokenizerInstance = await getHfTokenizer(defaultModel);
        if (!hfTokenizerInstance) {
            console.warn("Skipping HF Tokenizer init test as instance could not be created.");
            return;
        }
        const chonkieTokenizer = await Tokenizer.create(hfTokenizerInstance);
        const chunker = await TokenChunker.create(chonkieTokenizer, 512, 0.1); // 10% overlap

        expect(chunker).toBeInstanceOf(TokenChunker);
        expect(chunker.chunkSize).toBe(512);
        expect(chunker.chunkOverlap).toBe(Math.floor(0.1 * 512)); // 51
        expect(chunker.toString()).toContain(`tokenizer=${chonkieTokenizer.backend}`);
    });


    it('should chunk a sample text correctly', async () => {
        const chunker = await TokenChunker.create(defaultModel, 100, 20);
        const chunks = await chunker.chunk(sampleText);

        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks[0]).toBeInstanceOf(Chunk);
        chunks.forEach(chunk => {
            const c = chunk as Chunk;
            expect(c.tokenCount).toBeLessThanOrEqual(100);
            expect(c.tokenCount).toBeGreaterThan(0);
            expect(c.text).toBeDefined();
            expect(c.text.length).toBeGreaterThan(0);
            expect(c.startIndex).toBeDefined();
            expect(c.endIndex).toBeDefined();
            expect(c.startIndex).toBeLessThanOrEqual(c.endIndex!);
        });
    });

    it('should handle empty text input', async () => {
        const chunker = await TokenChunker.create(defaultModel, 100, 10);
        const chunks = await chunker.chunk("");
        expect(chunks.length).toBe(0);
    });

    it('should handle text with a single token', async () => {
        const chunker = await TokenChunker.create(defaultModel, 100, 10);
        // "Hello" is typically one token for BERT-like models, but might be multiple for others.
        // Let's use a word that's very likely a single token or a known number.
        // For "google-bert/bert-base-uncased", "hello" is one token.
        const singleTokenText = "hello";
        const chunks = await chunker.chunk(singleTokenText);

        expect(chunks.length).toBe(1);
        const chunk = chunks[0] as Chunk;
        expect(chunk.text).toBe(singleTokenText);
        // Token count depends on the tokenizer. Let's ensure it's positive.
        expect(chunk.tokenCount).toBeGreaterThan(0);
    });

    it('should handle text that fits within a single chunk', async () => {
        const shortText = "Hello, how are you?"; // This should be few tokens
        const chunker = await TokenChunker.create(defaultModel, 100, 10);
        const chunks = await chunker.chunk(shortText);

        expect(chunks.length).toBe(1);
        const chunk = chunks[0] as Chunk;
        expect(chunk.text.toLowerCase()).toBe(shortText.toLowerCase());
        expect(chunk.tokenCount).toBeLessThanOrEqual(100);
    });

    it('should chunk a batch of texts correctly', async () => {
        const chunker = await TokenChunker.create(defaultModel, 200, 50);
        const results = await chunker.chunkBatch(sampleBatch);

        expect(results.length).toBe(sampleBatch.length);
        results.forEach(textChunks => {
            expect(textChunks.length).toBeGreaterThan(0);
            expect(textChunks[0]).toBeInstanceOf(Chunk);
            textChunks.forEach(chunk => {
                const c = chunk as Chunk;
                expect(c.tokenCount).toBeLessThanOrEqual(200);
                expect(c.tokenCount).toBeGreaterThan(0);
                expect(c.text).toBeDefined();
                expect(c.startIndex).toBeDefined();
                expect(c.endIndex).toBeDefined();
            });
        });
    });

    it('should have a correct string representation', async () => {
        const chonkieTokenizer = await getChonkieTokenizer(defaultModel);
        const chunker = await TokenChunker.create(chonkieTokenizer, 512, 128, "texts");
        // Example: TokenChunker(tokenizer=transformers, chunkSize=512, chunkOverlap=128, returnType='texts')
        expect(chunker.toString()).toBe(
            `TokenChunker(tokenizer=${chonkieTokenizer.backend}, chunkSize=512, chunkOverlap=128, returnType='texts')`
        );
    });

    it('should be directly callable for single text', async () => {
        const chunkerInstance = await TokenChunker.create(defaultModel, 100, 20);
        const chunks = await chunkerInstance(sampleText); // Directly calling the instance

        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks[0]).toBeInstanceOf(Chunk);
    });

    it('should be directly callable for batch text', async () => {
        const chunkerInstance = await TokenChunker.create(defaultModel, 100, 20);
        const results = await chunkerInstance(sampleBatch); // Directly calling the instance

        expect(results.length).toBe(sampleBatch.length);
        expect((results[0] as Chunk[]).length).toBeGreaterThan(0);
        expect((results[0] as Chunk[])[0]).toBeInstanceOf(Chunk);
    });


    async function verifyChunkIndices(chunks: Chunk[], originalText: string, tokenizerModel: string = defaultModel) {
        // For complex texts, decoding parts of tokens might lead to replacement characters (e.g., ).
        // The core idea is that concatenating chunks (considering overlap) should reconstruct the original,
        // or each chunk's text should be a substring of the original at the given indices.
        // The latter is easier to test robustly.
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const extractedText = originalText.substring(chunk.startIndex!, chunk.endIndex!);
            expect(chunk.text.toLowerCase()).toBe(extractedText.toLowerCase());
        }
    }

    it('should have correct indices for chunks', async () => {
        const chunker = await TokenChunker.create(defaultModel, 100, 10);
        const chunks = (await chunker.chunk(sampleText)) as Chunk[];
        await verifyChunkIndices(chunks, sampleText);
    });

    it('should have correct indices for complex markdown text', async () => {
        const chunker = await TokenChunker.create(defaultModel, 50, 5); // Smaller chunk size for more chunks
        const chunks = (await chunker.chunk(sampleComplexMarkdownText)) as Chunk[];
        await verifyChunkIndices(chunks, sampleComplexMarkdownText);
    });

    it('should calculate token counts correctly', async () => {
        const chonkieTokenizer = await getChonkieTokenizer(defaultModel);
        const chunker = await TokenChunker.create(chonkieTokenizer, 100, 20);
        const chunks = (await chunker.chunk(sampleText)) as Chunk[];

        expect(chunks.every(c => c.tokenCount > 0)).toBe(true);
        expect(chunks.every(c => c.tokenCount <= 100)).toBe(true);

        for (const chunk of chunks) {
            const reEncodedTokens = await chonkieTokenizer.encode(chunk.text);
            // This comparison can be tricky due to how different tokenizers handle partial words at chunk boundaries
            // or special tokens. For a strict test, the chunker's reported tokenCount should match.
            // If the tokenizer used by the chunker for counting is exactly the same as `chonkieTokenizer.encode`
            // (which it is, as it's passed in), this should hold.
            expect(chunk.tokenCount).toBe(reEncodedTokens.length);
        }
    });

    it('should have correct indices for batch chunking', async () => {
        const chunker = await TokenChunker.create(defaultModel, 100, 10);
        const results = (await chunker.chunkBatch([sampleText, sampleComplexMarkdownText])) as Chunk[][];

        await verifyChunkIndices(results[0], sampleText);
        await verifyChunkIndices(results[1], sampleComplexMarkdownText);
    });

    it('should return texts when returnType is "texts"', async () => {
        const chunker = await TokenChunker.create(defaultModel, 100, 20, "texts");
        const chunks = await chunker.chunk(sampleText);

        expect(chunks.length).toBeGreaterThan(0);
        expect(typeof chunks[0]).toBe('string');

        const chonkieTokenizer = await getChonkieTokenizer(defaultModel);
        for (const textChunk of chunks as string[]) {
            const tokenCount = (await chonkieTokenizer.encode(textChunk)).length;
            expect(tokenCount).toBeLessThanOrEqual(100); // Or slightly more due to tokenization artifacts at edges
        }
    });

    describe('Error Handling and Edge Cases for create()', () => {
        it('should throw error for non-positive chunkSize', async () => {
            await expect(TokenChunker.create(defaultModel, 0, 10))
                .rejects.toThrow("chunkSize must be positive.");
            await expect(TokenChunker.create(defaultModel, -1, 10))
                .rejects.toThrow("chunkSize must be positive.");
        });

        it('should throw error for negative chunkOverlap (absolute)', async () => {
            await expect(TokenChunker.create(defaultModel, 100, -10))
                .rejects.toThrow("Calculated chunkOverlap must be non-negative.");
        });

        it('should throw error for negative chunkOverlap (percentage leading to negative)', async () => {
            // This case is tricky because Math.floor(negative_percentage * chunkSize)
            // if overlap < 0 && overlap > -1, e.g. -0.1 * 100 = -10.
            // The current logic `if (overlap >= 0 && overlap < 1)` handles positive percentages.
            // For negative percentages, it falls into `else { calculatedOverlap = Math.floor(overlap); }`
            // So, -0.1 becomes Math.floor(-0.1) = -1.
            await expect(TokenChunker.create(defaultModel, 100, -0.1))
                .rejects.toThrow("Calculated chunkOverlap must be non-negative.");
        });


        it('should throw error for chunkOverlap >= chunkSize (absolute)', async () => {
            await expect(TokenChunker.create(defaultModel, 100, 100))
                .rejects.toThrow("Calculated chunkOverlap must be less than chunkSize.");
            await expect(TokenChunker.create(defaultModel, 100, 150))
                .rejects.toThrow("Calculated chunkOverlap must be less than chunkSize.");
        });

        it('should throw error for chunkOverlap >= chunkSize (percentage)', async () => {
            await expect(TokenChunker.create(defaultModel, 100, 1.0)) // 1.0 * 100 = 100
                .rejects.toThrow("Calculated chunkOverlap must be less than chunkSize.");
            await expect(TokenChunker.create(defaultModel, 100, 1.5)) // 1.5 * 100 = 150
                .rejects.toThrow("Calculated chunkOverlap must be less than chunkSize.");
        });

        it('should correctly calculate overlap for percentage', async () => {
            const chunker = await TokenChunker.create(defaultModel, 100, 0.1); // 10% of 100 = 10
            expect(chunker.chunkOverlap).toBe(10);

            const chunker2 = await TokenChunker.create(defaultModel, 100, 0.109); // 10.9 -> floor(10.9) = 10
            expect(chunker2.chunkOverlap).toBe(10);
        });


        it('should throw error for invalid returnType', async () => {
            await expect(TokenChunker.create(defaultModel, 100, 10, "invalid" as any))
                .rejects.toThrow("returnType must be either 'chunks' or 'texts'.");
        });
    });
});
