import { test, expect } from "@playwright/test";

test.describe("Customer Registration & Authentication API Tests", () => {
    test.describe.configure({ mode: "serial" }); //we need that one for the tests to run in order, otherwise it is failing.

    const baseUrl = process.env.API_BASE_URL;

    const registerUrl = `${baseUrl}/customer`;
    const loginUrl = `${baseUrl}/auth/login`;
    const demoUrl = `${baseUrl}/demo`;
    const refreshUrl = `${baseUrl}/auth/refresh`;
    const logoutUrl = `${baseUrl}/auth/logout`;

    const uniqueEmail = `test_qa_${Date.now()}@swiftparcel.com`;
    const userPassword = "Test1234!";

    let accessToken: string;
    let refreshToken: string;

    test("1. Should create a new customer account successfully", async ({
        request,
    }) => {
        const response = await request.post(registerUrl, {
            data: {
                email: uniqueEmail,
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: userPassword,
            },
        });

        expect(response.status(), "Expected status code to be 200").toBe(200);

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

    test("2. Should login successfully with created user and receive JWT tokens", async ({
        request,
    }) => {
        const response = await request.post(loginUrl, {
            data: {
                email: uniqueEmail,
                password: userPassword,
            },
        });

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
        refreshToken = body.refresh_token;
    });

    test("3. Should access protected endpoint using Bearer Access Token", async ({
        request,
    }) => {
        const response = await request.post(demoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        expect(response.status()).toBe(200);
    });

    test("4. Should refresh access token and perform token rotation", async ({
        request,
    }) => {
        const response = await request.post(refreshUrl, {
            data: {
                refresh_token: refreshToken,
            },
        });

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

        expect(body.refresh_token).not.toBe(refreshToken);

        const oldRefreshToken = refreshToken;
        accessToken = body.access_token;
        refreshToken = body.refresh_token;

        const reuseResponse = await request.post(refreshUrl, {
            data: {
                refresh_token: oldRefreshToken,
            },
        });

        expect(
            reuseResponse.status(),
            "Expected status code 401 for reused refresh token",
        ).toBe(401);
    });

    test("5. Should logout successfully (204 No Content)", async ({
        request,
    }) => {
        const response1 = await request.post(logoutUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            data: {
                refresh_token: refreshToken,
            },
        });

        expect(response1.status()).toBe(204);
    });

    test("6. Should reject request using Access Token after logout", async ({
        request,
    }) => {
        const response = await request.post(demoUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        expect(
            response.status(),
            "Token should be invalidated after logout.",
        ).toBe(401);
    });
});
test.describe("Login Negative Test Scenarios", () => {
    const baseUrl = process.env.API_BASE_URL;
    const loginUrl = `${baseUrl}/auth/login`;

    const uniqueEmail = `test_qa_${Date.now()}@swiftparcel.com`;
    test("7. Should fail to login with wrong password.", async ({
        request,
    }) => {
        const response = await request.post(loginUrl, {
            data: {
                email: uniqueEmail,
                password: "WrongPassword123!",
            },
        });

        expect(response.status(), "Wrong password should return 401.").toBe(
            401,
        );
    });

    test("8. Should fail to login with non-existent email.", async ({
        request,
    }) => {
        const response = await request.post(loginUrl, {
            data: {
                email: "random@example.com",
                password: "Test1234!",
            },
        });

        expect(response.status(), "Non-existent email should return 401.").toBe(
            401,
        );
    });
});

test.describe("Customer Registration Negative Test Scenarios", () => {
    const baseUrl = process.env.API_BASE_URL;
    const registerUrl = `${baseUrl}/customer`;

    test.describe("Email Property Validations", () => {
        test("1.1 - Should fail when email is already registered", async ({
            request,
        }) => {
            const existingEmail = `dup_qa_${Date.now()}@swiftparcel.com`;
            const payload = {
                email: existingEmail,
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: "Test1234!",
            };

            const firstReg = await request.post(registerUrl, { data: payload });
            expect(
                firstReg.status(),
                "Precondition failed: First user registration",
            ).toBe(200);

            const duplicateReg = await request.post(registerUrl, {
                data: payload,
            });
            expect(
                duplicateReg.status(),
                "Duplicate email should return 409 Conflict",
            ).toBe(409);
        });

        test("1.2 - Should fail when email format is invalid", async ({
            request,
        }) => {
            const payload = {
                email: "invalid-email-format",
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Invalid email format should return 400 Bad Request",
            ).toBe(400);
        });

        test("1.3 - Should fail when email is missing", async ({ request }) => {
            const payload = {
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Missing email should return 400 Bad Request",
            ).toBe(400);
        });

        test("1.4 - Should fail when email is empty string", async ({
            request,
        }) => {
            const payload = {
                email: "",
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Empty email string should return 400 Bad Request",
            ).toBe(400);
        });

        test("1.5 - Should fail when email exceeds max length", async ({
            request,
        }) => {
            const longEmail = `${"a".repeat(250)}@swiftparcel.com`;
            const payload = {
                email: longEmail,
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Too long email should return 400 Bad Request",
            ).toBe(400);
        });

        test("1.6 - Should fail when email has invalid data (number)", async ({
            request,
        }) => {
            const payload = {
                email: 123456,
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Invalid email data type should return 400 Bad Request",
            ).toBe(400);
        });
    });

    test.describe("FullName Property Validations", () => {
        test("2.1 - Should fail when fullName is missing", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Missing fullName should return 400 Bad Request",
            ).toBe(400);
        });

        test("2.2 - Should fail when fullName is empty string", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "",
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Empty fullName string should return 400 Bad Request",
            ).toBe(400);
        });

        test("2.3 - Should fail when fullName is too short", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "A",
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Too short fullName should return 400 Bad Request",
            ).toBe(400);
        });

        test("2.4 - Should fail when fullName is too long ", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "A".repeat(256),
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Too long fullName should return 400 Bad Request",
            ).toBe(400);
        });

        test("2.5 - Should fail when fullName contains invalid characters or HTML injection", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "<script>alert('xss')</script>",
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Invalid fullName characters should return 400 Bad Request",
            ).toBe(400);
        });

        test("2.6 - Should fail when fullName has invalid type ", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: { firstName: "QA", lastName: "User" },
                phoneNumber: "123456789",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Invalid fullName data type should return 400 Bad Request",
            ).toBe(400);
        });
    });

    test.describe("PhoneNumber Property Validations", () => {
        test("3.1 - Should fail when phoneNumber is empty string", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "QA Test User",
                phoneNumber: "",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Empty phoneNumber string should return 400 Bad Request",
            ).toBe(400);
        });
        test("3.2 - Should fail when phoneNumber is too short ", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "QA Test User",
                phoneNumber: "1",
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Invalid phoneNumber length should return 400 Bad Request",
            ).toBe(400);
        });
        test("3.3 - Should fail when phoneNumber is too long", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "QA Test User",
                phoneNumber: "123456789012".repeat(256),
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Invalid phoneNumber length should return 400 Bad Request",
            ).toBe(400);
        });

        test("3.4 - Should fail when phoneNumber has invalid type (boolean)", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "QA Test User",
                phoneNumber: true,
                password: "Test1234!",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Invalid phoneNumber data type should return 400 Bad Request",
            ).toBe(400);
        });
    });
    test.describe("Password Property Validations", () => {
        test("4.1 - Should fail when password is missing", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "QA Test User",
                phoneNumber: "123456789",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Missing password should return 400 Bad Request",
            ).toBe(400);
        });

        test("4.2 - Should fail when password does not meet complexity requirements (too short)", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: "12",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Short password should return 400 Bad Request",
            ).toBe(400);
        });

        test("4.3 - Should fail when password is empty string", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: "",
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Empty password string should return 400 Bad Request",
            ).toBe(400);
        });

        test("4.4 - Should fail when password has invalid type (Array)", async ({
            request,
        }) => {
            const payload = {
                email: `test_qa_${Date.now()}@swiftparcel.com`,
                fullName: "QA Test User",
                phoneNumber: "123456789",
                password: ["Test1234!"],
            };
            const response = await request.post(registerUrl, { data: payload });
            expect(
                response.status(),
                "Invalid password data type should return 400 Bad Request",
            ).toBe(400);
        });
    });
});
