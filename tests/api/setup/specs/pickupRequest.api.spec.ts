import { test, expect } from "../setup";

var customerId = 4;
var validRequest = {
    preferredPickupDate: "2026-08-03",
    declaredValue: 5000,
    parcelHeight: 120,
    parcelLength: 120,
    parcelWidth: 120,
    parcelWeight: 30,
    preferredTimeSlot: "EVENING",
    recipientAddress: 2,
    recipientName: "bad wolf",
    senderAddress: 1,
    serviceType: "STANDARD",
};

test.describe("test request pickup suite", () => {
    test("test Pickup Creation, Full Payload With Valid data", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        const apiMessage = await response.text();
        expect(
            (await response).status(),
            "Response should have status 201",
        ).toBe(201);

        expect(
            apiMessage,
            "message when pickup request is created successfully",
        ).toBe("Pickup request created");
    });

    test("test negative submissions (past dates, invalid types & partial data)", async ({
        api,
        apiBaseUrl,
    }) => {
        validRequest.preferredPickupDate = "2026-07-02 "; //past date
        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        expect(response.status()).toBe(400); //bad request
        expect(await response.text()).toBe("pickup date must be in the future");
        //expect to see message about incorrect date
    });

    test("test partial data submitted", async ({ api, apiBaseUrl }) => {
        validRequest.declaredValue = 0; //invalid declared value 0
        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        expect(response.status()).toBe(400);
        //expect to see message about declared value being invalid
    });

    test("test unconfirmed pickup request limit", async ({
        api,
        apiBaseUrl,
    }) => {
        for (let i = 0; i < 5; i++) {
            const response = await api.post(
                `${apiBaseUrl}customer/${customerId}/pickup-requests`,
                {
                    data: validRequest,
                },
            );
            expect(response.status()).toBe(201);
        }
        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        expect(response.status()).toBe(400);
        expect(await response.text()).toBe(
            "Customer cannot have more than 5 unconfirmed pickup requests",
        );
    });

    test("test same-day service restrictions cross-Country", async ({
        api,
        apiBaseUrl,
    }) => {
        validRequest.recipientAddress = 3; //cross-country address
        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        expect(response.status()).toBe(400);
        expect(await response.text()).toBe(
            "Pickup requests for same-day service must be made before 12:00 PM",
        );
    });

    test("test same-day service restrictions cutoff, should request before 10:00 AM ", async ({
        api,
        apiBaseUrl,
    }) => {
        validRequest.serviceType = "SAME_DAY";

        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        if (new Date().getHours() < 10) {
            expect(response.status()).toBe(400);
            expect(response.text(), "ordered same day before 10am").toBe(
                "same day",
            ); //cross-country address
        } else {
            expect(response.status()).toBe(400);
            expect(await response.text()).toBe(
                "Pickup requests for same-day service must be made before 10:00 PM",
            );
        }
    });

    test("test express service timing rules", async ({
        api,
        apiBaseUrl,
    }) => {});

    test("test physical and value constraints", async ({
        api,
        apiBaseUrl,
    }) => {});
});
