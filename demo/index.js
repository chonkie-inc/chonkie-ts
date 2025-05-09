"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chonkie_1 = require("chonkie");
const cloud_1 = require("chonkie/cloud");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Example 1: Using local chunkers
        const sentenceChunker = new chonkie_1.SentenceChunker();
        const codeChunker = new chonkie_1.CodeChunker();
        // Chunk some text
        const text = "This is a sample text. It has multiple sentences. Each sentence should be chunked separately.";
        const chunks = yield sentenceChunker.chunk(text);
        console.log('Local Sentence Chunks:', chunks);
        // Chunk some code
        const code = `
    function hello() {
        console.log("Hello, world!");
        return true;
    }
    `;
        const codeChunks = yield codeChunker.chunk(code);
        console.log('Local Code Chunks:', codeChunks);
        // Example 2: Using cloud chunkers
        const cloudSentenceChunker = new cloud_1.CloudSentenceChunker({
            apiKey: process.env.CHONKIE_API_KEY || 'your-api-key-here'
        });
        const cloudCodeChunker = new cloud_1.CloudCodeChunker({
            apiKey: process.env.CHONKIE_API_KEY || 'your-api-key-here'
        });
        // Chunk text using cloud
        const cloudChunks = yield cloudSentenceChunker.chunk(text);
        console.log('Cloud Sentence Chunks:', cloudChunks);
        // Chunk code using cloud
        const cloudCodeChunks = yield cloudCodeChunker.chunk(code);
        console.log('Cloud Code Chunks:', cloudCodeChunks);
    });
}
main().catch(console.error);
//# sourceMappingURL=index.js.map