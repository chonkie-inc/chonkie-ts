/**
 * Base cloud client for interacting with api.chonkie.ai
 */

import { formatApiError } from '@/utils';

export interface CloudClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ChunkerInput {
  text?: string;
  filepath?: string;
}

export class CloudClient {
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
      body?: any;
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
}
