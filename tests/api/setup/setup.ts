import {
    expect as baseExpect,
    request as playwrightRequest,
    test as base,
} from "@playwright/test";
import {
    ApiClient,
    createApiClientWithBearerToken,
} from "../../../api/helpers/apiClient";
import { getBearerToken } from "../../../api/helpers/auth";

interface ApiFixtures {
    api: ApiClient;
    apiBaseUrl: string;
}

interface ApiWorkerFixtures {
    authState: {
        apiBaseUrl: string;
        bearerToken: string;
    };
}

function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}. Configure it in .env.`,
        );
    }

    return value;
}

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
    authState: [
        async ({}, use) => {
            const requestContext = await playwrightRequest.newContext();
            const apiAuthUrl = getRequiredEnv("API_AUTH_URL");
            const apiUsername = getRequiredEnv("API_USERNAME");
            const apiPassword = getRequiredEnv("API_PASSWORD");
            const apiBaseUrl = getRequiredEnv("API_BASE_URL");
            const tokenPath = process.env.API_TOKEN_PATH ?? "token";

            const bearerToken = await getBearerToken(requestContext, {
                authUrl: apiAuthUrl,
                credentials: {
                    username: apiUsername,
                    password: apiPassword,
                },
                tokenPath,
            });

            await use({
                apiBaseUrl,
                bearerToken,
            });

            await requestContext.dispose();
        },
        { scope: "worker" },
    ],

    apiBaseUrl: async ({ authState }, use) => {
        await use(authState.apiBaseUrl);
    },

    api: async ({ request, authState }, use) => {
        const api = createApiClientWithBearerToken({
            request,
            bearerToken: authState.bearerToken,
        });

        await use(api);
    },
});

export const expect = baseExpect;
