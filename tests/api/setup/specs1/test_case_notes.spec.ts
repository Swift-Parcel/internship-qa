import { test, expect } from "../setup";

test.describe("C# Back-Office - GET Case Notes Real Data Test", () => {
    const existingCaseNumber = "CASE-2024-001";
    const secretKey =
        process.env.INTEGRATION_SECRET_KEY ||
        "SwiftParcel_Java_Integration_Shared_Secret_2026!";

    // Fallback base URL ensuring the API endpoint is never undefined
    const baseUrl =
        process.env.BACKOFFICE_BASE_URL || "http://localhost:3500/api";

    test("GET - Should fetch real case notes for CASE-2024-001", async ({
        backofficeApi,
    }) => {
        // Construct full target URL
        const endpoint = `${baseUrl}/cases/${existingCaseNumber}/notes`;

        // Send GET request with X-Api-Key header
        const response = await backofficeApi.get(endpoint, {
            headers: {
                "X-Api-Key": secretKey,
            },
        });

        // Log response status for verification
        console.log("Response Status Code:", response.status());

        // Assert HTTP status is 200 OK
        expect(response.status()).toBe(200);

        // Parse JSON response body
        const notesList = await response.json();
        console.log("Fetched Notes:", JSON.stringify(notesList, null, 2));

        // Assert response payload structure
        expect(Array.isArray(notesList)).toBeTruthy();
        expect(notesList.length).toBeGreaterThanOrEqual(1);
    });
});
