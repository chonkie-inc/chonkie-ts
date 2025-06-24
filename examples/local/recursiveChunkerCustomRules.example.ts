/*
 * This example shows how to use the RecursiveChunker with custom recursive rules
 * designed for markdown documents. The hierarchy goes:
 * 1. Markdown headers (######, #####, ####, ###, ##, #)
 * 2. Paragraphs (\n\n, \r\n, \n, \r)
 * 3. Sentences (. , ! , ? )
 * 4. Sub-sentences/pauses (commas, semicolons, etc.)
 * 5. Words (whitespace)
 * 6. Tokens (fallback)
 */

// Using selective import for better tree-shaking (avoids loading web-tree-sitter)
import { RecursiveChunker } from "chonkie/chunker/recursive";
import { RecursiveRules, RecursiveLevel } from "chonkie/types";

async function main() {
    console.log("=== RecursiveChunker Custom Rules Example ===\n");

    // Sample markdown text to chunk
    const markdownText = `
# Introduction to Natural Language Processing

Natural language processing (NLP) is a fascinating field that combines linguistics, computer science, and artificial intelligence. It focuses on the interaction between computers and human language.

## What is NLP?

NLP is a branch of AI that helps computers understand, interpret, and manipulate human language. It bridges the gap between human communication and computer understanding.

### Key Components

There are several key components that make NLP possible:

#### Text Processing
- Tokenization: breaking text into individual words or tokens
- Part-of-speech tagging: identifying grammatical roles
- Named entity recognition: finding people, places, organizations

#### Language Understanding
- Syntax analysis: understanding sentence structure
- Semantic analysis: extracting meaning from text
- Discourse analysis: understanding context across sentences

## Applications of NLP

NLP has numerous real-world applications that we use daily.

### Machine Translation
Services like Google Translate use sophisticated NLP models to convert text from one language to another. This involves understanding context, idioms, and cultural nuances.

### Chatbots and Virtual Assistants
From Siri to customer service bots, NLP enables machines to understand and respond to human queries in natural language.

## Challenges in NLP

Despite significant advances, NLP still faces many challenges: ambiguity in language, context dependency, and cultural variations make it difficult to achieve perfect understanding.

# Conclusion

Natural language processing continues to evolve rapidly. As models become more sophisticated and datasets grow larger, we can expect even more impressive capabilities in the future.
    `.trim();

    // Create custom recursive rules for markdown
    const customRules = new RecursiveRules({
        levels: [
            // Level 0: Markdown headers (highest priority)
            new RecursiveLevel({
                delimiters: ['######', '#####', '####', '###', '##', '#'],
                includeDelim: 'next'
            }).toDict(),
            
            // Level 1: Paragraphs
            new RecursiveLevel({
                delimiters: ['\n\n', '\r\n\r\n', '\r\r'],
                includeDelim: 'prev'
            }).toDict(),
            
            // Level 2: Sentences
            new RecursiveLevel({
                delimiters: ['. ', '! ', '? ', '.\n', '!\n', '?\n'],
                includeDelim: 'prev'
            }).toDict(),
            
            // Level 3: Sub-sentences (punctuation-based pauses)
            new RecursiveLevel({
                delimiters: [
                    ', ', '; ', ': ', ' - ', ' — ', ' – ',
                    '(', ')', '[', ']', '{', '}',
                    '"', "'", '`', '...', '|'
                ],
                includeDelim: 'prev'
            }).toDict(),
            
            // Level 4: Words (whitespace)
            new RecursiveLevel({
                whitespace: true,
                includeDelim: 'prev'
            }).toDict(),
            
            // Level 5: Tokens (fallback)
            new RecursiveLevel({
                includeDelim: 'prev'
            }).toDict()
        ]
    });

    console.log("Custom Recursive Rules for Markdown:");
    for (let i = 0; i < customRules.length; i++) {
        const level = customRules.getLevel(i);
        console.log(`  Level ${i}: ${level?.toString()}`);
    }
    console.log();

    // Create chunker with custom rules
    const chunker = await RecursiveChunker.create({
        chunkSize: 200,  // Reasonable size for markdown sections
        minCharactersPerChunk: 30,
        rules: customRules
    });

    console.log("Chunker configuration:");
    console.log(`  Chunk size: ${chunker.chunkSize}`);
    console.log(`  Min characters per chunk: ${chunker.minCharactersPerChunk}`);
    console.log(`  Number of recursive levels: ${chunker.rules.length}`);
    console.log();

    // Chunk the markdown text
    console.log("Chunking markdown text...");
    const chunks = await chunker(markdownText);

    console.log(`✓ Created ${chunks.length} chunks:\n`);

    // Display each chunk with detailed information
    chunks.forEach((chunk, index) => {
        const levelName = getLevelName(chunk.level || 0);
        console.log(`Chunk ${index + 1} [Level ${chunk.level} - ${levelName}]:`);
        console.log(`  Token count: ${chunk.tokenCount}`);
        console.log(`  Character range: ${chunk.startIndex}-${chunk.endIndex}`);
        
        // Show a preview of the chunk text (first 100 characters)
        const preview = chunk.text.replace(/\n/g, '\\n').substring(0, 100);
        console.log(`  Preview: "${preview}${chunk.text.length > 100 ? '...' : ''}"`);
        console.log();
    });

    // Analyze chunk distribution by level
    console.log("=".repeat(50));
    console.log("Chunk Analysis:");
    
    const levelCounts = new Map<number, number>();
    const levelTokens = new Map<number, number>();
    
    chunks.forEach(chunk => {
        const level = chunk.level || 0;
        levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
        levelTokens.set(level, (levelTokens.get(level) || 0) + chunk.tokenCount);
    });

    console.log("\nDistribution by recursion level:");
    Array.from(levelCounts.entries()).sort().forEach(([level, count]) => {
        const levelName = getLevelName(level);
        const totalTokens = levelTokens.get(level) || 0;
        const avgTokens = Math.round(totalTokens / count);
        console.log(`  Level ${level} (${levelName}): ${count} chunks, ${totalTokens} total tokens, ${avgTokens} avg tokens/chunk`);
    });

    // Verify text reconstruction
    console.log("\n" + "=".repeat(50));
    console.log("Verifying text reconstruction...");
    const reconstructedText = chunks.map(chunk => chunk.text).join('');
    const isMatch = reconstructedText.trim() === markdownText.trim();
    console.log(`✓ Text reconstruction: ${isMatch ? 'PASSED' : 'FAILED'}`);

    if (!isMatch) {
        console.log(`Original length: ${markdownText.length}`);
        console.log(`Reconstructed length: ${reconstructedText.length}`);
    }
}

function getLevelName(level: number): string {
    const levelNames = [
        'Headers',
        'Paragraphs', 
        'Sentences',
        'Sub-sentences',
        'Words',
        'Tokens'
    ];
    return levelNames[level] || 'Unknown';
}

main().catch(console.error);