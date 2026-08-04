import { register } from "node:module";
import { expect, test } from "../setup";

test.describe("Pricing tests - smoke", { tag: "@smoke" }, () => {
    test("Price calculation with standard same country service and surcharge", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
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
                    city: "Szeged",
                    postalCode: "6700",
                    countryCode: "HU",
                },
            },
        });

        const responseBody = await response.json();

        expect.soft(response.status(), "Status code 200").toBe(200);

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
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 1,
                weight: 30,
                length: 120,
                width: 120,
                height: 120,
                sender_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
                recipient_address: {
                    city: "Bratislava",
                    postalCode: "82100",
                    countryCode: "SK",
                },
            },
        });

        const responseBody = await response.json();

        expect.soft(response.status(), "Status code 200").toBe(200);

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
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 2,
                weight: 5.01,
                length: 120,
                width: 1,
                height: 120,
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

        expect.soft(response.status(), "Status code 200").toBe(200);

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
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 2,
                weight: 5,
                length: 120,
                width: 120,
                height: 1,
                sender_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
                recipient_address: {
                    city: "Szeged",
                    postalCode: "6700",
                    countryCode: "HU",
                },
            },
        });

        const responseBody = await response.json();

        expect.soft(response.status(), "Status code 200").toBe(200);

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
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 0,
                weight: 0.01,
                length: 1,
                width: 120,
                height: 120,
                sender_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
                recipient_address: {
                    city: "Bratislava",
                    postalCode: "82100",
                    countryCode: "SK",
                },
            },
        });

        const responseBody = await response.json();

        expect.soft(response.status(), "Status code 200").toBe(200);

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
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 1,
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

        expect.soft(response.status(), "Status code 200").toBe(200);

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
        expect.soft(response.status(), "Status code 400").toBe(400);
        expect
            .soft(
                responseBody.message,
                "Error message about incorrect data type",
            )
            .toBe("weight: Has to be a number");
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
        expect.soft(response.status(), "Status code 400").toBe(400);
        expect
            .soft(responseBody.message, "Error message is correct")
            .toBe("service_type: Service type is required");
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
        expect.soft(response.status(), "Status code 400").toBe(400);
        expect
            .soft(responseBody.message, "Error message contains weight")
            .toContain("weight: must not be null");
        expect
            .soft(responseBody.message, "Error message contains length")
            .toContain("length: Minimum single dimension: 1cm");
        expect
            .soft(responseBody.message, "Error message contains width")
            .toContain("width: Minimum single dimension: 1cm");
        expect
            .soft(responseBody.message, "Error message contains height")
            .toContain("height: Minimum single dimension: 1cm");
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
        expect.soft(response.status(), "Status code 400").toBe(400);
        expect
            .soft(responseBody.message, "Error message contains sender_address")
            .toContain("sender_address: Sender address is required");
        expect
            .soft(
                responseBody.message,
                "Error message contains recipient_address",
            )
            .toContain("recipient_address: Recipient address is required");
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
        expect.soft(response.status(), "Status code 400").toBe(400);
        expect
            .soft(
                responseBody.message,
                "Error message contains sender_address properties",
            )
            .toContain(
                "sender_address: Sender address properties are required",
            );
        expect
            .soft(
                responseBody.message,
                "Error message contains recipient_address properties",
            )
            .toContain(
                "recipient_address: Recipient address properties are required",
            );
    });

    test("Price calculation with values below minimum", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 2,
                weight: -2,
                length: 0.99,
                width: 0.99,
                height: 0.99,
                sender_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
                recipient_address: {
                    city: "Szeged",
                    postalCode: "6700",
                    countryCode: "HU",
                },
            },
        });

        const responseBody = await response.json();
        expect.soft(response.status(), "Status code 422").toBe(422);
        expect
            .soft(responseBody.message, "Error message contains weight")
            .toContain("weight: Weight must be greater than zero");
        expect
            .soft(responseBody.message, "Error message contains length")
            .toContain("length: Minimum single dimension: 1cm");
        expect
            .soft(responseBody.message, "Error message contains width")
            .toContain("width: Minimum single dimension: 1cm");
        expect
            .soft(responseBody.message, "Error message contains height")
            .toContain("height: Minimum single dimension: 1cm");
    });

    test("Price calculation with values above maximum", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 2,
                weight: 30.01,
                length: 121,
                width: 121,
                height: 121,
                sender_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
                recipient_address: {
                    city: "Szeged",
                    postalCode: "6700",
                    countryCode: "HU",
                },
            },
        });

        const responseBody = await response.json();
        expect.soft(response.status(), "Status code 422").toBe(422);
        expect
            .soft(responseBody.message, "Error message contains weight")
            .toContain("weight: Maximum parcel weight: 30kg");
        expect
            .soft(responseBody.message, "Error message contains length")
            .toContain("length: Maximum single dimension: 120cm");
        expect
            .soft(responseBody.message, "Error message contains width")
            .toContain("width: Maximum single dimension: 120cm");
        expect
            .soft(responseBody.message, "Error message contains height")
            .toContain("height: Maximum single dimension: 120cm");
    });

    test("Price calculation with with same day cross-country service", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 2,
                weight: 30,
                length: 120,
                width: 120,
                height: 120,
                sender_address: {
                    city: "Budapest",
                    postalCode: "1111",
                    countryCode: "HU",
                },
                recipient_address: {
                    city: "Bratislava",
                    postalCode: "82100",
                    countryCode: "SK",
                },
            },
        });

        const responseBody = await response.json();
        expect.soft(response.status(), "Status code 422").toBe(422);
        expect
            .soft(responseBody.message, "Error message about limitation")
            .toContain("Same day cross-country service is not possible");
    });
});

test.describe("Pricing tests - security", () => {
    test("Price calculation with unauthenticated user", async ({
        apiBaseUrl,
        request,
    }) => {
        const response = await request.post(`${apiBaseUrl}pricing`, {
            data: {
                service_type: 2,
                weight: 5.01,
                length: 120,
                width: 1,
                height: 120,
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
        expect.soft(response.status(), "Status code 401").toBe(401);
        expect
            .soft(responseBody.message, "Error message for unauthorized user")
            .toBe("Unauthorized user");
    });
});
