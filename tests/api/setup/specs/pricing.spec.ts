import { expect, test } from "../setup";
import { APIRequest, APIRequestContext, APIResponse } from "@playwright/test";

type PickupRequestDetails = {
    preferredPickupDate: string;
    declaredValue: number;
    parcelLength: number;
    parcelWidth: number;
    parcelHeight: number;
    parcelWeight: number;
    preferredTimeSlot: 0 | 1 | 2;
    senderAddress: {
        city: string;
        street: string;
        postal_code: string;
        country_code: string;
        street_number: string;
    };
    recipientAddress: {
        city: string;
        street: string;
        postal_code: string;
        country_code: string;
        street_number: string;
    };
    recipientName: string;
    serviceType: 0 | 1 | 2;
};

function statusCodeCheck(actualStatusCode: number, expectedStatusCode: number) {
    expect
        .soft(actualStatusCode, `Status Code ${expectedStatusCode}`)
        .toBe(expectedStatusCode);
}

let accessTokenOne: string;
let accessTokenTwo: string;

test.beforeAll(async ({ request }) => {
    await request.post(`${process.env.API_BASE_URL}customer`, {
        data: {
            email: `pricing${process.env.API_USERNAME}`,
            fullName: "test trial",
            phoneNumber: "323232232",
            password: process.env.API_PASSWORD,
        },
    });

    const loginResponse = await request.post(
        `${process.env.API_BASE_URL}auth/login`,
        {
            data: {
                email: `pricing${process.env.API_USERNAME}`,
                password: process.env.API_PASSWORD,
            },
        },
    );
    const loginResponseBody = await loginResponse.json();
    accessTokenOne = `Bearer ${loginResponseBody.access_token}`;

    await request.post(`${process.env.API_BASE_URL}customer`, {
        data: {
            email: `pricing2${process.env.API_USERNAME}`,
            fullName: "test trial",
            phoneNumber: "323232232",
            password: process.env.API_PASSWORD,
        },
    });

    const login2Response = await request.post(
        `${process.env.API_BASE_URL}auth/login`,
        {
            data: {
                email: `pricing2${process.env.API_USERNAME}`,
                password: process.env.API_PASSWORD,
            },
        },
    );

    const login2ResponseBody = await login2Response.json();
    accessTokenTwo = login2ResponseBody.access_token;
});

async function returnCustomerId(
    email: string,
    request: APIRequestContext,
    token: string,
): Promise<number> {
    let id = 0;
    for (let i = 4; i < 20; i++) {
        const profileResponse = await request.get(
            `${process.env.API_BASE_URL}customer/${i}`,
            {
                headers: { Authorization: token },
            },
        );
        const profileResponseBody = await profileResponse.json();
        if (profileResponse.status() === 200) {
            if (profileResponseBody.email === email) {
                id = profileResponseBody.id;
                return id;
            }
        }
    }
    return id;
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
        senderAddress: {
            city: "Budapest",
            street: "A utca",
            postal_code: "1111",
            country_code: "HU",
            street_number: "3",
        },
        recipientAddress: {
            city: "Budapest",
            street: "C utca",
            postal_code: "1111",
            country_code: "HU",
            street_number: "5",
        },
        recipientName: "Test Recipient",
        serviceType: 0,
    };
});

test.describe("Pricing tests - positive", {}, () => {
    test.describe.configure({ mode: "serial" });

    test(
        "Price calculation with standard same country service and surcharge",
        { tag: "@smoke" },
        async ({ request }) => {
            const customerId = await returnCustomerId(
                `pricing${process.env.API_USERNAME}`,
                request,
                accessTokenOne,
            );

            ((pickupRequestDetails.senderAddress = {
                city: "Budapest",
                street: "A utca",
                postal_code: "1111",
                country_code: "HU",
                street_number: "3",
            }),
                (pickupRequestDetails.recipientAddress = {
                    city: "Szeged",
                    street: "B utca",
                    postal_code: "6700",
                    country_code: "HU",
                    street_number: "34",
                }),
                await request.post(
                    `${process.env.API_BASE_URL}customer/${customerId}/pickup-requests`,
                    {
                        headers: { Authorization: accessTokenOne },
                        data: pickupRequestDetails,
                    },
                ));

            const response = await request.post(
                `${process.env.API_BASE_URL}pricing/quotes/4`,
                { headers: { Authorization: accessTokenOne } },
            );
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
        async ({ request }) => {
            const customerId = await returnCustomerId(
                `pricing${process.env.API_USERNAME}`,
                request,
                accessTokenOne,
            );

            pickupRequestDetails.parcelWeight = 30;
            pickupRequestDetails.parcelLength = 120;
            pickupRequestDetails.parcelWidth = 120;
            pickupRequestDetails.parcelHeight = 120;
            pickupRequestDetails.serviceType = 1;
            ((pickupRequestDetails.senderAddress = {
                city: "Bratislava",
                street: "D ulica",
                postal_code: "82100",
                country_code: "SK",
                street_number: "1",
            }),
                (pickupRequestDetails.recipientAddress = {
                    city: "Szeged",
                    street: "B utca",
                    postal_code: "6700",
                    country_code: "HU",
                    street_number: "34",
                }),
                await request.post(
                    `${process.env.API_BASE_URL}customer/${customerId}/pickup-requests`,
                    {
                        headers: { Authorization: accessTokenOne },
                        data: pickupRequestDetails,
                    },
                ));

            const response = await request.post(
                `${process.env.API_BASE_URL}pricing/quotes/5`,
                { headers: { Authorization: accessTokenOne } },
            );
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
        async ({ request }) => {
            const customerId = await returnCustomerId(
                `pricing${process.env.API_USERNAME}`,
                request,
                accessTokenOne,
            );

            pickupRequestDetails.serviceType = 2;
            pickupRequestDetails.parcelWeight = 5.01;

            await request.post(
                `${process.env.API_BASE_URL}customer/${customerId}/pickup-requests`,
                {
                    headers: { Authorization: accessTokenOne },
                    data: pickupRequestDetails,
                },
            );

            const response = await request.post(
                `${process.env.API_BASE_URL}pricing/quotes/6`,
                { headers: { Authorization: accessTokenOne } },
            );
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
        async ({ request }) => {
            const customerId = await returnCustomerId(
                `pricing${process.env.API_USERNAME}`,
                request,
                accessTokenOne,
            );

            pickupRequestDetails.serviceType = 2;
            pickupRequestDetails.parcelWeight = 5;
            ((pickupRequestDetails.senderAddress = {
                city: "Szeged",
                street: "B utca",
                postal_code: "6700",
                country_code: "HU",
                street_number: "34",
            }),
                (pickupRequestDetails.recipientAddress = {
                    city: "Budapest",
                    street: "A utca",
                    postal_code: "1111",
                    country_code: "HU",
                    street_number: "3",
                }),
                await request.post(
                    `${process.env.API_BASE_URL}customer/${customerId}/pickup-requests`,
                    {
                        headers: { Authorization: accessTokenOne },
                        data: pickupRequestDetails,
                    },
                ));

            const response = await request.post(
                `${process.env.API_BASE_URL}pricing/quotes/7`,
                { headers: { Authorization: accessTokenOne } },
            );
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
        request,
    }) => {
        const customerId = await returnCustomerId(
            `pricing${process.env.API_USERNAME}`,
            request,
            accessTokenOne,
        );

        pickupRequestDetails.parcelWeight = 0.01;
        ((pickupRequestDetails.senderAddress = {
            city: "Szeged",
            street: "B utca",
            postal_code: "6700",
            country_code: "HU",
            street_number: "34",
        }),
            (pickupRequestDetails.recipientAddress = {
                city: "Bratislava",
                street: "D ulica",
                postal_code: "82100",
                country_code: "SK",
                street_number: "1",
            }),
            await request.post(
                `${process.env.API_BASE_URL}customer/${customerId}/pickup-requests`,
                {
                    headers: { Authorization: accessTokenOne },
                    data: pickupRequestDetails,
                },
            ));

        const response = await request.post(
            `${process.env.API_BASE_URL}pricing/quotes/8`,
            { headers: { Authorization: accessTokenOne } },
        );
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
        const customerId = await returnCustomerId(
            `pricing2${process.env.API_USERNAME}`,
            request,
            accessTokenOne,
        );
        pickupRequestDetails.serviceType = 1;
        pickupRequestDetails.parcelWeight = 10;

        await request.post(
            `${process.env.API_BASE_URL}customer/${customerId}/pickup-requests`,
            {
                headers: {
                    Authorization: `Bearer ${accessTokenTwo}`,
                },
                data: pickupRequestDetails,
            },
        );

        const response = await request.post(
            `${process.env.API_BASE_URL}pricing/quotes/9`,
            {
                headers: {
                    Authorization: `Bearer ${accessTokenTwo}`,
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
        request,
    }) => {
        const response = await request.post(
            `${process.env.API_BASE_URL}pricing/quotes/4`,
            {
                data: pickupRequestDetails,
            },
        );

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
            .toBe(
                "Authentication failed: Full authentication is required to access this resource",
            );
    });

    test("Price calculation with invalid authentication token", async ({
        request,
    }) => {
        const response = await request.post(
            `${process.env.API_BASE_URL}pricing/quotes/4`,
            {
                headers: {
                    Authorization: "invalid token",
                },
                data: pickupRequestDetails,
            },
        );

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
            .toBe(
                "Authentication failed: Full authentication is required to access this resource",
            );
    });
});
