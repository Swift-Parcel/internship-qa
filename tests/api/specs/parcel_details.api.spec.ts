import { test, expect } from "../setup/setupBackOffice";

test.describe("Back-Office Integration API — Parcel Validation", () => {
    const validTrackingNumber = "SP-20230101";
    const nonExistentTrackingNumber = "SP-99999999";

    const backofficeBaseUrl = process.env.BACKOFFICE_API_BASE_URL!;
    const integrationSecretKey = process.env.INTEGRATION_SECRET_KEY!;
    const authUrl = process.env.BACKOFFICE_API_AUTH_URL!;
    const username = process.env.BACKOFFICE_API_USERNAME!;
    const password = process.env.BACKOFFICE_API_PASSWORD!;
    const tokenPath = process.env.BACKOFFICE_API_TOKEN_PATH!;

    let authToken = "";
    let integrationHeaders: Record<string, string> = {};

    test.beforeAll(async ({ request }) => {
        const loginResponse = await request.post(authUrl, {
            data: {
                username: username,
                password: password,
            },
        });

        if (loginResponse.ok()) {
            const body = await loginResponse.json();
            authToken = body[tokenPath];
        }

        integrationHeaders = {
            "X-Api-Key": integrationSecretKey,
            Authorization: `Bearer ${authToken}`,
        };
    });

    test.describe("GET /api/integration/parcels/{trackingNumber}", () => {
        test("1. Should successfully retrieve full parcel status and tracking history (200 OK)", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/parcels/${validTrackingNumber}`;

            const response = await request.get(endpoint, {
                headers: integrationHeaders,
            });

            const responseData = await response.json().catch(() => null);

            console.log("Status Code:", response.status());
            console.log("Body:", JSON.stringify(responseData, null, 2));

            expect(response.status()).toBe(200);
            expect(responseData).toBeDefined();

            expect(responseData).toHaveProperty("parcel_status");
            expect(responseData.parcel_status).toBe("DELIVERED");

            expect(responseData).toHaveProperty("location");
            expect(responseData.location).toMatchObject({
                facility: "Recipient address",
                city: "Debrecen",
                country_code: "HU",
                postal_code: "4024",
                lat: 47.529,
                lon: 21.625,
            });

            expect(responseData).toHaveProperty("tracking_history");
            expect(Array.isArray(responseData.tracking_history)).toBe(true);
        });

        test("2. Should return '404 Not Found' for non-existent tracking number", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/parcels/${nonExistentTrackingNumber}`;

            const response = await request.get(endpoint, {
                headers: integrationHeaders,
            });

            expect(response.status()).toBe(404);
        });
    });

    test.describe("GET /api/integration/parcels/{trackingNumber}/status", () => {
        test("1. Should successfully retrieve parcel status only (200 OK)", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/parcels/${validTrackingNumber}/status`;

            const response = await request.get(endpoint, {
                headers: integrationHeaders,
            });

            const responseData = await response.json().catch(() => null);

            console.log("Status Code:", response.status());
            console.log("Body:", JSON.stringify(responseData, null, 2));

            expect(response.status()).toBe(200);
            expect(responseData).toBeDefined();

            expect(responseData).toHaveProperty("parcel_status");
            expect(responseData.parcel_status).toBe("DELIVERED");
        });

        test("2. Should return '404 Not Found' for non-existent tracking number status", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/parcels/${nonExistentTrackingNumber}/status`;

            const response = await request.get(endpoint, {
                headers: integrationHeaders,
            });

            expect(response.status()).toBe(404);
        });

        test("3. Should return '401 Unauthorized' when API Key is missing", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/parcels/${validTrackingNumber}/status`;

            const response = await request.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            expect(response.status()).toBe(401);
        });
    });
});
