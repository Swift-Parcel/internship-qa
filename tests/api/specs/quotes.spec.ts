import { expect, test } from "../setup/setupCustomerPortal";
import { APIRequestContext } from "@playwright/test";

function statusCodeCheck(actualStatusCode: number, expectedStatusCode: number) {
    expect
        .soft(actualStatusCode, `Status Code ${expectedStatusCode}`)
        .toBe(expectedStatusCode);
}

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

let accessToken: string;

test.beforeAll(async ({ request }) => {
    await request.post(`${process.env.API_BASE_URL}customer`, {
        data: {
            email: `quotes${process.env.API_USERNAME}`,
            fullName: "test trial",
            phoneNumber: "323232232",
            password: process.env.API_PASSWORD,
        },
    });

    const loginResponse = await request.post(
        `${process.env.API_BASE_URL}auth/login`,
        {
            data: {
                email: `pricing2${process.env.API_USERNAME}`,
                password: process.env.API_PASSWORD,
            },
        },
    );
    const loginResponseBody = await loginResponse.json();
    accessToken = `Bearer ${loginResponseBody.access_token}`;
});

let pickupRequestId = 10;

test.describe("Quote tests - positive", () => {
    test.describe.configure({ mode: "serial" });
    let today: Date;
    let tomorrow: Date;

    test(
        "Quote generation from own pickup request",
        { tag: "@smoke" },
        async ({ request }) => {
            const customerId = await returnCustomerId(
                `pricing2${process.env.API_USERNAME}`,
                request,
                accessToken,
            );
            await request.post(
                `${process.env.API_BASE_URL}customer/${customerId}/pickup-requests`,
                {
                    headers: { Authorization: accessToken },
                    data: {
                        preferredPickupDate: "2026-08-17",
                        declaredValue: 300,
                        parcelLength: 1,
                        parcelWidth: 120,
                        parcelHeight: 60,
                        parcelWeight: 10,
                        preferredTimeSlot: 0,
                        senderAddress: {
                            city: "Budapest",
                            street: "Zs utca",
                            postal_code: "1111",
                            country_code: "HU",
                            street_number: "83",
                        },
                        recipientAddress: {
                            city: "Budapest",
                            street: "F utca",
                            postal_code: "1111",
                            country_code: "HU",
                            street_number: "9",
                        },
                        recipientName: "Test Recipient",
                        serviceType: 1,
                    },
                },
            );

            today = new Date();
            tomorrow = new Date(new Date().setDate(today.getDate() + 1));

            const response = await request.post(
                `${process.env.API_BASE_URL}pricing/quotes/${pickupRequestId}`,
                {
                    headers: { Authorization: accessToken },
                },
            );

            const responseBody = await response.json();

            statusCodeCheck(response.status(), 201);
            expect
                .soft(
                    responseBody.pickupRequestId,
                    "Pickup request ID is retained",
                )
                .toBe(pickupRequestId);
            expect
                .soft(responseBody.basePrice, "Base price is correct")
                .toBe(12);
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
            expect
                .soft(responseBody.totalPrice, "Total price is correct")
                .toBe(37);
            expect
                .soft(responseBody.quoteRouteType, "Route type is correct")
                .toBe("SAME_CITY");

            expect
                .soft(
                    responseBody.quotedAt.split(".")[0],
                    "Quote generation time is correct",
                )
                .toBe(today.toISOString().split(".")[0]);
            expect
                .soft(
                    responseBody.quoteExpiresAt.split(".")[0],
                    "Quote expiration time is correct",
                )
                .toBe(tomorrow.toISOString().split(".")[0]);
        },
    );

    test(
        "Quote details retrieval from own quotes",
        { tag: "@smoke" },
        async ({ request }) => {
            const response = await request.get(
                `${process.env.API_BASE_URL}pricing/quotes`,
                {
                    headers: {
                        Authorization: accessToken,
                    },
                },
            );
            const responseBody = await response.json();
            statusCodeCheck(response.status(), 200);
            expect
                .soft(
                    responseBody[0].pickupRequestId,
                    "Pickup request ID is retained",
                )
                .toBe(pickupRequestId);
            expect
                .soft(responseBody[0].basePrice, "Base price is correct")
                .toBe(12);
            expect
                .soft(responseBody[0].weightCharge, "Weight charge is correct")
                .toBe(25);
            expect
                .soft(responseBody[0].surcharge, "Surcharge is correct")
                .toBe(0);
            expect
                .soft(
                    responseBody[0].zoneAdjustment,
                    "Zone adjustment price is correct",
                )
                .toBe(0);
            expect
                .soft(responseBody[0].totalPrice, "Total price is correct")
                .toBe(37);
            expect
                .soft(responseBody[0].quoteRouteType, "Route type is correct")
                .toBe("SAME_CITY");
        },
    );

    test("Quote expiration date 24 hours after creation", async ({
        request,
    }) => {
        const response = await request.get(
            `${process.env.API_BASE_URL}pricing/quotes`,
            {
                headers: {
                    Authorization: accessToken,
                },
            },
        );
        const responseBody = await response.json();

        expect
            .soft(
                new Date(responseBody[0].quoteExpiresAt).getTime(),
                "Quote expiration time 24 hours after generation",
            )
            .toBe(
                new Date(responseBody[0].quotedAt).getTime() +
                    24 * 60 * 60 * 1000,
            );
    });
});

test.describe("Quote tests - security", { tag: "@security" }, () => {
    test("Quote generation from other user's pickup request", async ({
        request,
    }) => {
        const loginResponse = await request.post(
            `${process.env.API_BASE_URL}auth/login`,
            {
                data: {
                    email: "anna.kovacs@example.com",
                    password: "Test1234!",
                },
            },
        );
        const loginResponseBody = await loginResponse.json();
        const anna_accessToken = `Bearer ${loginResponseBody.access_token}`;

        const response = await request.post(
            `${process.env.API_BASE_URL}pricing/quotes/${pickupRequestId}`,
            {
                headers: { Authorization: anna_accessToken },
            },
        );

        let message: string;
        try {
            const responseBody = await response.json();
            message = responseBody.message;
        } catch (e) {
            message = "";
        }
        statusCodeCheck(response.status(), 403);
        expect
            .soft(message, "Error message for unauthorized user")
            .toBe(
                "Access denied: Pickup request does not belong to the customer",
            );
    });

    test("Quote retrieval with missing authentication token", async ({
        request,
    }) => {
        const response = await request.get(
            `${process.env.API_BASE_URL}pricing/quotes`,
            {
                headers: {
                    Authorization: "invalid token",
                },
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

    test("Quote retrieval with invalid authentication token", async ({
        request,
    }) => {
        const response = await request.get(
            `${process.env.API_BASE_URL}pricing/quotes`,
            {
                headers: {
                    Authorization: "invalid token",
                },
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
