// Example of running Chonkie's CodeChunker class

import { CodeChunker } from "../src/chonkie";

async function main() {
    // Sample TypeScript code for testing
    const sampleCode = `
interface UserProfile {
  id: string;
  username: string;
  email?: string;
}

class ApiClient<T> {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async fetchData(endpoint: string): Promise<T> {
    try {
      const response = await fetch(\`\${this.baseUrl}/\${endpoint}\`);
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      const data: T = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch data:", error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    console.log(\`Fetching profile for user: \${userId}\`);
    // Simulate an API call
    await new Promise(resolve => setTimeout(resolve, 100)); 
    return {
      id: userId,
      username: \`user_\${userId}\`,
      email: \`user_\${userId}@example.com\`
    };
  }
}

async function processUserData() {
  const client = new ApiClient<UserProfile>("https://api.example.com");
  try {
    const userProfile = await client.getUserProfile("123");
    console.log("Fetched User Profile:", userProfile);

    // Example of using the generic fetchData (though it won't actually run here)
    // const anotherData = await client.fetchData("some/other/endpoint");
    // console.log("Fetched generic data:", anotherData);
  } catch (error) {
    console.error("Error in processing user data:", error);
  }
}

processUserData();
    `;

    // Let's create a code chunker for TypeScript
    // You might need to adjust the chunkSize based on your needs and tokenizer
    const codeChunker = await CodeChunker.create({ lang: 'typescript', chunkSize: 128, tokenizer: 'Xenova/gpt2' });
    const chunks = await codeChunker(sampleCode);
    console.log("Chunks:", chunks);

    // Let's check for reconstructability of the chunks
    const reconstructedCode = chunks.map(chunk => {
      // The 'text' property holds the code string for each chunk
      return chunk.text;
    }).join("");

    console.log("Reconstructed Code:", reconstructedCode);
    console.log("Original Code:", sampleCode);

    // Due to the nature of code chunking (e.g. adding/removing whitespace or minor syntax adjustments for valid sub-chunks),
    // a direct string comparison might not always be true, especially if the chunking logic
    // has to split tokens or make adjustments for valid syntax in sub-components.
    // The most important aspect is semantic reconstructability and that all information is present.
    // For a more robust check, you might need a code-aware comparison or AST comparison.
    // However, for this example, we'll still do a direct string comparison.
    const originalTrimmed = sampleCode.trim().replace(/\r\n/g, '\n');
    const reconstructedTrimmed = reconstructedCode.trim().replace(/\r\n/g, '\n');

    console.log("Reconstruction Match (trimmed):", reconstructedTrimmed === originalTrimmed);

}

main().catch(error => {
  console.error("Error running CodeChunker example:", error);
});
