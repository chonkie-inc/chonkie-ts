/**
 * Base cloud client for interacting with api.chonkie.ai
 */

import { formatApiError, FileUploadResponse, FileReference, createFileReference } from '@/utils';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

export interface CloudClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ChunkerInput {
  text?: string;
  filepath?: string;
  file?: FileReference;
}

export class CloudBaseChunker {
  protected readonly apiKey: string;
  protected readonly baseUrl: string;

  constructor(config: CloudClientConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.chonkie.ai';
  }

  protected async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: FormData | Record<string, unknown>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = 'POST', body, headers = {} } = options;

    const isFormData = body instanceof FormData;
    const requestHeaders: Record<string, string> = {
      'Authorization': `Bearer ${this.apiKey}`,
      ...headers,
    };

    // Don't set Content-Type for FormData
    if (!isFormData && body) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = response.statusText || 'Unknown error';

      try {
        const errorJson = JSON.parse(errorText) as { message?: string; error?: string; detail?: string };
        errorMessage = errorJson.message || errorJson.error || errorJson.detail || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }

      const formattedError = formatApiError(response.status, errorMessage, endpoint);
      throw new Error(formattedError);
    }

    return response.json() as Promise<T>;
  }

  async validateAuth(): Promise<boolean> {
    try {
      const response = await this.request<{ message: string; status: number }>('/v1/auth/validate', {
        method: 'GET'
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Upload a file to the Chonkie API for OCR/document processing.
   * This is an internal method used by chunkers to upload files before chunking.
   *
   * @param filepath - Path to the file to upload
   * @returns FileReference object that can be used in subsequent API calls
   * @internal
   */
  protected async uploadFile(filepath: string): Promise<FileReference> {
    if (!filepath) {
      throw new Error('File path is required');
    }

    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const formData = new FormData();
    const fileContent = fs.readFileSync(filepath);
    const fileName = path.basename(filepath);

    // Detect MIME type from file extension
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';
    const blob = new Blob([fileContent], { type: mimeType });
    formData.append('file', blob, fileName);

    const response = await this.request<FileUploadResponse>('/v1/files', {
      method: 'POST',
      body: formData,
    });

    // The API might return different field names, check common variations
    const documentName = response.document || (response as Record<string, unknown>).filename || (response as Record<string, unknown>).name || (response as Record<string, unknown>).id;

    if (!documentName || typeof documentName !== 'string') {
      throw new Error(`Invalid file upload response: missing document identifier. Response: ${JSON.stringify(response)}`);
    }

    // Return a FileReference with type 'document' and the document name
    return createFileReference('document', documentName);
  }
}
