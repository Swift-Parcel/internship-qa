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

    test("testing accessing reports with a none admin role", async ({
        api,
        apiBaseUrl,
    }) => {
        const username = process.env.BACKOFFICE_API_USERNAME;
        const password = process.env.BACKOFFICE_API_PASSWORD;
        //access report with a non admin role.
        try {
            process.env.BACKOFFICE_API_USERNAME = "readonly";
            process.env.BACKOFFICE_API_PASSWORD = "ReadOnly123!";

            console.log(
                process.env.BACKOFFICE_API_USERNAME,
                process.env.BACKOFFICE_API_PASSWORD,
            );
            const response = await api.get(`${apiBaseUrl}reports/sla-breaches`);
            const bodyResponse = await response.json();
            expect(response.status()).toBe(403);

            expect(bodyResponse).toMatchObject({
                current_breaches: expect.any(Number),
                historical_breaches: expect.any(Number),
            });
            expect(bodyResponse.message).toBe(
                "Not authorised to access this report",
            );
        } finally {
            // Restore the original environment variables
            process.env.BACKOFFICE_API_USERNAME = username;
            process.env.BACKOFFICE_API_PASSWORD = password;
        }
    });

    test("testing reporting on average resolution time", async ({
        api,
        apiBaseUrl,
    }) => {
        console.log(
            process.env.BACKOFFICE_API_USERNAME,
            process.env.BACKOFFICE_API_PASSWORD,
        );

        const response = await api.get(
            `${apiBaseUrl}reports/average-resolution-time`,
        );
        const bodyResponse = await response.json();
        expect(response.status()).toBe(200);

        bodyResponse.forEach(
            (item: { case_type: string; average_hours: number }) => {
                expect(item).toMatchObject({
                    case_type: expect.any(String),
                    average_hours: expect.any(Number),
                });
            },
        );
    });

    test("testing reporting on handler workload", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}reports/handler-workload`);
        const bodyResponse = await response.json();
        expect(response.status()).toBe(200);

        bodyResponse.forEach(
            (item: {
                handler_id: number;
                handler_name: string;
                active_cases_count: number;
                max_cases: number;
            }) => {
                expect(item).toMatchObject({
                    handler_id: expect.any(Number),
                    handler_name: expect.any(String),
                    active_cases_count: expect.any(Number),
                    max_cases: expect.any(Number),
                });
            },
        );
    });
});
