import { test, expect } from "../setup";

test.describe("test profile retrieval", () => {
    test("gets user profile response json structure", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/4`);
        const body = await response.json();

        expect(body).toMatchObject({
            id: expect.any(Number),
            email: expect.any(String),
            full_name: expect.any(String),
            phone_number: expect.any(String),
            preferred_language: expect.any(String),
            default_address: {
                id: expect.any(Number),
                city: expect.any(String),
                postal_code: expect.any(String),
                country_code: expect.any(String),
                street: expect.anything(),
                street_number: expect.anything(),
            },
        });
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

        expect(response.status()).toBe(400); //forbiden should be bad request
    });

    test("test retrieval with empty customer ID", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/`);

        expect(response.status()).toBe(400); //forbiden should be bad request
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
        expect(response.status()).toBe(403);
    });
});

test.describe("test profile update", () => {
    test("updated an existing profile", async ({ api, apiBaseUrl }) => {
        const updateData = { full_name: "ron turyatemba tron" };

        const response = await api.patch(`${apiBaseUrl}customer/4`, {
            data: updateData,
        });
        const data = await response.json();

        expect(response.status()).toBe(200); //successful response
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
        expect(response.status()).toBe(400); //should return bad request
        expect(await response.text()).toBe("invalid data");
    });

    test("update profile with an empty body", async ({ api, apiBaseUrl }) => {
        const response = await api.patch(`${apiBaseUrl}customer/4`, {
            data: {},
        });
        expect(response.status()).toBe(400); //should return bad request
        expect(await response.text()).toBe("empty data");
    });

    test("update deleted or missing profile", async ({ api, apiBaseUrl }) => {
        const updateData = { full_name: "ron turyatemba tron" };
        const response = await api.patch(`${apiBaseUrl}customer/6004`, {
            data: updateData,
        });
        expect(response.status()).toBe(404); //should return customer not found
        expect(await response.text()).toBe("customer not found ");
    });
});
