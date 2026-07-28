import { test, expect } from "../setup";

/* already done in the test object used from setup that extends playwrights test
test.beforeAll('get token',async()=>{
    const token = getBearerToken();
})
*/

/*
//if there is a URL path where can retrieve users
test("get users", async({api, apiBaseUrl}) =>{
    const response = await api.get('${apiBaseUrl}/users')
    expect(response.ok()).toBeTruthy()
    console.log(response)
})*/

//test retrieval of profile
test.describe("test profile retrieval", () => {
    test("gets user profile using bearer token auth", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/3`);
        const body = await response.json();

        expect(typeof body.ful);
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);
        expect(typeof body.full_name).toBe("string");
        expect(body.full_name.length).toBeGreaterThan(0); //name should not be null
        expect(body.email.length).toBeGreaterThan(0);
    });
    /*
    test('update profile', async({api, apiBaseUrl})=>{
        const response = await api.patch('${apiBaseUrl/customer/3')

    })*/

    test("test retrieval with incorrect customerID", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/1587`);

        expect(response.status()).toBe(404); //not found
    });
    test("test retrieval with empty customer ID or special character", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/*`);

        expect(response.status()).toBe(403); //forbiden should be bad request
    });

    test("test retrieval of profile without authentication", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}customer/3`, {
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

        const response = await api.patch(`${apiBaseUrl}customer/3`, {
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
        const response = await api.patch(`${apiBaseUrl}customer/3`, {
            data: invalidData,
        });
        expect(response.status()).toBe(403); //should reduce bad request
    });
});
