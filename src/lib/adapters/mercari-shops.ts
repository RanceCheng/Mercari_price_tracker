import { createHash } from "node:crypto";

import type { NormalizedProductPayload, ProductStatus, RateLimitState } from "@/lib/types";

interface MercariProductNode {
  id: string;
  name: string;
  price: number;
  status?: string | null;
  condition?: string | null;
  imageUrls?: string[] | null;
  updatedAt?: string | null;
  shop?: { id?: string | null } | null;
}

interface MercariProductsResponse {
  data?: {
    products?: {
      edges?: Array<{ node?: MercariProductNode | null }>;
      pageInfo?: { endCursor?: string | null; hasNextPage?: boolean | null };
    } | null;
  };
  errors?: Array<{ message?: string }>;
}

export interface MercariAdapterConfig {
  endpoint: string;
  token: string;
  userAgent: string;
}

export interface FetchProductsOptions {
  after?: string;
  first?: number;
  keyword?: string;
}

export interface FetchProductsResult {
  products: NormalizedProductPayload[];
  pageInfo: {
    endCursor: string | null;
    hasNextPage: boolean;
  };
  rateLimit: RateLimitState;
}

const PRODUCTS_QUERY = `
  query Products($after: String, $first: Int, $keyword: String) {
    products(after: $after, first: $first, keyword: $keyword) {
      edges {
        node {
          id
          name
          price
          status
          condition
          imageUrls
          updatedAt
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export class MercariShopsGraphQLAdapter {
  constructor(private readonly config: MercariAdapterConfig) {}

  async fetchProducts(options: FetchProductsOptions = {}): Promise<FetchProductsResult> {
    const response = await fetch(this.config.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.config.token}`,
        "Content-Type": "application/json",
        "User-Agent": this.config.userAgent,
      },
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: {
          after: options.after ?? null,
          first: options.first ?? 50,
          keyword: options.keyword ?? null,
        },
      }),
    });

    const rateLimit = readRateLimitHeaders(response.headers);
    const payload = (await response.json()) as MercariProductsResponse;

    if (!response.ok || payload.errors?.length) {
      const message = payload.errors?.map((error) => error.message).join("; ") || response.statusText;
      throw new Error(`Mercari Shops API request failed: ${message}`);
    }

    const edges = payload.data?.products?.edges ?? [];
    const products = edges
      .map((edge) => edge.node)
      .filter((node): node is MercariProductNode => Boolean(node))
      .map(normalizeMercariProduct);

    return {
      products,
      pageInfo: {
        endCursor: payload.data?.products?.pageInfo?.endCursor ?? null,
        hasNextPage: Boolean(payload.data?.products?.pageInfo?.hasNextPage),
      },
      rateLimit,
    };
  }
}

export function createMercariAdapterFromEnv() {
  const endpoint = process.env.MERCARI_API_ENDPOINT;
  const token = process.env.MERCARI_API_TOKEN;
  const userAgent = process.env.MERCARI_USER_AGENT;

  if (!endpoint || !token || !userAgent) {
    throw new Error("Missing MERCARI_API_ENDPOINT, MERCARI_API_TOKEN, or MERCARI_USER_AGENT.");
  }

  return new MercariShopsGraphQLAdapter({ endpoint, token, userAgent });
}

function normalizeMercariProduct(node: MercariProductNode): NormalizedProductPayload {
  const rawHash = createHash("sha256").update(JSON.stringify(node)).digest("hex");

  return {
    source: "MERCARI_SHOPS",
    externalProductId: node.id,
    title: node.name,
    price: node.price,
    currency: "JPY",
    status: normalizeStatus(node.status),
    imageUrls: node.imageUrls ?? [],
    condition: node.condition ?? null,
    sellerId: node.shop?.id ?? null,
    sourceUrl: null,
    rawHash,
    fetchedAt: node.updatedAt ?? new Date().toISOString(),
  };
}

function normalizeStatus(status?: string | null): ProductStatus {
  switch (status) {
    case "ON_SALE":
    case "SOLD_OUT":
    case "DELETED":
      return status;
    default:
      return "UNKNOWN";
  }
}

function readRateLimitHeaders(headers: Headers): RateLimitState {
  const limit = readNumberHeader(headers, "x-ratelimit-limit") ?? readNumberHeader(headers, "x-ratelimitlimit");
  const remaining = readNumberHeader(headers, "x-ratelimit-remaining") ?? readNumberHeader(headers, "x-ratelimitremaining");
  const reset = headers.get("x-ratelimit-reset") ?? headers.get("x-ratelimitreset");
  const cost = readNumberHeader(headers, "x-ratelimit-query-cost") ?? readNumberHeader(headers, "x-query-cost");

  return {
    limit,
    remaining,
    resetAt: reset ? new Date(Number(reset) * 1000).toISOString() : null,
    cost,
  };
}

function readNumberHeader(headers: Headers, key: string) {
  const value = headers.get(key);
  return value ? Number(value) : null;
}
