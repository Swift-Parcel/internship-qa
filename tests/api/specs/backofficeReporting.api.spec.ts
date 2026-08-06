import { test, expect } from "../setup/setupBackOffice";

test.describe("test backoffice reporting suite", () => {
    test("testing cases by count", async ({ api, apiBaseUrl }) => {
        const response = await api.get(`${apiBaseUrl}reports/cases-by-type`);
        const bodyResponse = await response.json();
        expect(response.status()).toBe(200);

        bodyResponse.forEach((item: { case_type: string; count: number }) => {
            expect(item).toMatchObject({
                case_type: expect.any(String),
                count: expect.any(Number),
            });
        });
    });

    test("testing reporting on sla breaches", async ({ api, apiBaseUrl }) => {
        const response = await api.get(`${apiBaseUrl}reports/sla-breaches`);
        const bodyResponse = await response.json();
        expect(response.status()).toBe(200);

        expect(bodyResponse).toMatchObject({
            current_breaches: expect.any(Number),
            historical_breaches: expect.any(Number),
        });
    });
});
