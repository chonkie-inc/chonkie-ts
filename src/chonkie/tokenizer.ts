import {
    AutoTokenizer,
    PreTrainedTokenizer
} from "@huggingface/transformers";

type TransformersJsTokenizer = PreTrainedTokenizer;
type CallableTokenizerCounter = (text: string) => number;
type CallableTokenizerEncoder = (text: string) => number[];
type CallableTokenizerDecoder = (tokens: number[]) => string;

type SupportedTokenizerInstance =
    | BaseTokenizer
    | TransformersJsTokenizer;

export type CallableTokenizer = {
    encode?: CallableTokenizerEncoder;
    decode?: CallableTokenizerDecoder;
    countTokens: CallableTokenizerCounter;
};

/**
 * Base class for Character and Word tokenizers.
 */
export abstract class BaseTokenizer {
    vocab: string[];
    token2id: Map<string, number>;

    /**
     * Initialize the BaseTokenizer.
     */
    constructor() {
        this.vocab = [];
        this.token2id = new Map<string, number>();
        this.addTokenToVocab(" "); // Add space to the vocabulary
    }

    /**
     * Adds a token to the vocabulary if it's not already present.
     * @param token The token to add.
     * @returns The ID of the token.
     */
    protected addTokenToVocab(token: string): number {
        if (!this.token2id.has(token)) {
            this.token2id.set(token, this.vocab.length);
            this.vocab.push(token);
        }
        return this.token2id.get(token)!;
    }

    /**
     * Return a string representation of the BaseTokenizer.
     * @returns String representation.
     */
    toString(): string {
        return `${this.constructor.name}(vocab_size=${this.vocab.length})`;
    }

    /**
     * Return the vocabulary.
     * @returns The vocabulary.
     */
    getVocab(): readonly string[] {
        return this.vocab;
    }

    /**
     * Return token-to-id mapping.
     * @returns The token-to-ID map.
     */
    getToken2id(): ReadonlyMap<string, number> {
        return this.token2id;
    }

    /**
     * Encode the given text into tokens.
     * @param text The text to encode.
     * @returns Encoded sequence of token IDs.
     */
    abstract encode(text: string): number[];
    /**
     * Decode the given tokens back into text.
     * @param tokens The tokens to decode.
     * @returns Decoded text.
     */
    abstract decode(tokens: number[]): string;
    /**
     * Count the number of tokens in the given text.
     * @param text The text to count tokens in.
     * @returns Number of tokens.
     */
    abstract countTokens(text: string): number;

    /**
     * Batch encode a list of texts into tokens.
     * @param texts The texts to encode.
     * @returns List of encoded sequences.
     */
    encodeBatch(texts: string[]): number[][] {
        return texts.map((text) => this.encode(text));
    }

    /**
     * Batch decode a list of tokens back into text.
     * @param tokenSequences The tokens to decode.
     * @returns List of decoded texts.
     */
    decodeBatch(tokenSequences: number[][]): string[] {
        return tokenSequences.map((tokens) => this.decode(tokens));
    }

    /**
     * Count the number of tokens in a batch of texts.
     * @param texts The texts to count tokens in.
     * @returns List of token counts.
     */
    countTokensBatch(texts: string[]): number[] {
        return texts.map((text) => this.countTokens(text));
    }
}

/**
 * Character-based tokenizer.
 */
export class CharacterTokenizer extends BaseTokenizer {
    /**
     * Encode the given text into tokens.
     * @param text The text to encode.
     * @returns Encoded sequence of character IDs.
     */
    encode(text: string): number[] {
        const encoded: number[] = [];
        for (const char of text) {
            const id = this.addTokenToVocab(char);
            encoded.push(id);
        }
        return encoded;
    }

    /**
     * Decode the given tokens back into text.
     * @param tokens The tokens to decode.
     * @returns Decoded text.
     */
    decode(tokens: number[]): string {
        try {
            return tokens.map((token) => this.vocab[token]).join("");
        } catch (e) {
            throw new Error(
                `Decoding failed. Tokens: [${tokens.join(
                    ", "
                )}] not found in vocab.`
            );
        }
    }

    /**
     * Count the number of tokens in the given text.
     * For CharacterTokenizer, this is the length of the text.
     * @param text The text to count tokens in.
     * @returns Number of characters (tokens).
     */
    countTokens(text: string): number {
        return text.length;
    }
}

/**
 * Word-based tokenizer.
 */
export class WordTokenizer extends BaseTokenizer {
    /**
     * Tokenize the given text into words.
     * Splits the text by spaces.
     * @param text The text to tokenize.
     * @returns List of word tokens.
     */
    tokenize(text: string): string[] {
        return text.split(" ");
    }

    /**
     * Encode the given text into tokens.
     * @param text The text to encode.
     * @returns Encoded sequence of word IDs.
     */
    encode(text: string): number[] {
        const encoded: number[] = [];
        for (const token of this.tokenize(text)) {
            const id = this.addTokenToVocab(token);
            encoded.push(id);
        }
        return encoded;
    }

    /**
     * Decode token ids back to text.
     * Joins tokens with spaces.
     * @param tokens The tokens to decode.
     * @returns Decoded text.
     */
    decode(tokens: number[]): string {
        try {
            return tokens.map((token) => this.vocab[token]).join(" ");
        } catch (e) {
            throw new Error(
                `Decoding failed. Tokens: [${tokens.join(
                    ", "
                )}] not found in vocab.`
            );
        }
    }

    /**
     * Count the number of tokens in the given text.
     * For WordTokenizer, this is the number of words after splitting by space.
     * @param text The text to count tokens in.
     * @returns Number of words (tokens).
     */
    countTokens(text: string): number {
        return this.tokenize(text).length;
    }
}

/**
 * Unified tokenizer interface for Chonkie.
 * This class provides a consistent API for various tokenization backends.
 */
export class Tokenizer {
    private tokenizerInstance: SupportedTokenizerInstance | CallableTokenizer;
    private _backend: string;

    /**
     * Private constructor. Use `Tokenizer.create()` to instantiate.
     * @param tokenizerInstance The underlying tokenizer instance.
     * @param backend The name of the backend being used.
     */
    private constructor(
        tokenizerInstance: SupportedTokenizerInstance | CallableTokenizer,
        backend: string
    ) {
        this.tokenizerInstance = tokenizerInstance;
        this._backend = backend;
    }

    /**
     * Creates and initializes a Tokenizer instance.
     * @param tokenizer Tokenizer identifier (e.g., "gpt2", "character", "word"),
     *                  a pre-initialized tokenizer instance, or a custom callable tokenizer.
     *                  Defaults to "gpt2".
     * @returns A promise that resolves to a Tokenizer instance.
     * @throws Error if the specified tokenizer cannot be loaded or is unsupported.
     */
    public static async create(
        tokenizer: string | SupportedTokenizerInstance | CallableTokenizer = "gpt2"
    ): Promise<Tokenizer> {
        if (typeof tokenizer === "string") {
            const instance = await Tokenizer._loadTokenizer(tokenizer);
            const backend = Tokenizer._getBackendFromInstance(instance);
            return new Tokenizer(instance, backend);
        } else {
            const backend = Tokenizer._getBackendFromInstance(tokenizer);
            return new Tokenizer(tokenizer, backend);
        }
    }

    /**
     * Loads the tokenizer based on the identifier string.
     * Tries loading from 'tokenizers', then 'transformers'.
     * Also supports 'character' and 'word' for basic tokenizers.
     * @param tokenizerName The name or path of the tokenizer to load.
     * @returns A promise that resolves to a supported tokenizer instance.
     * @throws Error if the tokenizer cannot be found or loaded.
     */
    private static async _loadTokenizer(
        tokenizerName: string
    ): Promise<SupportedTokenizerInstance> {
        if (tokenizerName === "character") {
            return new CharacterTokenizer();
        }
        if (tokenizerName === "word") {
            return new WordTokenizer();
        }

        try {
            // Try transformers library
            return await AutoTokenizer.from_pretrained(tokenizerName);
        } catch (e) {
            throw new Error(
                `Tokenizer '${tokenizerName}' not found in 'tokenizers' or 'transformers'. Error: ${(e as Error).message}`
            );
        }
    }

    /**
     * Determines the backend name from a tokenizer instance.
     * @param instance The tokenizer instance.
     * @returns The backend name (e.g., "chonkie", "tokenizers", "transformers", "callable").
     * @throws Error if the instance type is unsupported.
     */
    private static _getBackendFromInstance(
        instance: SupportedTokenizerInstance | CallableTokenizer
    ): string {
        if (instance instanceof BaseTokenizer) return "chonkie";
        // Check for PreTrainedTokenizer from @huggingface/transformers
        // This check needs to be robust as direct instanceof might not work with all bundlers/versions.
        // Checking for a known method like 'encode' or 'decode' specific to the class structure.
        if (
            typeof (instance as any).encode === "function" &&
            typeof (instance as any).decode === "function" &&
            ((instance as any).constructor?.name === "PreTrainedTokenizer" ||
                (instance as any).name !== undefined) // Heuristic for transformers tokenizer
        ) {
            return "transformers";
        }
        if (typeof (instance as CallableTokenizer).countTokens === "function") {
            return "callable";
        }
        throw new Error(`Unsupported tokenizer instance type: ${typeof instance}`);
    }

    /**
     * Gets the name of the backend currently used by this tokenizer instance.
     * @returns The backend name.
     */
    get backend(): string {
        return this._backend;
    }

    /**
     * Encode the text into tokens.
     * @param text The text to encode.
     * @returns A promise that resolves to an array of token IDs.
     * @throws Error if encoding is not supported by the backend or fails.
     */
    async encode(text: string): Promise<number[]> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).encode(text);
            case "transformers":
                // Type assertion needed as transformers' encode can return number[] or Tensor
                const result = (instance as TransformersJsTokenizer).encode(text, { add_special_tokens: false });
                // Transformers v3+ encode directly returns number[]
                if (Array.isArray(result)) {
                    return result;
                }
                const resolvedResult = await Promise.resolve(result);
                if (typeof resolvedResult === 'object' && resolvedResult !== null && 'input_ids' in resolvedResult) {
                    return (resolvedResult as any).input_ids as number[];
                }
                // If resolvedResult is a Tensor, extract its data
                if (resolvedResult && typeof resolvedResult === 'object' && 'data' in resolvedResult && (resolvedResult as any).data !== null) {
                    // (resolvedResult as any).data is typically a TypedArray (e.g., Int32Array) or number[]
                    return Array.from((resolvedResult as any).data);
                }
                console.error("Tokenizer.encode: Unexpected result structure from TransformersJsTokenizer.encode after attempting to resolve:", resolvedResult);
                throw new Error("Failed to convert encoding result from transformers backend to number[].");

            case "callable":
                if ((instance as CallableTokenizer).encode) {
                    return (instance as CallableTokenizer).encode!(text);
                }
                throw new Error("Encoding not implemented for this callable tokenizer.");
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }

    /**
     * Decode the tokens back into text.
     * @param tokens An array of token IDs.
     * @returns A promise that resolves to the decoded string.
     * @throws Error if decoding is not supported by the backend or fails.
     */
    async decode(tokens: number[]): Promise<string> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).decode(tokens);
            case "transformers":
                return (instance as TransformersJsTokenizer).decode(tokens, { skip_special_tokens: true });
            case "callable":
                if ((instance as CallableTokenizer).decode) {
                    return (instance as CallableTokenizer).decode!(tokens);
                }
                throw new Error("Decoding not implemented for this callable tokenizer.");
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }

    /**
     * Count the number of tokens in the text.
     * @param text The text to count tokens in.
     * @returns A promise that resolves to the number of tokens.
     * @throws Error if token counting is not supported by the backend or fails.
     */
    async countTokens(text: string): Promise<number> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).countTokens(text);
            case "transformers":
                const result = (instance as TransformersJsTokenizer).encode(text, { add_special_tokens: false });
                const resolvedResult = await Promise.resolve(result);
                if (Array.isArray(resolvedResult)) {
                    return resolvedResult.length;
                }
                if (typeof resolvedResult === 'object' && resolvedResult !== null && 'input_ids' in resolvedResult) {
                    return ((resolvedResult as any).input_ids as number[]).length;
                }
                if (resolvedResult && typeof resolvedResult === 'object' && 'data' in resolvedResult && (resolvedResult as any).data !== null) {
                    // (resolvedResult as any).data is TypedArray or number[], .length will work
                    return ((resolvedResult as any).data as any[] | Int32Array | Float32Array).length;
                }
                console.error("Tokenizer.countTokens: Unexpected result structure from TransformersJsTokenizer.encode after attempting to resolve:", resolvedResult);
                throw new Error("Failed to count tokens due to unexpected result from transformers backend.");
            case "callable":
                return (instance as CallableTokenizer).countTokens(text);
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }

    /**
     * Batch encode a list of texts into tokens.
     * @param texts An array of strings to encode.
     * @returns A promise that resolves to a list of encoded token ID sequences.
     * @throws Error if batch encoding is not supported by the backend or fails.
     */
    async encodeBatch(texts: string[]): Promise<number[][]> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).encodeBatch(texts);
            case "transformers":
                const batchEncoding = await (instance as TransformersJsTokenizer).call(texts, { addSpecialTokens: false, returnTensors: undefined });
                return batchEncoding.input_ids as number[][]; // input_ids is number[][]
            case "callable":
                if ((instance as CallableTokenizer).encode) {
                    return texts.map(text => (instance as CallableTokenizer).encode!(text));
                }
                throw new Error("Batch encoding not implemented for this callable tokenizer.");
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }

    /**
     * Batch decode a list of token sequences back into text.
     * @param tokenSequences An array of token ID sequences.
     * @returns A promise that resolves to a list of decoded strings.
     * @throws Error if batch decoding is not supported by the backend or fails.
     */
    async decodeBatch(tokenSequences: number[][]): Promise<string[]> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).decodeBatch(tokenSequences);
            case "transformers":
                return (instance as TransformersJsTokenizer).batch_decode(tokenSequences, { skipSpecialTokens: true });
            case "callable":
                if ((instance as CallableTokenizer).decode) {
                    return tokenSequences.map(tokens => (instance as CallableTokenizer).decode!(tokens));
                }
                throw new Error("Batch decoding not implemented for this callable tokenizer.");
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }

    /**
     * Count the number of tokens in a batch of texts.
     * @param texts An array of strings to count tokens in.
     * @returns A promise that resolves to a list of token counts.
     * @throws Error if batch token counting is not supported by the backend or fails.
     */
    async countTokensBatch(texts: string[]): Promise<number[]> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).countTokensBatch(texts);
            case "transformers":
                const batchEncoding = await (instance as TransformersJsTokenizer).call(texts, { addSpecialTokens: false, returnTensors: undefined });
                return (batchEncoding.input_ids as number[][]).map(ids => ids.length);
            case "callable":
                return texts.map(text => (instance as CallableTokenizer).countTokens(text));
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }
}
