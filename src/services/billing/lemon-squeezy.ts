import type { PlanCode } from "@/types/subscription";

const LEMON_API_BASE_URL = "https://api.lemonsqueezy.com/v1";

type JsonApiListResponse<T> = {
  data: T[];
};

type JsonApiItemResponse<T> = {
  data: T;
};

interface LemonStore {
  id: string;
  attributes: {
    name: string;
  };
}

interface LemonProduct {
  id: string;
  attributes: {
    name: string;
    slug: string;
  };
}

interface LemonVariant {
  id: string;
  attributes: {
    product_id: number;
    name: string;
    status: string;
  };
}

interface LemonCheckout {
  id: string;
  attributes: {
    url: string;
  };
}

const getApiKey = () => {
  const apiKey = process.env.LEMON_API_KEY;
  if (!apiKey) {
    throw new Error("LEMON_API_KEY is not set.");
  }
  return apiKey;
};

export const getStoreId = () => {
  const storeId = process.env.LEMON_STORE_ID;
  if (!storeId) {
    throw new Error("LEMON_STORE_ID is not set.");
  }
  return storeId;
};

const lemonFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${LEMON_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${getApiKey()}`,
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Lemon Squeezy API error (${response.status}): ${errorText || response.statusText}`
    );
  }

  return response.json() as Promise<T>;
};

export const listStores = async () =>
  lemonFetch<JsonApiListResponse<LemonStore>>("/stores");

export const listProducts = async () => {
  const storeId = process.env.LEMON_STORE_ID;
  const params = new URLSearchParams();
  if (storeId) {
    params.set("filter[store_id]", storeId);
  }
  const query = params.toString();
  return lemonFetch<JsonApiListResponse<LemonProduct>>(
    `/products${query ? `?${query}` : ""}`
  );
};

export const listVariants = async (productId?: string) => {
  const params = new URLSearchParams();
  if (productId) {
    params.set("filter[product_id]", productId);
  }
  const query = params.toString();
  return lemonFetch<JsonApiListResponse<LemonVariant>>(
    `/variants${query ? `?${query}` : ""}`
  );
};

export const getPlanProductId = (planCode: PlanCode) => {
  switch (planCode) {
    case "STARTER":
      return process.env.LEMON_STARTER_PRODUCT_ID || null;
    case "PRO":
      return process.env.LEMON_PRO_PRODUCT_ID || null;
    default:
      return null;
  }
};

export const getPlanVariantId = (planCode: PlanCode) => {
  switch (planCode) {
    case "STARTER":
      return process.env.LEMON_STARTER_VARIANT_ID || null;
    case "PRO":
      return process.env.LEMON_PRO_VARIANT_ID || null;
    default:
      return null;
  }
};

export const getPlanCodeFromProductId = (productId?: string | number) => {
  if (!productId) {
    return null;
  }
  const normalized = productId.toString();
  if (normalized === process.env.LEMON_STARTER_PRODUCT_ID) {
    return "STARTER" as const;
  }
  if (normalized === process.env.LEMON_PRO_PRODUCT_ID) {
    return "PRO" as const;
  }
  return null;
};

export const resolveVariantId = async (planCode: PlanCode) => {
  const explicitVariantId = getPlanVariantId(planCode);
  if (explicitVariantId) {
    return explicitVariantId;
  }

  const productId = getPlanProductId(planCode);
  if (!productId) {
    throw new Error(`No product ID configured for ${planCode}.`);
  }

  const variants = await listVariants(productId);
  const activeVariant =
    variants.data.find((variant) => variant.attributes.status === "published") ||
    variants.data[0];

  if (!activeVariant) {
    throw new Error(`No variants found for product ${productId}.`);
  }

  return activeVariant.id;
};

export const createCheckout = async (payload: {
  storeId: string;
  variantId: string;
  redirectUrl: string;
  customData?: Record<string, unknown>;
  email?: string;
  name?: string;
}) => {
  const { storeId, variantId, redirectUrl, customData, email, name } = payload;

  return lemonFetch<JsonApiItemResponse<LemonCheckout>>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          product_options: {
            enabled_variants: [Number(variantId)],
            redirect_url: redirectUrl,
          },
          checkout_data: {
            email,
            name,
            custom: customData ?? {},
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
          },
        },
      },
    }),
  });
};
