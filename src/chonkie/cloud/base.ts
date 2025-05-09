/** Base cloud client for Chonkie API. */

import { Chunk } from "../types/base";

export interface CloudClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export class CloudClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: CloudClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.chonkie.ai";
  }

  protected async request<T>(
    endpoint: string,
    options: {
      method?: string;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const { method = "POST", body, headers = {} } = options;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(`API request failed: ${error.message}`);
    }

    return response.json();
  }

  protected async validateAuth(): Promise<boolean> {
    try {
      const response = await this.request<{ message: string; status: number }>("/v1/auth/validate");
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
} 