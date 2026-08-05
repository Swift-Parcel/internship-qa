import { register } from "node:module";
import { expect, test } from "../setup";
import { APIResponse } from "@playwright/test";

type PriceCalcDetails = {
    service_type: number;
    weight: number;
    length: number;
    width: number;
    height: number;
    sender_address: {
        city: string;
        postalCode: string;
        countryCode: string;
    };
    recipient_address: {
        city: string;
        postalCode: string;
        countryCode: string;
    };
};

function statusCodeCheck(actualStatusCode: number, expectedStatusCode: number) {
    expect
        .soft(actualStatusCode, `Status Code ${expectedStatusCode}`)
        .toBe(expectedStatusCode);
}

function errorExpectsEqual(
    expectTitle: string,
    expectedErrorMessage: string,
    actualErrorMessage: string,
) {
    expect.soft(actualErrorMessage, expectTitle).toBe(expectedErrorMessage);
}

function errorExpectsContain(
    expectTitle: string,
    expectedErrorMessage: string,
    actualErrorMessage: string,
) {
    expect
        .soft(actualErrorMessage, expectTitle)
        .toContain(expectedErrorMessage);
}

let calcDetails: PriceCalcDetails;
test.beforeEach(async () => {
    calcDetails = {
        service_type: 0,
        weight: 10.01,
        length: 1,
        width: 1,
        height: 1,
        sender_address: {
            city: "Budapest",
            postalCode: "1111",
            countryCode: "HU",
        },
        recipient_address: {
            city: "Budapest",
            postalCode: "1111",
            countryCode: "HU",
        },
    };
});

test.describe("Pricing tests - smoke", { tag: "@smoke" }, () => {
    test("Price calculation with standard same country service and surcharge", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.recipient_address = {
            city: "Szeged",
            postalCode: "6700",
            countryCode: "HU",
        };
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();

        statusCodeCheck(response.status(), 200);

        expect.soft(responseBody.base_price, "Base price is correct").toBe(5);
        expect
            .soft(responseBody.weight_charge, "Weight charge is correct")
            .toBe(15.02);
        expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(2);
        expect
            .soft(
                responseBody.zone_adjustment,
                "Zone adjustment price is correct",
            )
            .toBe(4.4);
        expect
            .soft(responseBody.total_price, "Total price is correct")
            .toBe(26.42);
    });

    test("Price calculation with express cross-country service and surcharge", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.weight = 30;
        calcDetails.length = 120;
        calcDetails.width = 120;
        calcDetails.height = 120;
        calcDetails.service_type = 1;
        calcDetails.recipient_address = {
            city: "Bratislava",
            postalCode: "82100",
            countryCode: "SK",
        };

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();

        statusCodeCheck(response.status(), 200);

        expect.soft(responseBody.base_price, "Base price is correct").toBe(12);
        expect
            .soft(responseBody.weight_charge, "Weight charge is correct")
            .toBe(75);
        expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(5);
        expect
            .soft(
                responseBody.zone_adjustment,
                "Zone adjustment price is correct",
            )
            .toBe(73.6);
        expect
            .soft(responseBody.total_price, "Total price is correct")
            .toBe(165.6);
    });

    test("Price calculation with same-day same city service and surcharge", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.service_type = 2;
        calcDetails.weight = 5.01;

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();

        statusCodeCheck(response.status(), 200);

        expect.soft(responseBody.base_price, "Base price is correct").toBe(25);
        expect
            .soft(responseBody.weight_charge, "Weight charge is correct")
            .toBe(20.04);
        expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(10);
        expect
            .soft(
                responseBody.zone_adjustment,
                "Zone adjustment price is correct",
            )
            .toBe(0);
        expect
            .soft(responseBody.total_price, "Total price is correct")
            .toBe(55.04);
    });

    test("Price calculation with same-day same country service and no surcharge", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.service_type = 2;
        calcDetails.weight = 5;
        calcDetails.recipient_address = {
            city: "Szeged",
            postalCode: "6700",
            countryCode: "HU",
        };

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();

        statusCodeCheck(response.status(), 200);

        expect.soft(responseBody.base_price, "Base price is correct").toBe(25);
        expect
            .soft(responseBody.weight_charge, "Weight charge is correct")
            .toBe(20);
        expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(0);
        expect
            .soft(
                responseBody.zone_adjustment,
                "Zone adjustment price is correct",
            )
            .toBe(9);
        expect
            .soft(responseBody.total_price, "Total price is correct")
            .toBe(54);
    });
});

test.describe("Pricing tests - positive", () => {
    test("Price calculation with standard cross-country service and no surcharge", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.weight = 0.01;
        calcDetails.recipient_address = {
            city: "Bratislava",
            postalCode: "82100",
            countryCode: "SK",
        };

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();

        statusCodeCheck(response.status(), 200);

        expect.soft(responseBody.base_price, "Base price is correct").toBe(5);
        expect
            .soft(responseBody.weight_charge, "Weight charge is correct")
            .toBe(0.02);
        expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(0);
        expect
            .soft(
                responseBody.zone_adjustment,
                "Zone adjustment price is correct",
            )
            .toBe(4.01);
        expect
            .soft(responseBody.total_price, "Total price is correct")
            .toBe(9.03);
    });

    test("Price calculation with express same city service and no surcharge", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.service_type = 1;
        calcDetails.weight = 10;

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();

        statusCodeCheck(response.status(), 200);

        expect.soft(responseBody.base_price, "Base price is correct").toBe(12);
        expect
            .soft(responseBody.weight_charge, "Weight charge is correct")
            .toBe(25);
        expect.soft(responseBody.surcharge, "Surcharge is correct").toBe(0);
        expect
            .soft(
                responseBody.zone_adjustment,
                "Zone adjustment price is correct",
            )
            .toBe(0);
        expect
            .soft(responseBody.total_price, "Total price is correct")
            .toBe(37);
    });
});

test.describe("Pricing tests - negative", () => {
    test("Price calculation with incorrect data type", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 1,
                weight: "two",
                length: 1,
                width: 120,
                height: 1,
                sender_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
                recipient_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
            },
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 400);
        errorExpectsEqual(
            "Error message about incorrect data type",
            "weight: Has to be a number",
            responseBody.message,
        );
    });

    test("Price calculation with missing ServiceType", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                weight: 10,
                length: 1,
                width: 120,
                height: 1,
                sender_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
                recipient_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
            },
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 400);
        errorExpectsEqual(
            "Error message is correct",
            "service_type: Service type is required",
            responseBody.message,
        );
    });

    test("Price calculation with missing weight and dimensions", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 0,
                sender_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
                recipient_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
            },
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 400);
        errorExpectsContain(
            "Error message contains weight",
            "weight: must not be null",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains length",
            "length: Minimum single dimension: 1cm",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains width",
            "width: Minimum single dimension: 1cm",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains height",
            "height: Minimum single dimension: 1cm",
            responseBody.message,
        );
    });

    test("Price calculation with missing Address", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 0,
                weight: 10,
                length: 1,
                width: 120,
                height: 1,
            },
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 400);
        errorExpectsContain(
            "Error message contains sender_address",
            "sender_address: Sender address is required",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains recipient_address",
            "recipient_address: Recipient address is required",
            responseBody.message,
        );
    });

    test("Price calculation with missing Address property values", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 0,
                weight: 10,
                length: 1,
                width: 120,
                height: 1,
                sender_address: {},
                recipient_address: {},
            },
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 400);
        errorExpectsContain(
            "Error message contains sender_address properties",
            "sender_address: Sender address properties are required",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains recipient_address properties",
            "recipient_address: Recipient address properties are required",
            responseBody.message,
        );
    });

    test("Price calculation with values below minimum", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.weight = 0;
        calcDetails.length = 0;
        calcDetails.width = 0;
        calcDetails.height = 0;

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 422);
        errorExpectsContain(
            "Error message contains weight",
            "weight: Weight must be greater than zero",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains length",
            "length: Minimum single dimension: 1cm",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains width",
            "width: Minimum single dimension: 1cm",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains height",
            "height: Minimum single dimension: 1cm",
            responseBody.message,
        );
    });

    test("Price calculation with values above maximum", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.weight = 30.01;
        calcDetails.length = 121;
        calcDetails.width = 121;
        calcDetails.height = 121;

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 422);
        errorExpectsContain(
            "Error message contains weight",
            "weight: Maximum parcel weight: 30kg",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains length",
            "length: Maximum single dimension: 120cm",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains width",
            "width: Maximum single dimension: 120cm",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains height",
            "height: Maximum single dimension: 120cm",
            responseBody.message,
        );
    });

    test("Price calculation with ServiceType outside [0,2] range", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.service_type = -1;

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 400);
        errorExpectsEqual(
            "Error message is correct",
            "service_type: Service type doesn't exist",
            responseBody.message,
        );
    });

    test("Price calculation with with same day cross-country service", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.service_type = 2;
        calcDetails.recipient_address = {
            city: "Bratislava",
            postalCode: "82100",
            countryCode: "SK",
        };

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 422);
        errorExpectsContain(
            "Error message about limitation",
            "Same day cross-country service is not possible",
            responseBody.message,
        );
    });

    test("Price calculation with Address property values being empty strings", async ({
        api,
        apiBaseUrl,
    }) => {
        calcDetails.sender_address = {
            city: "",
            postalCode: "",
            countryCode: "",
        };
        calcDetails.recipient_address = {
            city: "",
            postalCode: "",
            countryCode: "",
        };

        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        const responseBody = await response.json();
        statusCodeCheck(response.status(), 400);
        errorExpectsContain(
            "Error message contains sender_address properties",
            "sender_address: Sender address properties are required",
            responseBody.message,
        );
        errorExpectsContain(
            "Error message contains recipient_address properties",
            "recipient_address: Recipient address properties are required",
            responseBody.message,
        );
    });
});

test.describe("Pricing tests - security", () => {
    test("Price calculation with unauthenticated user", async ({
        apiBaseUrl,
        request,
    }) => {
        const response = await request.post(`${apiBaseUrl}pricing`, {
            data: calcDetails,
        });

        let message: string;
        try {
            const responseBody = await response.json();
            message = responseBody.message;
        } catch (e) {
            message = "";
        }
        statusCodeCheck(response.status(), 401);
        errorExpectsEqual(
            "Error message for unauthorized user",
            "Unauthorized user",
            message,
        );
    });
});
