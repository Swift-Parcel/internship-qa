import { APIRequestContext, APIResponse } from "@playwright/test";
import { AuthOptions, getBearerToken } from "./auth";

export interface ApiClient {
    get(url: string, options?: RequestInitOptions): Promise<APIResponse>;
    post(url: string, options?: RequestInitOptions): Promise<APIResponse>;
    put(url: string, options?: RequestInitOptions): Promise<APIResponse>;
    patch(url: string, options?: RequestInitOptions): Promise<APIResponse>;
    delete(url: string, options?: RequestInitOptions): Promise<APIResponse>;
}

export interface RequestInitOptions {
    headers?: Record<string, string>;
    data?: unknown;
    params?: Record<string, string | number | boolean>;
}

export interface AuthenticatedApiClientOptions {
    request: APIRequestContext;
    bearerToken: string;
}

/**
 * Creates an API client that injects the provided bearer token in every request header.
 */
export function createApiClientWithBearerToken({
    request,
    bearerToken,
}: AuthenticatedApiClientOptions): ApiClient {
    const withAuthHeader = (
        options: RequestInitOptions = {},
    ): RequestInitOptions => {
        return {
            ...options,
            headers: {
                Authorization: `Bearer ${bearerToken}`,
                ...(options.headers ?? {}),
            },
        };
    };

    return {
        get: (url, options) => request.get(url, withAuthHeader(options)),
        post: (url, options) => request.post(url, withAuthHeader(options)),
        put: (url, options) => request.put(url, withAuthHeader(options)),
        patch: (url, options) => request.patch(url, withAuthHeader(options)),
        delete: (url, options) => request.delete(url, withAuthHeader(options)),
    };
}

/**
 * Creates an API client that injects the bearer token in every request header.
 */
export async function createAuthenticatedApiClient(
    request: APIRequestContext,
    authOptions: AuthOptions,
): Promise<ApiClient> {
    const bearerToken = await getBearerToken(request, authOptions);
    return createApiClientWithBearerToken({ request, bearerToken });
}
