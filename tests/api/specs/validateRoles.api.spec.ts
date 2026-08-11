import { test, expect } from "../setup/setupBackOffice";

test("testing accessing reports with a none admin role", async ({
    apiBaseUrl,
}) => {
    //create new api request with different username token
    const requestContext = await playwrightRequest.newContext();

    try {
        function getRequiredEnv(name: string): string {
            const value = process.env[name];

            if (!value) {
                throw new Error(
                    `Missing required environment variable: ${name}. Configure it in .env.`,
                );
            }

            return value;
        }
        const bearerToken = await getBearerToken(requestContext, {
            authUrl: getRequiredEnv("BACKOFFICE_API_AUTH_URL"),
            credentials: {
                username: getRequiredEnv("READONLY_BACKOFFICE_API_USERNAME"),
                password: getRequiredEnv("READONLY_BACKOFFICE_API_PASSWORD"),
            },
            tokenPath: process.env.BACKOFFICE_API_TOKEN_PATH ?? "token",
        });

        const readonlyApi = createApiClientWithBearerToken({
            request: requestContext,
            bearerToken,
        });
        const response = await readonlyApi.get(
            `${apiBaseUrl}reports/sla-breaches`,
        );
        const bodyResponse = await response.json();

        expect(response.status()).toBe(403);

        expect(bodyResponse.message).toBe(
            "User does not have permission to perform this action.",
        );
    } finally {
        await requestContext.dispose();
    }
});
