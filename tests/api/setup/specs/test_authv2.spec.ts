/*This test includes the following scenarios:
1. Successful registration with valid data and login the user.
2. Login test with existing email and valid password.
3.Protected endpoint test.
4. Token refresh test.
5. Logout test.
*/

import { test, expect } from "@playwright/test";

test.describe("Customer Registration & Authentication API Tests", () => {
    test.describe.configure({ mode: "serial" }); //we need that one for the tests to run in order, otherwise it is failing.

    const uniqueEmail = `test_qa_${Date.now()}@swiftparcel.com`; // It will add the number miliseconds to the email to make it unique for each test run.
    const userPassword = "Test1234!";

    //State management
    let accessToken: string;
    let refreshToken: string;

    //Registration test, here we need to change post path
    test("1. Should create a new customer account successfully", async ({
        request,
    }) => {
        const response = await request.post(
            "http://localhost:8080/api/customerportal/customer/createCustomer",
            {
                data: {
                    email: uniqueEmail,
                    fullName: "QA Test User",
                    phoneNumber: "123456789",
                    password: userPassword, // Use the same password for login test
                },
            },
        );

        expect(
            [200, 201].includes(response.status()),
            "Expected status code to be 200 or 201",
        ).toBeTruthy();

        const body = await response.json();
        expect(
            body,
            "Expected response body to have ID property",
        ).toHaveProperty("id");
        expect(body.email, "Returned email does not match").toBe(uniqueEmail);
        expect(body.fullName, "Returned full name does not match").toBe(
            "QA Test User",
        );

        expect(
            body,
            "Security bug,Password field is exposed",
        ).not.toHaveProperty("password");
    });
    //login test
    test("2. Should login successfully with created user and receive JWT tokens", async ({
        request,
    }) => {
        const response = await request.post(
            "http://localhost:8080/api/customerportal/auth/login",
            {
                data: {
                    email: uniqueEmail,
                    password: userPassword,
                },
            },
        );

        expect(response.status()).toBe(200);
        const body = await response.json();

        expect(
            body,
            "Expected response body to have access_token property",
        ).toHaveProperty("access_token");
        expect(
            body,
            "Expected response body to have refresh_token property",
        ).toHaveProperty("refresh_token");
        expect(body.token_type, "Returned token type does not match").toBe(
            "Bearer",
        );
        expect(body.expires_in, "Returned expiration time does not match").toBe(
            900,
        );

        accessToken = body.access_token;
        refreshToken = body.refresh_token; //It is storing the refresh token and access token for the next test to use it.
    });

    //protected endpoint test
    test("3. Should access protected endpoint using Bearer Access Token", async ({
        request,
    }) => {
        const response = await request.post(
            "http://localhost:8080/api/customerportal/demo",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        );

        expect(response.status()).toBe(200);
    });

    //token refresh test
    test("4. Should refresh access token and perform token rotation", async ({
        request,
    }) => {
        const response = await request.post(
            "http://localhost:8080/api/customerportal/auth/refresh",
            {
                data: {
                    refresh_token: refreshToken,
                    // Use the stored refresh token to get a new access token
                },
            },
        );

        expect(response.status(), "Expected status code 200").toBe(200);
        const body = await response.json();

        expect(
            body.access_token,
            "new access token is not defined",
        ).toBeDefined();
        expect(
            body.refresh_token,
            "new refresh token is not defined",
        ).toBeDefined();

        expect(body.refresh_token).not.toBe(refreshToken); //To be sure it is not same as the previous one.

        const oldRefreshToken = refreshToken;
        accessToken = body.access_token;
        refreshToken = body.refresh_token;

        const reuseResponse = await request.post(
            "http://localhost:8080/api/customerportal/auth/refresh",
            {
                data: {
                    refresh_token: oldRefreshToken,
                },
            },
        );

        expect([401, 403]).toContain(reuseResponse.status());
    });

    test("5. Should logout successfully (204 No Content & Idempotent)", async ({
        request,
    }) => {
        const response1 = await request.post(
            "http://localhost:8080/api/customerportal/auth/logout",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
                data: {
                    refresh_token: refreshToken,
                },
            },
        );

        expect(response1.status()).toBe(204);
    });
});
