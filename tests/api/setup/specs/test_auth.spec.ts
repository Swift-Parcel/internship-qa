import { test, expect } from "@playwright/test";

test.describe("Auth & Customer API Tests", () => {
    
    test("should register a new customer", async ({ request }) => {
        const response = await request.post("http://localhost:8080/api/customerportal/customer/createCustomer", {
            data: {
                email: `test_${Date.now()}@swiftparcel.com`,
                fullName: "Test User",
                phoneNumber: "123456789",
                password: "Test1234!"
            }
        });

        expect(response.status()).toBe(200);
    });

});