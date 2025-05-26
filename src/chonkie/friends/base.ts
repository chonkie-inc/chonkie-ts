/** Base class for Chonkie's Handshakes. */

import { Chunk } from "../types/base";


export abstract class BaseHandshake {

    public abstract write(chunks: Chunk[]): Promise<void>;
    public abstract query(query: string, nResults: number): Promise<Chunk[]>;
}