import { expect, test } from "../setup";

test.describe("API example tests", () => {
    test("gets protected resource using bearer token auth", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}/health`);

        expect(response.ok()).toBeTruthy();
    });

    test("creates a resource using authenticated POST", async ({
        api,
        apiBaseUrl,
    }) => {
        const payload = {
            name: "example-item",
            isActive: true,
        };

        const response = await api.post(`${apiBaseUrl}/items`, {
            data: payload,
        });

        expect([200, 201]).toContain(response.status());
    });
});
