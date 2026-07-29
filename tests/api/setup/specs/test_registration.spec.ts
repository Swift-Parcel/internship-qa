/* It will include:
Successful registration with valid data and login the user.
Registration with existing email.
Registration with invalid email format.
Registration with without email.
Registration with without Password.


*/
import { test, expect } from "@playwright/test";

test.describe("Customer Registration API Tests with Every Scenario", () => {
    const registerUrl =
        "http://localhost:8080/api/customerportal/customer/createCustomer";
    const loginUrl = "http://localhost:8080/api/customerportal/auth/login";

    //1.Succesful registration with valid data and login the user.
    test("1. Should create a new customer account succesfully and login", async ({
        request,
    }) => {
        const uniqueEmail = `test_qa_${Date.now()}@swiftparcel.com`;
        const customerData = {
            email: uniqueEmail,
            fullName: "QA Test User",
            phoneNumber: "123456789",
            password: "Test1234!",
        };

        //Register the user
        const registerResponse = await request.post(registerUrl, {
            data: customerData,
        });
        expect(
            [200, 201].includes(registerResponse.status()),
            "Expected status code to be 200 or 201",
        ).toBeTruthy();

        const loginResponse = await request.post(loginUrl, {
            data: {
                email: uniqueEmail,
                password: customerData.password,
            },
        });

        expect(loginResponse.status()).toBe(200);
    });
});
