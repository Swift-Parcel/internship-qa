import { send } from "node:process";
import { expect, test } from "../setup";

type PickupRequestDetails = {
    preferredPickupDate: string;
    declaredValue: number;
    parcelLength: number;
    parcelWidth: number;
    parcelHeight: number;
    parcelWeight: number;
    preferredTimeSlot: 0 | 1 | 2;
    senderAddress: number;
    recipientAddress: number;
    recipientName: string;
    serviceType: 0 | 1 | 2;
};

function statusCodeCheck(actualStatusCode: number, expectedStatusCode: number) {
    expect
        .soft(actualStatusCode, `Status Code ${expectedStatusCode}`)
        .toBe(expectedStatusCode);
}

let pickupRequestDetails: PickupRequestDetails;

test.beforeEach(async () => {
    pickupRequestDetails = {
        preferredPickupDate: "2026-08-17",
        declaredValue: 4999.0,
        parcelLength: 1,
        parcelWidth: 1,
        parcelHeight: 1,
        parcelWeight: 10.01,
        preferredTimeSlot: 0,
        senderAddress: 16,
        recipientAddress: 16,
        recipientName: "Test Recipient",
        serviceType: 0,
    };
});

test.describe("Pricing tests - positive", {}, () => {
    test.describe.configure({ mode: "serial" });

    test(
        "Price calculation with standard same country service and surcharge",
        { tag: "@smoke" },
        async ({ api, apiBaseUrl }) => {
            pickupRequestDetails.senderAddress = 18;
            pickupRequestDetails.recipientAddress = 17;
            await api.post(`${apiBaseUrl}customer/4/pickup-requests`, {
                data: pickupRequestDetails,
            });

            const response = await api.post(`${apiBaseUrl}pricing/quotes/1`);
            const responseBody = await response.json();
            statusCodeCheck(response.status(), 201);

            expect
                .soft(responseBody.basePrice, "Base price is correct")
                .toBe(5);
            expect
                .soft(responseBody.weightCharge, "Weight charge is correct")
                .toBe(15.02);
            expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(2);
            expect
                .soft(
                    responseBody.zoneAdjustment,
                    "Zone adjustment price is correct",
                )
                .toBe(4.4);
            expect
                .soft(responseBody.totalPrice, "Total price is correct")
                .toBe(26.42);
        },
    );

    test(
        "Price calculation with express cross-country service and surcharge",
        { tag: "@smoke" },
        async ({ api, apiBaseUrl }) => {
            pickupRequestDetails.parcelWeight = 30;
            pickupRequestDetails.parcelLength = 120;
            pickupRequestDetails.parcelWidth = 120;
            pickupRequestDetails.parcelHeight = 120;
            pickupRequestDetails.serviceType = 1;
            pickupRequestDetails.senderAddress = 16;
            pickupRequestDetails.recipientAddress = 18;

            await api.post(`${apiBaseUrl}customer/4/pickup-requests`, {
                data: pickupRequestDetails,
            });

            const response = await api.post(`${apiBaseUrl}pricing/quotes/2`);
            const responseBody = await response.json();
            statusCodeCheck(response.status(), 201);

            expect
                .soft(responseBody.basePrice, "Base price is correct")
                .toBe(12);
            expect
                .soft(responseBody.weightCharge, "Weight charge is correct")
                .toBe(75);
            expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(5);
            expect
                .soft(
                    responseBody.zoneAdjustment,
                    "Zone adjustment price is correct",
                )
                .toBe(73.6);
            expect
                .soft(responseBody.totalPrice, "Total price is correct")
                .toBe(165.6);
        },
    );

    test(
        "Price calculation with same-day same city service and surcharge",
        { tag: "@smoke" },
        async ({ api, apiBaseUrl }) => {
            pickupRequestDetails.serviceType = 2;
            pickupRequestDetails.parcelWeight = 5.01;

            await api.post(`${apiBaseUrl}customer/4/pickup-requests`, {
                data: pickupRequestDetails,
            });

            const response = await api.post(`${apiBaseUrl}pricing/quotes/3`);
            const responseBody = await response.json();
            statusCodeCheck(response.status(), 201);

            expect
                .soft(responseBody.basePrice, "Base price is correct")
                .toBe(25);
            expect
                .soft(responseBody.weightCharge, "Weight charge is correct")
                .toBe(20.04);
            expect
                .soft(responseBody.surcharge, "Surcharge is correct")
                .toBe(10);
            expect
                .soft(
                    responseBody.zoneAdjustment,
                    "Zone adjustment price is correct",
                )
                .toBe(0);
            expect
                .soft(responseBody.totalPrice, "Total price is correct")
                .toBe(55.04);
        },
    );

    test(
        "Price calculation with same-day same country service and no surcharge",
        { tag: "@smoke" },
        async ({ api, apiBaseUrl }) => {
            pickupRequestDetails.serviceType = 2;
            pickupRequestDetails.parcelWeight = 5;
            pickupRequestDetails.senderAddress = 17;
            pickupRequestDetails.recipientAddress = 18;

            await api.post(`${apiBaseUrl}customer/4/pickup-requests`, {
                data: pickupRequestDetails,
            });

            const response = await api.post(`${apiBaseUrl}pricing/quotes/4`);
            const responseBody = await response.json();
            statusCodeCheck(response.status(), 201);

            expect
                .soft(responseBody.basePrice, "Base price is correct")
                .toBe(25);
            expect
                .soft(responseBody.weightCharge, "Weight charge is correct")
                .toBe(20);
            expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(0);
            expect
                .soft(
                    responseBody.zoneAdjustment,
                    "Zone adjustment price is correct",
                )
                .toBe(9);
            expect
                .soft(responseBody.totalPrice, "Total price is correct")
                .toBe(54);
        },
    );

    test("Price calculation with standard cross-country service and no surcharge", async ({
        api,
        apiBaseUrl,
    }) => {
        pickupRequestDetails.parcelWeight = 0.01;
        pickupRequestDetails.senderAddress = 16;
        pickupRequestDetails.recipientAddress = 17;

        await api.post(`${apiBaseUrl}customer/4/pickup-requests`, {
            data: pickupRequestDetails,
        });

        const response = await api.post(`${apiBaseUrl}pricing/quotes/5`);
        const responseBody = await response.json();
        statusCodeCheck(response.status(), 201);

        expect.soft(responseBody.basePrice, "Base price is correct").toBe(5);
        expect
            .soft(responseBody.weightCharge, "Weight charge is correct")
            .toBe(0.02);
        expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(0);
        expect
            .soft(
                responseBody.zoneAdjustment,
                "Zone adjustment price is correct",
            )
            .toBe(4.01);
        expect
            .soft(responseBody.totalPrice, "Total price is correct")
            .toBe(9.03);
    });

    test("Price calculation with express same city service and no surcharge", async ({
        request,
    }) => {
        await request.post(`${process.env.API_BASE_URL}customer`, {
            data: {
                email: "test@swiftparcel.com",
                fullName: "test trial",
                phoneNumber: "323232232",
                password: "lucky689",
            },
        });

        const loginResponse = await request.post(
            `${process.env.API_BASE_URL}auth/login`,
            {
                data: {
                    email: "test@swiftparcel.com",
                    password: "lucky689",
                },
            },
        );
        const loginResponseBody = await loginResponse.json();
        const newCustomerToken = loginResponseBody.access_token;

        pickupRequestDetails.serviceType = 1;
        pickupRequestDetails.parcelWeight = 10;

        await request.post(
            `${process.env.API_BASE_URL}customer/5/pickup-requests`,
            {
                headers: {
                    Authorization: `Bearer ${newCustomerToken}`,
                },
                data: pickupRequestDetails,
            },
        );

        const response = await request.post(
            `${process.env.API_BASE_URL}pricing/quotes/6`,
            {
                headers: {
                    Authorization: `Bearer ${newCustomerToken}`,
                },
            },
        );
        const responseBody = await response.json();
        statusCodeCheck(response.status(), 201);

        expect.soft(responseBody.basePrice, "Base price is correct").toBe(12);
        expect
            .soft(responseBody.weightCharge, "Weight charge is correct")
            .toBe(25);
        expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(0);
        expect
            .soft(
                responseBody.zoneAdjustment,
                "Zone adjustment price is correct",
            )
            .toBe(0);
        expect.soft(responseBody.totalPrice, "Total price is correct").toBe(37);
    });
});

test.describe("Pricing tests - security", { tag: "@security" }, () => {
    test("Price calculation with missing authentication token", async ({
        apiBaseUrl,
        request,
    }) => {
        const response = await request.post(`${apiBaseUrl}pricing`, {
            data: pickupRequestDetails,
        });

        let message: string;
        try {
            const responseBody = await response.json();
            message = responseBody.message;
        } catch (e) {
            message = "";
        }
        statusCodeCheck(response.status(), 401);
        expect
            .soft(message, "Error message for unauthorized user")
            .toBe("Unauthorized user");
    });

    test("Price calculation with invalid authentication token", async ({
        apiBaseUrl,
        request,
    }) => {
        const response = await request.post(`${apiBaseUrl}pricing`, {
            headers: {
                Authorization: "invalid token",
            },
            data: pickupRequestDetails,
        });

        let message: string;
        try {
            const responseBody = await response.json();
            message = responseBody.message;
        } catch (e) {
            message = "";
        }
        statusCodeCheck(response.status(), 401);
        expect
            .soft(message, "Error message for unauthorized user")
            .toBe("Unauthorized user");
    });
});
