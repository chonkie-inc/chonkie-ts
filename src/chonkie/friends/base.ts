/** Base class for Chonkie's Handshakes. */

import { Chunk } from "../types/base";


export abstract class BaseHandshake {

    public abstract write(chunks: Chunk[]): Promise<void>;
}