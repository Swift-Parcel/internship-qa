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
    backofficeApi: ApiClient; //new
    apiBaseUrl: string;
    backofficeBaseUrl: string; //new
}

interface ApiWorkerFixtures {
    authState: {
        apiBaseUrl: string;
        bearerToken: string;
    };
    backofficeAuthState: {
        backofficeBaseUrl: string;
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
            const tokenPath = process.env.API_TOKEN_PATH ?? "access_token";

            const bearerToken = await getBearerToken(requestContext, {
                authUrl: apiAuthUrl,
                credentials: {
                    email: apiUsername,
                    //username: apiUsername,
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
    //backoffice
    backofficeAuthState: [
        async ({}, use) => {
            const requestContext = await playwrightRequest.newContext();
            const backofficeAuthUrl = getRequiredEnv("BACKOFFICE_AUTH_URL");
            const backofficeAdminUsername = getRequiredEnv(
                "BACKOFFICE_ADMIN_USERNAME",
            );
            const backofficeAdminPassword = getRequiredEnv(
                "BACKOFFICE_ADMIN_PASSWORD",
            );
            const backofficeBaseUrl = getRequiredEnv("BACKOFFICE_BASE_URL");
            const tokenPath = process.env.BACKOFFICE_TOKEN_PATH ?? "token";

            const bearerToken = await getBearerToken(requestContext, {
                authUrl: backofficeAuthUrl,
                credentials: {
                    username: backofficeAdminUsername, // C# username
                    password: backofficeAdminPassword,
                },
                tokenPath,
            });

            await use({
                backofficeBaseUrl,
                bearerToken,
            });

            await requestContext.dispose();
        },
        { scope: "worker" },
    ],

    apiBaseUrl: async ({ authState }, use) => {
        await use(authState.apiBaseUrl);
    },

    backofficeBaseUrl: async ({ backofficeAuthState }, use) => {
        //new
        await use(backofficeAuthState.backofficeBaseUrl);
    },

    api: async ({ request, authState }, use) => {
        const api = createApiClientWithBearerToken({
            request,
            bearerToken: authState.bearerToken,
        });

        await use(api);
    },
    backofficeApi: async ({ request, backofficeAuthState }, use) => {
        const backofficeApi = createApiClientWithBearerToken({
            //new
            request,
            bearerToken: backofficeAuthState.bearerToken,
        });

        await use(backofficeApi);
    },
});

export const expect = baseExpect;
