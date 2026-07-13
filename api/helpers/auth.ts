import { APIRequestContext } from "@playwright/test";

export interface AuthCredentials {
    username: string;
    password: string;
}

export interface AuthOptions {
    authUrl: string;
    credentials: AuthCredentials;
    tokenPath?: string;
}

/**
 * Authenticates with the API and returns the bearer token from the response.
 * Update tokenPath if your API does not return { token: '...' }.
 */
export async function getBearerToken(
    request: APIRequestContext,
    options: AuthOptions,
): Promise<string> {
    const { authUrl, credentials, tokenPath = "token" } = options;

    const response = await request.post(authUrl, {
        data: credentials,
    });

    if (!response.ok()) {
        throw new Error(
            `Authentication failed. Status: ${response.status()} ${response.statusText()}`,
        );
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const token = getValueByPath(payload, tokenPath);

    if (typeof token !== "string" || token.length === 0) {
        throw new Error(
            `Authentication succeeded, but token was not found at path: ${tokenPath}`,
        );
    }

    return token;
}

function getValueByPath(
    source: Record<string, unknown>,
    path: string,
): unknown {
    return path.split(".").reduce<unknown>((accumulator, segment) => {
        if (typeof accumulator !== "object" || accumulator === null) {
            return undefined;
        }

        return (accumulator as Record<string, unknown>)[segment];
    }, source);
}
