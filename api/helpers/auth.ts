import { APIRequestContext } from "@playwright/test";

export interface AuthCredentials {
    username?: string;
    email?: string;
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
    /* similar to below 
    const authUrl = options.authUrl;
    const credentials = options.credentials;
    const tokenPath = options.tokenPath;
    for tokenpath = "token" is same as options.token if empty default token
    */

    const response = await request.post(authUrl, {
        data: credentials,
    });
    //post a request to get response with data as payload
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
//const token = await getBearerToken(...); to call the function to get token

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

//above is a function to use to get value from an object like data.address.number in a json
//accumulator iterates down the json untill it gets the value down the path
