import { test, expect } from "../setup/setup";

test.describe("test profile retrieval", () => {
    test("gets user profile response json structure", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/3`);
        const body = await response.json();

        expect(body).toMatchObject({
            id: expect.any(Number),
            email: expect.any(String),
            full_name: expect.any(String),
            phone_number: expect.any(String),
        });
        //if the address and language is not provided, the default will be null.
        if (body.default_address !== null) {
            expect(body.default_address).toMatchObject({
                id: expect.any(Number),
                city: expect.any(String),
                postal_code: expect.any(String),
                country_code: expect.any(String),
                street: expect.any(String),
                street_number: expect.any(String),
            });
        } else if (body.preferred_language !== null) {
            expect(typeof body.preferred_language).toBe("string");
        } else {
            expect(body.default_address).toBeNull();
            expect(body.preferred_language).toBeNull();
        }

        expect(response.status()).toBe(200);
    });

    test("test retrieval with incorrect customerID", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/1587`);

        expect(response.status()).toBe(404);
    });
    test("test retrieval with special character", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/*`);

        const bodyResponse = await response.json();
        expect(response.status()).toBe(400);
        expect(bodyResponse.message).toBe("Invalid customer ID");
    });

    test("test retrieval with empty customer ID", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/`);
        const bodyResponse = await response.json();
        expect(response.status()).toBe(400);
        expect(bodyResponse.message).toBe("Invalid customer ID");
    });

    test("test retrieval of profile without authentication", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/4`, {
            headers: {
                Authorization: "",
            },
        });
        expect(response.status()).toBe(401);
    });
});

test.describe("test profile update", () => {
    test("updated an existing profile", async ({ api, apiBaseUrl }) => {
        const updateData = { full_name: "ron turyatemba tron" };

        const response = await api.patch(`${apiBaseUrl}customer/4`, {
            data: updateData,
        });
        const data = await response.json();

        expect(response.status()).toBe(200);
        expect(data.full_name).toBe(updateData.full_name);
    });

    test("update profile with a number type instead of string", async ({
        api,
        apiBaseUrl,
    }) => {
        const invalidData = { email: "12344" };
        const response = await api.patch(`${apiBaseUrl}customer/4`, {
            data: invalidData,
        });
        const bodyResponse = await response.json();
        expect(response.status()).toBe(400);
        expect(bodyResponse.message).toBe("Invalid data provided");
    });
});
