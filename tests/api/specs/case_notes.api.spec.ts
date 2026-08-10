import { test, expect } from "../setup/setupBackOffice";

test.describe(" Back Office Case Notes Validation", () => {
    const validCaseNumber = "CASE-2024-004";
    const nonExistentCaseNumber = "CASE-9999-999";
    const invalidFormatCaseNumber = "INVALID_CASE_FORMAT_!@#$";

    const authUrl = process.env.BACKOFFICE_API_AUTH_URL!;
    const username = process.env.BACKOFFICE_API_USERNAME!;
    const password = process.env.BACKOFFICE_API_PASSWORD!;
    const tokenPath = process.env.BACKOFFICE_API_TOKEN_PATH!;
    const backofficeBaseUrl = process.env.BACKOFFICE_API_BASE_URL!;
    const integrationSecretKey = process.env.INTEGRATION_SECRET_KEY!;

    let authToken = "";
    let integrationHeaders: Record<string, string> = {};

    test.beforeAll(async ({ request }) => {
        const loginPayload = {
            username: username,
            password: password,
        };

        try {
            const loginResponse = await request.post(authUrl, {
                data: loginPayload,
            });

            if (loginResponse.ok()) {
                const body = await loginResponse.json();
                authToken = body[tokenPath];
            }
        } catch (error) {
            console.error(
                "Authentication error. Exception during authentication request:",
                error,
            );
        }

        integrationHeaders = {
            "X-Api-Key": integrationSecretKey,
            Authorization: authToken,
        }; //we need that ones for access
    });

    test.describe("GET /api/integration/cases/{caseNumber}/notes", () => {
        test("1. Should successfully retrieve case notes for a valid case number (200 OK)", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/cases/${validCaseNumber}/notes`;
            const response = await request.get(endpoint, {
                headers: integrationHeaders,
            });

            const responseData = await response.json().catch(() => null);

            console.log("Response Status:", response.status());
            console.log(
                "Response Body:",
                JSON.stringify(responseData, null, 2),
            );

            expect(response.status()).toBe(200);
            expect(Array.isArray(responseData)).toBe(true);

            expect(response.headers()["content-type"]).toContain(
                "application/json",
            );

            responseData.forEach((noteItem: any) => {
                expect(noteItem).toHaveProperty("timestamp");
                expect(noteItem).toHaveProperty("note");
                expect(noteItem).toHaveProperty("handler_id");
                expect(noteItem).toHaveProperty("handler_name");
                expect(noteItem).toHaveProperty("customer_id");
                expect(noteItem).toHaveProperty("customer_name");
                expect(noteItem).toHaveProperty("attachment");
            });
        });

        test("2. Should return 404 Not Found for a non-existent case number", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/cases/${nonExistentCaseNumber}/notes`;
            const response = await request.get(endpoint, {
                headers: integrationHeaders,
            });

            expect(response.status()).toBe(404);
        });

        test("3. Should return 404 Not Found with an error message for invalid case number format", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/cases/${invalidFormatCaseNumber}/notes`;

            const response = await request.get(endpoint, {
                headers: integrationHeaders,
            });

            const responseData = await response.json().catch(() => null);

            console.log("\nResponse Status:", response.status());

            expect(response.status(), "Invalid case number format").toBe(404);
        });

        test("4. Should return 401 Unauthorized when authentication headers are missing", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/cases/${validCaseNumber}/notes`;
            const response = await request.get(endpoint);

            expect(response.status()).toBe(401);
        });

        test("5. Should return 401 Unauthorized when API Key is invalid", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/cases/${validCaseNumber}/notes`;
            const invalidHeaders = {
                "X-API-KEY": "INVALID_SECRET_KEY_12345",
            };

            const response = await request.get(endpoint, {
                headers: invalidHeaders,
            });

            expect(response.status()).toBe(401);
        });
    });
    test.describe("POST /api/integration/cases/{caseNumber}/notes", () => {
        test("1. Should successfully add a new note using exact payload schema (200/201 OK)", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/cases/${validCaseNumber}/notes`;

            const notePayload = {
                message: "Customer confirmed they received the damaged parcel.",
                is_internal: false,
                attachment: "test",
            };

            const response = await request.post(endpoint, {
                headers: integrationHeaders,
                data: notePayload,
            });

            const responseData = await response.json().catch(() => null);

            console.log("Response Status:", response.status());
            console.log(
                "Response Body:",
                JSON.stringify(responseData, null, 2),
            );

            expect(response.status()).toBe(200);
        });

        test("2. Should return 400 Bad Request when note payload is empty", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/cases/${validCaseNumber}/notes`;
            const invalidPayload = {};

            const response = await request.post(endpoint, {
                headers: integrationHeaders,
                data: invalidPayload,
            });

            expect(response.status()).toBe(400);
        });

        test("3. Should return 400 Bad Request when adding a note to a non-existent case", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/cases/${nonExistentCaseNumber}/notes`;
            const notePayload = {
                message: "Testing note for a missing case.",
                is_internal: true,
                attachment: "",
            };

            const response = await request.post(endpoint, {
                headers: integrationHeaders,
                data: notePayload,
            });

            expect(response.status()).toBe(400);
        });

        test("4. Should return 401 Unauthorized when adding a note without API Key", async ({
            request,
        }) => {
            const endpoint = `${backofficeBaseUrl}integration/cases/${validCaseNumber}/notes`;
            const notePayload = {
                message: "Unauthorized note attempt.",
                is_internal: false,
                attachment: "",
            };

            const response = await request.post(endpoint, {
                data: notePayload,
            });

            expect(response.status()).toBe(401);
        });
    });
});
