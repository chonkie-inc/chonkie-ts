import {
    AutoTokenizer,
    PreTrainedTokenizer
} from "@huggingface/transformers";
import { Tokenizer as HFTokenizer, Encoding } from "tokenizers";

type TransformersJsTokenizer = PreTrainedTokenizer;
type CallableTokenizerCounter = (text: string) => number;
type CallableTokenizerEncoder = (text: string) => number[];
type CallableTokenizerDecoder = (tokens: number[]) => string;

type SupportedTokenizerInstance =
    | BaseTokenizer
    | TransformersJsTokenizer
    | HFTokenizer;

type CallableTokenizer = {
    encode?: CallableTokenizerEncoder;
    decode?: CallableTokenizerDecoder;
    countTokens: CallableTokenizerCounter;
};

export abstract class BaseTokenizer {
    vocab: string[];
    token2id: Map<string, number>;

    constructor() {
        this.vocab = [];
        this.token2id = new Map<string, number>();
        this.addTokenToVocab(" "); // Add space to the vocabulary
    }

    protected addTokenToVocab(token: string): number {
        if (!this.token2id.has(token)) {
            this.token2id.set(token, this.vocab.length);
            this.vocab.push(token);
        }
        return this.token2id.get(token)!;
    }

    toString(): string {
        return `${this.constructor.name}(vocab_size=${this.vocab.length})`;
    }

    getVocab(): readonly string[] {
        return this.vocab;
    }

    getToken2id(): ReadonlyMap<string, number> {
        return this.token2id;
    }

    abstract encode(text: string): number[];
    abstract decode(tokens: number[]): string;
    abstract countTokens(text: string): number;

    encodeBatch(texts: string[]): number[][] {
        return texts.map((text) => this.encode(text));
    }

    decodeBatch(tokenSequences: number[][]): string[] {
        return tokenSequences.map((tokens) => this.decode(tokens));
    }

    countTokensBatch(texts: string[]): number[] {
        return texts.map((text) => this.countTokens(text));
    }
}

export class CharacterTokenizer extends BaseTokenizer {
    encode(text: string): number[] {
        const encoded: number[] = [];
        for (const char of text) {
            const id = this.addTokenToVocab(char);
            encoded.push(id);
        }
        return encoded;
    }

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

    countTokens(text: string): number {
        return text.length;
    }
}

export class WordTokenizer extends BaseTokenizer {
    tokenize(text: string): string[] {
        return text.split(" ");
    }

    encode(text: string): number[] {
        const encoded: number[] = [];
        for (const token of this.tokenize(text)) {
            const id = this.addTokenToVocab(token);
            encoded.push(id);
        }
        return encoded;
    }

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

    countTokens(text: string): number {
        return this.tokenize(text).length;
    }
}

export class Tokenizer {
    private tokenizerInstance: SupportedTokenizerInstance | CallableTokenizer;
    private _backend: string;

    private constructor(
        tokenizerInstance: SupportedTokenizerInstance | CallableTokenizer,
        backend: string
    ) {
        this.tokenizerInstance = tokenizerInstance;
        this._backend = backend;
    }

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
            // Try tokenizers library first
            return await HFTokenizer.fromPretrained(tokenizerName);
        } catch (e) {
            console.warn(
                `Could not load '${tokenizerName}' from 'tokenizers'. Falling back to 'transformers'. Error: ${(e as Error).message}`
            );
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

    private static _getBackendFromInstance(
        instance: SupportedTokenizerInstance | CallableTokenizer
    ): string {
        if (instance instanceof BaseTokenizer) return "chonkie";
        if (instance instanceof HFTokenizer) return "tokenizers";
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

    get backend(): string {
        return this._backend;
    }

    async encode(text: string): Promise<number[]> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).encode(text);
            case "tokenizers":
                const encoding = await (instance as HFTokenizer).encode(text, undefined, { addSpecialTokens: false });
                return encoding.getIds();
            case "transformers":
                // Type assertion needed as transformers' encode can return number[] or Tensor
                const result = (instance as TransformersJsTokenizer).encode(text, {add_special_tokens: false});
                // Transformers v3+ encode directly returns number[]
                if (Array.isArray(result)) {0
                    return result;
                }
                const resolvedResult = await Promise.resolve(result);
                if (typeof resolvedResult === 'object' && resolvedResult !== null && 'input_ids' in resolvedResult) {
                    return (resolvedResult as any).input_ids as number[];
                }
                return resolvedResult as number[];

            case "callable":
                if ((instance as CallableTokenizer).encode) {
                    return (instance as CallableTokenizer).encode!(text);
                }
                throw new Error("Encoding not implemented for this callable tokenizer.");
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }

    async decode(tokens: number[]): Promise<string> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).decode(tokens);
            case "tokenizers":
                return (instance as HFTokenizer).decode(tokens, false);
            case "transformers":
                return (instance as TransformersJsTokenizer).decode(tokens, { skipSpecialTokens: true });
            case "callable":
                if ((instance as CallableTokenizer).decode) {
                    return (instance as CallableTokenizer).decode!(tokens);
                }
                throw new Error("Decoding not implemented for this callable tokenizer.");
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }

    async countTokens(text: string): Promise<number> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).countTokens(text);
            case "tokenizers":
                const encoding = await (instance as HFTokenizer).encode(text, undefined, { addSpecialTokens: false });
                return encoding.ids.length;
            case "transformers":
                const result = (instance as TransformersJsTokenizer).encode(text, undefined, { addSpecialTokens: false });
                const resolvedResult = await Promise.resolve(result);
                if (Array.isArray(resolvedResult)) {
                    return resolvedResult.length;
                }
                if (typeof resolvedResult === 'object' && resolvedResult !== null && 'input_ids' in resolvedResult) {
                    return ((resolvedResult as any).input_ids as number[]).length;
                }
                return (resolvedResult as number[]).length;

            case "callable":
                return (instance as CallableTokenizer).countTokens(text);
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }

    async encodeBatch(texts: string[]): Promise<number[][]> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).encodeBatch(texts);
            case "tokenizers":
                const encodings = await (instance as HFTokenizer).encodeBatch(texts, undefined, { addSpecialTokens: false });
                return encodings.map((enc: Encoding) => enc.ids);
            case "transformers":
                const batchEncoding = await (instance as TransformersJsTokenizer).batchEncodePlus(texts, { addSpecialTokens: false, returnTensors: undefined });
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

    async decodeBatch(tokenSequences: number[][]): Promise<string[]> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).decodeBatch(tokenSequences);
            case "tokenizers":
                return (instance as HFTokenizer).decodeBatch(tokenSequences, false);
            case "transformers":
                return (instance as TransformersJsTokenizer).batchDecode(tokenSequences, { skipSpecialTokens: true });
            case "callable":
                if ((instance as CallableTokenizer).decode) {
                    return tokenSequences.map(tokens => (instance as CallableTokenizer).decode!(tokens));
                }
                throw new Error("Batch decoding not implemented for this callable tokenizer.");
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }

    async countTokensBatch(texts: string[]): Promise<number[]> {
        const instance = this.tokenizerInstance;
        switch (this._backend) {
            case "chonkie":
                return (instance as BaseTokenizer).countTokensBatch(texts);
            case "tokenizers":
                const encodings = await (instance as HFTokenizer).encodeBatch(texts, undefined, { addSpecialTokens: false });
                return encodings.map((enc: Encoding) => enc.ids.length);
            case "transformers":
                const batchEncoding = await (instance as TransformersJsTokenizer).batchEncodePlus(texts, { addSpecialTokens: false, returnTensors: undefined });
                return (batchEncoding.input_ids as number[][]).map(ids => ids.length);
            case "callable":
                return texts.map(text => (instance as CallableTokenizer).countTokens(text));
            default:
                throw new Error(`Unsupported tokenizer backend: ${this._backend}`);
        }
    }
}
