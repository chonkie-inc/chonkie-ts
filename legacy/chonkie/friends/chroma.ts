/** ChromaHandshake to integrate Chonkie with Chroma. */

import { BaseHandshake } from "./base";
import { ChromaClient } from "chromadb";
import { generateRandomCollectionName } from "./utils";
import { Chunk } from "../types/base";
import { v5 as uuidv5 } from "uuid";

/**
 * ChromaHandshake to integrate Chonkie with Chroma.
 * 
 * @param client - The ChromaClient to use.
 * @param collectionName - The name of the collection to use.
 * @param path - The path to the Chroma database. Can point to the running instance, Docker or Cloud.
 * @param logLevel - The log level ('verbose' or 'silent'). Default: 'verbose'.
 */
export class ChromaHandshake extends BaseHandshake {

  private client: ChromaClient;
  private collectionName: string;
  private logLevel: 'verbose' | 'silent';

  constructor(client?: ChromaClient, collectionName?: string, path?: string, logLevel: 'verbose' | 'silent' = 'verbose') {
    super();

    // If the client is not provided, create a new one
    this.client = client ?? new ChromaClient({ path });
    // If the collection name is not provided, generate a random one
    this.collectionName = collectionName ?? generateRandomCollectionName();
    this.logLevel = logLevel;

    // Print to console the collection name if verbose
    if (this.logLevel === 'verbose') {
      console.log(`Using collection ${this.collectionName}`);
    }
  }

  private _getId(index: number, chunk: Chunk): string {
    const id = uuidv5(`CHUNK-${index}:${chunk.text}`, uuidv5.DNS);
    return id;
  }

  /**
   * Write chunks to the collection provided in the constructor.
   * @param chunks - The chunks to write.
   */
  public async write(chunks: Chunk[]): Promise<void> {
    // Check if the collection exists and if not, create it
    const collection = await this.client.getOrCreateCollection({ name: this.collectionName });
    
    // Create a list of ids and documents to upsert
    const ids: string[] = [];
    const documents: string[] = [];
    const metadatas: Record<string, any>[] = [];
    for (const [index, chunk] of chunks.entries()) {
      ids.push(this._getId(index, chunk));
      documents.push(chunk.text);
      metadatas.push({
        "start_index": chunk.startIndex,
        "end_index": chunk.endIndex,
        "token_count": chunk.tokenCount,
      });
    }

    // Upsert the chunks into the collection
    await collection.upsert({
      ids: ids,
      documents: documents,
      metadatas: metadatas,
    });

    // Print to console the number of chunks upserted if verbose
    if (this.logLevel === 'verbose') {
      console.log(`Upserted ${chunks.length} chunks into the collection ${this.collectionName}`);
    }
  }

  /**
   * Query the collection provided in the constructor.
   * @param query - The query to search for.
   * @param nResults - The number of results to return.
   * @returns The chunks that match the query.
   */
  public async query(query: string, nResults: number = 10): Promise<Chunk[]> {
    const collection = await this.client.getCollection({ name: this.collectionName });
    const results = await collection.query({
      queryTexts: [query],
      nResults: nResults,
    });

    // Return the chunks
    const { documents, metadatas } = results;
    return documents[0].map((document, index) => {
      const metadata = metadatas[0][index];
      return new Chunk({
        text: document ?? '',
        startIndex: Number(metadata?.start_index) || 0,
        endIndex: Number(metadata?.end_index) || 0,
        tokenCount: Number(metadata?.token_count) || 0,
      });
    });
  }
}