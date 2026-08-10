import { get } from "node:http";
import { getBearerToken } from "../../../api/helpers/auth";
import { test, expect } from "../setup/setupBackOffice";
import { request as playwrightRequest } from "@playwright/test";
import { createApiClientWithBearerToken } from "../../../api/helpers/apiClient";

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
        apiBaseUrl,
    }) => {
        //create new api request with different username token
        const requestContext = await playwrightRequest.newContext();

        try {
            function getRequiredEnv(name: string): string {
                const value = process.env[name];

                if (!value) {
                    throw new Error(
                        `Missing required environment variable: ${name}. Configure it in .env.`,
                    );
                }

                return value;
            }
            const bearerToken = await getBearerToken(requestContext, {
                authUrl: getRequiredEnv("BACKOFFICE_API_AUTH_URL"),
                credentials: {
                    username: getRequiredEnv(
                        "READONLY_BACKOFFICE_API_USERNAME",
                    ),
                    password: getRequiredEnv(
                        "READONLY_BACKOFFICE_API_PASSWORD",
                    ),
                },
                tokenPath: process.env.BACKOFFICE_API_TOKEN_PATH ?? "token",
            });

            const readonlyApi = createApiClientWithBearerToken({
                request: requestContext,
                bearerToken,
            });
            const response = await readonlyApi.get(
                `${apiBaseUrl}reports/sla-breaches`,
            );
            const bodyResponse = await response.json();

            expect(response.status()).toBe(403);

            expect(bodyResponse.message).toBe(
                "User does not have permission to perform this action.",
            );
        } finally {
            await requestContext.dispose();
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
