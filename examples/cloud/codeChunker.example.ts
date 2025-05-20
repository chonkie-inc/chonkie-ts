import { CodeChunker } from "chonkie/cloud";

const CHONKIE_API_KEY = "<YOUR API KEY HERE>";

async function main() {
    // Initialize the code chunker with your API key
    const chunker = new CodeChunker(CHONKIE_API_KEY, {
        language: "typescript",  // Programming language of the code
        chunkSize: 100,         // Target number of lines per chunk
        includeNodes: false,
        returnType: "chunks"
    });

    // Example TypeScript code to chunk
    const code = `interface User {
    id: string;
    name: string;
    email: string;
}

class UserService {
    private users: User[] = [];

    addUser(user: User) {
        this.users.push(user);
        return user;
    }

    getUser(id: string): User | undefined {
        return this.users.find(user => user.id === id);
    }

    getAllUsers(): User[] {
        return [...this.users];
    }
}`;

    try {
        // Chunk the code
        console.log("Chunking TypeScript code...");
        const chunks = await chunker.chunk({ text: code });

        console.log("Code chunks:");
        chunks.forEach((chunk, index) => {
            console.log(`\nChunk ${index + 1}:`);
            console.log(chunk.text);
            console.log(`--- (${chunk.text.split('\n').length} lines)`);
        });

        console.log("\nTotal chunks:", chunks.length);
    } catch (error) {
        console.error("Error during code chunking:", error);
    }
}

// Run the demo
main().catch(console.error);
