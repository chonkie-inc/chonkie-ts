/** Base cloud client for Chonkie API. */

export interface CloudClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface ChunkerInput {
  text?: string;
  filepath?: string;
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

    // Don't set Content-Type or stringify body if it's FormData
    const isFormData = body instanceof FormData;
    const requestHeaders = {
      "Authorization": `Bearer ${this.apiKey}`,
      ...headers,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: requestHeaders,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
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