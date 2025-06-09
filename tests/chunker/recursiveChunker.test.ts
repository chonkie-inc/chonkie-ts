import { RecursiveChunker } from '../../src/chonkie/chunker/recursive';
import { Tokenizer } from '../../src/chonkie/tokenizer';
import { RecursiveChunk } from '../../src/chonkie/types/recursive';
import { RecursiveLevel, RecursiveRules } from '../../src/chonkie/types/recursive';
import { Chunk } from '../../src/chonkie/types/base';

describe('RecursiveChunker', () => {
  // Sample text for testing
  const sampleText = `# Chunking Strategies in Retrieval-Augmented Generation: A Comprehensive Analysis\n\nIn the rapidly evolving landscape of natural language processing, Retrieval-Augmented Generation (RAG) has emerged as a groundbreaking approach that bridges the gap between large language models and external knowledge bases. At the heart of these systems lies a crucial yet often overlooked process: chunking. This fundamental operation, which involves the systematic decomposition of large text documents into smaller, semantically meaningful units, plays a pivotal role in determining the overall effectiveness of RAG implementations.\n\nThe process of text chunking in RAG applications represents a delicate balance between competing requirements. On one side, we have the need for semantic coherence – ensuring that each chunk maintains meaningful context that can be understood and processed independently. On the other, we must optimize for information density, ensuring that each chunk carries sufficient signal without excessive noise that might impede retrieval accuracy. This balancing act becomes particularly crucial when we consider the downstream implications for vector databases and embedding models that form the backbone of modern RAG systems.\n\nThe selection of appropriate chunk size emerges as a fundamental consideration that significantly impacts system performance. Through extensive experimentation and real-world implementations, researchers have identified that chunks typically perform optimally in the range of 256 to 1024 tokens. However, this range should not be treated as a rigid constraint but rather as a starting point for optimization based on specific use cases and requirements. The implications of chunk size selection ripple throughout the entire RAG pipeline, affecting everything from storage requirements to retrieval accuracy and computational overhead.\n\nFixed-size chunking represents the most straightforward approach to document segmentation, offering predictable memory usage and consistent processing time. However, this apparent simplicity comes with significant drawbacks. By arbitrarily dividing text based on token or character count, fixed-size chunking risks fragmenting semantic units and disrupting the natural flow of information. Consider, for instance, a technical document where a complex concept is explained across several paragraphs – fixed-size chunking might split this explanation at critical junctures, potentially compromising the system's ability to retrieve and present this information coherently.\n\nIn response to these limitations, semantic chunking has gained prominence as a more sophisticated alternative. This approach leverages natural language understanding to identify meaningful boundaries within the text, respecting the natural structure of the document. Semantic chunking can operate at various levels of granularity, from simple sentence-based segmentation to more complex paragraph-level or topic-based approaches. The key advantage lies in its ability to preserve the inherent semantic relationships within the text, leading to more meaningful and contextually relevant retrieval results.\n\nRecent advances in the field have given rise to hybrid approaches that attempt to combine the best aspects of both fixed-size and semantic chunking. These methods typically begin with semantic segmentation but impose size constraints to prevent extreme variations in chunk length. Furthermore, the introduction of sliding window techniques with overlap has proved particularly effective in maintaining context across chunk boundaries. This overlap, typically ranging from 10% to 20% of the chunk size, helps ensure that no critical information is lost at segment boundaries, albeit at the cost of increased storage requirements.\n\nThe implementation of chunking strategies must also consider various technical factors that can significantly impact system performance. Vector database capabilities, embedding model constraints, and runtime performance requirements all play crucial roles in determining the optimal chunking approach. Moreover, content-specific factors such as document structure, language characteristics, and domain-specific requirements must be carefully considered. For instance, technical documentation might benefit from larger chunks that preserve detailed explanations, while news articles might perform better with smaller, more focused segments.\n\nThe future of chunking in RAG systems points toward increasingly sophisticated approaches. Current research explores the potential of neural chunking models that can learn optimal segmentation strategies from large-scale datasets. These models show promise in adapting to different content types and query patterns, potentially leading to more efficient and effective retrieval systems. Additionally, the emergence of cross-lingual chunking strategies addresses the growing need for multilingual RAG applications, while real-time adaptive chunking systems attempt to optimize segment boundaries based on user interaction patterns and retrieval performance metrics.\n\nThe effectiveness of RAG systems heavily depends on the thoughtful implementation of appropriate chunking strategies. While the field continues to evolve, practitioners must carefully consider their specific use cases and requirements when designing chunking solutions. Factors such as document characteristics, retrieval patterns, and performance requirements should guide the selection and optimization of chunking strategies. As we look to the future, the continued development of more sophisticated chunking approaches promises to further enhance the capabilities of RAG systems, enabling more accurate and efficient information retrieval and generation.\n\nThrough careful consideration of these various aspects and continued experimentation with different approaches, organizations can develop chunking strategies that effectively balance the competing demands of semantic coherence, computational efficiency, and retrieval accuracy. As the field continues to evolve, we can expect to see new innovations that further refine our ability to segment and process textual information in ways that enhance the capabilities of RAG systems while maintaining their practical utility in real-world applications.`;

  // Helper function to normalize text for comparison
  const normalizeText = (text: string): string => {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  };

  it('should initialize correctly with default parameters', async () => {
    const chunker = await RecursiveChunker.create({tokenizer: 'EleutherAI/gpt-j-6b'});
    expect(chunker).toBeDefined();
    expect(chunker.rules).toBeDefined();
    expect(chunker.chunkSize).toBe(512);
  });

  it('should initialize correctly with custom parameters', async () => {
    const rules = new RecursiveRules({
      levels: [
        new RecursiveLevel({
          delimiters: ['\n\n']
        })
      ]
    });

    const chunker = await RecursiveChunker.create({tokenizer: 'EleutherAI/gpt-j-6b', chunkSize: 256, rules: rules});
    expect(chunker).toBeDefined();
    expect(chunker.rules).toBe(rules);
    expect(chunker.chunkSize).toBe(256);
  });

  it('should chunk text correctly', async () => {
    const chunker = await RecursiveChunker.create({tokenizer: 'EleutherAI/gpt-j-6b'});
    const chunks = await chunker.chunk(sampleText) as Chunk[];

    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0]).toBeInstanceOf(RecursiveChunk);

    chunks.forEach(chunk => {
      expect(chunk.text).toBeDefined();
      expect(chunk.startIndex).toBeGreaterThanOrEqual(0);
      expect(chunk.endIndex).toBeGreaterThan(chunk.startIndex);
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect((chunk as RecursiveChunk).level).toBeDefined();
    });
  });

  it('should handle empty text', async () => {
    const chunker = await RecursiveChunker.create({tokenizer: 'EleutherAI/gpt-j-6b'});
    const chunks = await chunker.chunk('');
    expect(chunks).toEqual([]);
  });

  it('should handle short text', async () => {
    const text = 'This is a short text, definitely shorter than the chunk size.';
    const chunker = await RecursiveChunker.create({tokenizer: 'EleutherAI/gpt-j-6b'});
    const chunks = await chunker.chunk(text) as Chunk[];

    expect(chunks.length).toBe(1);
    const chunk = chunks[0];
    expect(chunk).toBeInstanceOf(RecursiveChunk);
    expect(normalizeText(chunk.text)).toBe(normalizeText(text));
    expect(chunk.startIndex).toBe(0);
    expect(chunk.endIndex).toBe(text.length);
    expect(chunk.tokenCount).toBeGreaterThan(0);
    expect((chunk as RecursiveChunk).level).toBeDefined();
  });

  it('should have correct indices for chunks', async () => {
    const chunker = await RecursiveChunker.create({tokenizer: 'EleutherAI/gpt-j-6b'});
    const chunks = await chunker.chunk(sampleText) as Chunk[];

    let reconstructedText = '';
    chunks.forEach((chunk, i) => {
      const extractedText = sampleText.slice(chunk.startIndex, chunk.endIndex);
      expect(normalizeText(chunk.text)).toBe(normalizeText(extractedText));
      reconstructedText += chunk.text;
    });

    expect(normalizeText(reconstructedText)).toBe(normalizeText(sampleText));
  });

  it('should have correct string representation', async () => {
    const text = 'This is a short text, definitely shorter than the chunk size.';
    const chunker = await RecursiveChunker.create({tokenizer: 'EleutherAI/gpt-j-6b'});
    const chunks = await chunker.chunk(text) as Chunk[];
    if (chunks.length === 0) {
      return; // Skip if no chunks generated
    }

    const chunk = chunks[0];
    const representation = chunk.toString();
    expect(representation).toContain(`text=${chunk.text}`);
    expect(representation).toContain(`startIndex=${chunk.startIndex}`);
    expect(representation).toContain(`endIndex=${chunk.endIndex}`);
    expect(representation).toContain(`tokenCount=${chunk.tokenCount}`);
    expect(representation).toContain(`level=`);
  });

  it('should work with custom rules', async () => {
    const rules = new RecursiveRules({
      levels: [
        new RecursiveLevel({
          delimiters: ['\n\n']
        })
      ]
    });

    const chunker = await RecursiveChunker.create({tokenizer: 'EleutherAI/gpt-j-6b', chunkSize: 512, rules: rules});
    const chunks = await chunker.chunk(sampleText) as Chunk[];

    expect(chunks.length).toBeGreaterThan(0);
  });

  describe('fromRecipe', () => {
    it('should initialize correctly with default recipe', async () => {
      const chunker = await RecursiveChunker.fromRecipe({});
      expect(chunker).toBeDefined();
      expect(chunker.chunkSize).toBe(512); // default chunk size
      expect(chunker.rules).toBeDefined();
      expect(chunker.rules.length).toBeGreaterThan(0);
      expect(chunker.minCharactersPerChunk).toBe(24); // default min characters
    });

    it('should initialize with custom recipe options', async () => {
      const chunker = await RecursiveChunker.fromRecipe({
        name: 'default',
        language: 'en',
        chunkSize: 256,
        minCharactersPerChunk: 30
      });
      expect(chunker).toBeDefined();
      expect(chunker.chunkSize).toBe(256);
      expect(chunker.minCharactersPerChunk).toBe(30);
      expect(chunker.rules).toBeDefined();
      expect(chunker.rules.length).toBeGreaterThan(0);
    });

    it('should load recursive rules from recipe', async () => {
      const chunker = await RecursiveChunker.fromRecipe({
        name: 'default',
        language: 'en'
      });
      
      // Recipe should provide recursive rules - check that they exist and are reasonable
      expect(chunker.rules).toBeDefined();
      expect(chunker.rules.length).toBeGreaterThan(0);
      
      // Check that levels are properly configured
      for (let i = 0; i < chunker.rules.length; i++) {
        const level = chunker.rules.getLevel(i);
        expect(level).toBeDefined();
        expect(['prev', 'next']).toContain(level!.includeDelim);
      }
    });

    it('should chunk text correctly with recipe configuration', async () => {
      const chunker = await RecursiveChunker.fromRecipe({
        name: 'default',
        language: 'en',
        chunkSize: 100
      });
      
      const testText = `First paragraph with multiple sentences. Another sentence here.

Second paragraph with different content! This should be split differently.

Third paragraph for testing. Final sentence.`;
      
      const chunks = await chunker.chunk(testText) as RecursiveChunk[];
      
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
      
      chunks.forEach(chunk => {
        expect(chunk).toBeInstanceOf(RecursiveChunk);
        expect(chunk.text).toBeDefined();
        expect(chunk.startIndex).toBeGreaterThanOrEqual(0);
        expect(chunk.endIndex).toBeGreaterThan(chunk.startIndex);
        expect(chunk.tokenCount).toBeGreaterThan(0);
        expect(chunk.level).toBeDefined();
        expect(typeof chunk.level).toBe('number');
      });
    });

    it('should respect chunk size from options over recipe defaults', async () => {
      const customChunkSize = 75;
      const chunker = await RecursiveChunker.fromRecipe({
        name: 'default',
        language: 'en',
        chunkSize: customChunkSize
      });
      
      expect(chunker.chunkSize).toBe(customChunkSize);
      
      const chunks = await chunker.chunk(sampleText) as RecursiveChunk[];
      chunks.forEach(chunk => {
        expect(chunk.tokenCount).toBeLessThanOrEqual(customChunkSize + 10); // Allow some flexibility for recursive boundaries
      });
    });

    it('should use recursive rules from recipe for hierarchical chunking', async () => {
      const chunker = await RecursiveChunker.fromRecipe({
        name: 'default',
        language: 'en',
        chunkSize: 50 // Small chunk size to force multiple levels
      });
      
      const chunks = await chunker.chunk(sampleText) as RecursiveChunk[];
      
      // Should have chunks at different recursion levels
      const levels = new Set(chunks.map(chunk => chunk.level));
      expect(levels.size).toBeGreaterThan(1); // Should have multiple recursion levels
      
      // Check that levels are reasonable (not negative, within expected range)
      chunks.forEach(chunk => {
        expect(chunk.level).toBeGreaterThanOrEqual(0);
        expect(chunk.level).toBeLessThan(chunker.rules.length);
      });
    });

    it('should be callable as a function', async () => {
      const chunker = await RecursiveChunker.fromRecipe({
        name: 'default',
        language: 'en'
      });
      
      const testText = "Function call test with multiple sentences. Should work correctly with recursive rules.";
      const chunks = await chunker(testText) as RecursiveChunk[];
      
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toBeInstanceOf(RecursiveChunk);
    });

    it('should handle batch processing', async () => {
      const chunker = await RecursiveChunker.fromRecipe({
        name: 'default',
        language: 'en'
      });
      
      const texts = [
        "First batch text with sentences. Multiple paragraphs here.",
        "Second batch text! Different structure and content for testing."
      ];
      
      const batchChunks = await chunker(texts) as RecursiveChunk[][];
      
      expect(Array.isArray(batchChunks)).toBe(true);
      expect(batchChunks.length).toBe(2);
      
      batchChunks.forEach(chunks => {
        expect(Array.isArray(chunks)).toBe(true);
        chunks.forEach(chunk => {
          expect(chunk).toBeInstanceOf(RecursiveChunk);
        });
      });
    });

    it('should preserve text reconstruction with recipe rules', async () => {
      const chunker = await RecursiveChunker.fromRecipe({
        name: 'default',
        language: 'en',
        chunkSize: 100
      });
      
      const testText = "Text reconstruction test. Multiple sentences for testing. Should work correctly.";
      const chunks = await chunker.chunk(testText) as RecursiveChunk[];
      
      // Reconstruct text from chunks
      const reconstructedText = chunks.map(chunk => chunk.text).join('');
      expect(normalizeText(reconstructedText)).toBe(normalizeText(testText));
    });
  });
}); 