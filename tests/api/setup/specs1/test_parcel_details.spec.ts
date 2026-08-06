import { test, expect } from "@playwright/test";

test.describe("Parcel Detail API Tests", () => {
    const baseUrl = process.env.API_BASE_URL;
    const parcelUrl = `${baseUrl}/parcel`;
    const validParcelId = "SP-ABC12345";

    test("Should retrieve full parcel details including sender, recipient, and history", async ({
        request,
    }) => {
        const response = await request.get(`${parcelUrl}/${validParcelId}`);

        expect(response.status()).toBe(200);

        const body = await response.json();
        console.log(
            "FULL PARCEL DETAIL RESPONSE:",
            JSON.stringify(body, null, 2),
        );

        expect(body).toHaveProperty("parcel_status");
        expect(body).toHaveProperty("estimated_delivery_date");

        expect(body, "Response must include sender details").toHaveProperty(
            "sender",
        );
        expect(body, "Response must include recipient details").toHaveProperty(
            "recipient",
        );

        expect(body, "Response must include weight").toHaveProperty("weight");
        expect(body, "Response must include service_type").toHaveProperty(
            "service_type",
        );
        expect(body, "Response must include declared_value").toHaveProperty(
            "declared_value",
        );

        expect(body).toHaveProperty("tracking_history");
        expect(Array.isArray(body.tracking_history)).toBeTruthy();
        expect(body.tracking_history.length).toBeGreaterThan(0);

        const firstHistoryItem = body.tracking_history[0];
        const hasTimestamp =
            "timestamp" in firstHistoryItem || "timeStamp" in firstHistoryItem;

        expect(
            hasTimestamp,
            "History item must contain a timestamp",
        ).toBeTruthy();
        expect(firstHistoryItem).toHaveProperty("description");
    });
});
