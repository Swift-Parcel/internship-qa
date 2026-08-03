import { test, expect } from "@playwright/test";

test.describe("Customer Notification Preferences Tests", () => {
    const baseUrl = process.env.API_BASE_URL;

    let accessToken: string;
    const customerId = 123;

    test.beforeAll(async ({ request }) => {
        const loginResponse = await request.post(`${baseUrl}/auth/login`, {
            data: {
                email: "test22@test.com",
                password: "Test123",
            },
        });
        if (loginResponse.status() === 200) {
            const body = await loginResponse.json();
            accessToken = body.access_token;
        } else {
            throw new Error(
                `Login failed with status: ${loginResponse.status()}`,
            );
        }
    });
    //positive
    test("Should update notification preferences successfully", async ({
        request,
    }) => {
        const preferenceUrl = `${baseUrl}/customer/${customerId}/notification-preference`;

        const payload = {
            parcel_status_updates: true,
            delivery_status: true,
            case_status: true,
            delivery_change: true,
            pickup_confirmed: true,
            quote_expiring: true,
        };

        const response = await request.patch(preferenceUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            data: payload,
        });
        expect(response.status(), "Expected status code 200").toBe(200);
    });

    test("It should fail with 403 when Authorization header is missing", async ({
        request,
    }) => {
        const preferenceUrl = `${baseUrl}/customer/${customerId}/notification-preference`;

        const payload = {
            parcel_status_updates: true,
            delivery_status: true,
            case_status: true,
            delivery_change: true,
            pickup_confirmed: true,
            quote_expiring: true,
        };
        const response = await request.patch(preferenceUrl, {
            headers: {
                "Content-Type": "application/json",
            },
            data: payload,
        });
        console.log("Response status:", response.status());
        expect(response.status(), "Expected status code 403").toBe(403);
    });

    test("Should fail with 400 Bad Request when payload contains invalid data types", async ({
        request,
    }) => {
        const preferenceUrl = `${baseUrl}/customer/${customerId}/notification-preference`;

        const invalidPayload = {
            parcel_status: "INVALID_BOOLEAN_STRING",
            delivery_status: 99999,
            case_status: false,
            delivery_change: [true, false],
            pickup_confirmed: -1,
            quote_expiring: true,
        };

        const response = await request.patch(preferenceUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            data: invalidPayload,
        });

        expect(
            response.status(),
            "Expected status code 400 for invalid data types",
        ).toBe(400);
    });
    test("Should fail with 404 Not Found when customer ID does not exist", async ({
        request,
    }) => {
        const nonExistentCustomerId = 999999;
        const preferenceUrl = `${baseUrl}/customer/${nonExistentCustomerId}/notification-preference`;

        const payload = {
            parcel_status_updates: true,
            delivery_status: true,
            case_status: true,
            delivery_change: true,
            pickup_confirmed: true,
            quote_expiring: true,
        };

        const response = await request.patch(preferenceUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            data: payload,
        });

        expect(
            response.status(),
            "Expected status code 404 for non-existent customer ID",
        ).toBe(404);
    });
    test("Should fail with 400 Bad Request when customer ID format is invalid", async ({
        request,
    }) => {
        const invalidCustomerId = "abc";
        const preferenceUrl = `${baseUrl}/customer/${invalidCustomerId}/notification-preference`;

        const payload = {
            parcel_status_updates: true,
            delivery_status: true,
            case_status: true,
            delivery_change: true,
            pickup_confirmed: true,
            quote_expiring: true,
        };

        const response = await request.patch(preferenceUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            data: payload,
        });

        expect(
            response.status(),
            "Expected status code 400 for invalid customer ID format",
        ).toBe(400);
    });

    test("Should fail with 401 Unauthorized when Bearer token is invalid or expired", async ({
        request,
    }) => {
        const preferenceUrl = `${baseUrl}/customer/${customerId}/notification-preference`;

        const payload = {
            parcel_status_updates: true,
            delivery_status: true,
            case_status: true,
            delivery_change: true,
            pickup_confirmed: true,
            quote_expiring: true,
        };

        const response = await request.patch(preferenceUrl, {
            headers: {
                Authorization: "Bearer invalid_or_expired_token_12345",
                "Content-Type": "application/json",
            },
            data: payload,
        });

        expect(
            response.status(),
            "Expected status code 401 for invalid/expired token",
        ).toBe(401);
    });

    test("Should fail with 403 Forbidden when attempting to update another customer's preference", async ({
        request,
    }) => {
        const anotherCustomerId = customerId + 1;
        const preferenceUrl = `${baseUrl}/customer/${anotherCustomerId}/notification-preference`;

        const payload = {
            parcel_status_updates: true,
            delivery_status: true,
            case_status: true,
            delivery_change: true,
            pickup_confirmed: true,
            quote_expiring: true,
        };

        const response = await request.patch(preferenceUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            data: payload,
        });

        expect(
            response.status(),
            "Expected status code 403 for cross-customer access attempt",
        ).toBe(403);
    });
});
