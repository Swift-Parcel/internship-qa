import { test, expect } from "../setup/setupCustomerPortal";

let customerId = 4;

type PickupRequest = {
    preferredPickupDate: string;
    declaredValue: string | number;
    parcelHeight: number;
    parcelLength: number;
    parcelWidth: number;
    parcelWeight: number;
    preferredTimeSlot: string;
    recipientAddress: number;
    recipientName: string | null;
    senderAddress: number;
    serviceType: string;
};
let validRequest: PickupRequest;

test.beforeEach(async () => {
    validRequest = {
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
});

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
        ).toBe("Pickup Request created");
    });

    test("test  submissions on past dates", async ({ api, apiBaseUrl }) => {
        validRequest.preferredPickupDate = "2026-07-02 ";
        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        expect(response.status()).toBe(400);
        expect(await response.text()).toBe("pickup date must be in the future");
    });

    test("test partial data submitted", async ({ api, apiBaseUrl }) => {
        validRequest.recipientName = null; //invalid declared value 0
        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        const responseBody = await response.json();
        expect(response.status()).toBe(400);
        expect(responseBody.message).toContain(
            "recipientName: Recipient name is required",
        );
    });

    test("test submissions invalid data)", async ({ api, apiBaseUrl }) => {
        validRequest.declaredValue = "five thousand";
        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        const responseBody = await response.json();
        expect(response.status()).toBe(400);
        expect(responseBody.message).toBe("invalid data");
    });

    test("test same-day service restrictions cross-Country", async ({
        api,
        apiBaseUrl,
    }) => {
        validRequest.recipientAddress = 3;
        validRequest.senderAddress = 2;
        validRequest.serviceType = "SAME_DAY";
        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        expect(response.status()).toBe(400);
        expect(await response.text()).toBe(
            "Same-Day service is not available for cross-country routes",
        );
    });

    test("test same-day service restrictions cutoff, should request before 10:00 AM ", async ({
        api,
        apiBaseUrl,
    }) => {
        validRequest.serviceType = "SAME_DAY";
        validRequest.recipientAddress = validRequest.senderAddress = 1;

        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        if (new Date().getHours() < 10) {
            expect(response.status()).toBe(201);
            expect(response.text(), "ordered same day before 10am").toBe(
                "Pickup Request created",
            );
        } else {
            const bodyResponse = await response.json();
            expect(response.status()).toBe(400);
            expect(bodyResponse.message).toBe(
                "Same-Day service must be requested before 10:00 AM on the same day",
            );
        }
    });

    test("test express service timing rules", async ({ api, apiBaseUrl }) => {
        validRequest.serviceType = "EXPRESS";

        const hour = new Date().getHours();
        const today = new Date().toISOString().split("T")[0];

        if (validRequest.preferredPickupDate == today) {
            switch (true) {
                case hour < 10:
                    validRequest.preferredTimeSlot = "AFTERNOON";
                    break;

                case hour >= 10 && hour < 15:
                    validRequest.preferredTimeSlot = "EVENING";
                    break;

                default:
                    const reponse = await api.post(
                        `${apiBaseUrl}customer/${customerId}/pickup-requests`,
                        {
                            data: validRequest,
                        },
                    );
                    expect(
                        reponse.status(),
                        "selected time slot is invalid for express",
                    ).toBe(400);
                    expect(await reponse.text()).toBe(
                        "Express service must be requested at least 2 hours before the time slot starts",
                    );
                    return;
            }
            const reponse = await api.post(
                `${apiBaseUrl}customer/${customerId}/pickup-requests`,
                {
                    data: validRequest,
                },
            );
            expect(
                reponse.status(),
                "selected time slot is valid for express",
            ).toBe(201);
            expect(await reponse.text()).toBe("pickup Request created");
        } else if (validRequest.preferredPickupDate > today) {
            const reponse = await api.post(
                `${apiBaseUrl}customer/${customerId}/pickup-requests`,
                {
                    data: validRequest,
                },
            );
            expect(
                reponse.status(),
                "selected time slot is valid for express on future date",
            ).toBe(201);
            expect(await reponse.text()).toBe("pickup Request created");
        }
    });

    test("test weight constraints", async ({ api, apiBaseUrl }) => {
        validRequest.parcelWeight = 31;

        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.message).toBe(
            "parcelWeight: Maximum parcel weight: 30kg.",
        );
    });

    test("test declared value constraints", async ({ api, apiBaseUrl }) => {
        validRequest.declaredValue = 5001;

        const response = await api.post(
            `${apiBaseUrl}customer/${customerId}/pickup-requests`,
            {
                data: validRequest,
            },
        );
        expect(response.status()).toBe(400);
        const responseBody = await response.json();
        expect(responseBody.message).toBe(
            "declaredValue: Declared value cannot exceed €5,000.",
        );
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
        const responseBody = await response.json();
        expect(responseBody.message).toBe(
            "Customer cannot have more than 5 unconfirmed pickup requests",
        );
    });
});
