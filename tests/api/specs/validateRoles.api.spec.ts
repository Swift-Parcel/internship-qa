import { get } from "node:http";
import { getBearerToken } from "../../../api/helpers/auth";
import { test, expect } from "../setup/setupBackOffice";
import { request as playwrightRequest } from "@playwright/test";
import { createApiClientWithBearerToken } from "../../../api/helpers/apiClient";

test.describe("testing role permissions for readonly", () => {
    //readonly should only view cases
    //cannot create a case
    //cannot edit case
    //cannot view reports
    test("testing accessing reports ", async ({ apiBaseUrl }) => {
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
            const Reportresponse = await readonlyApi.get(
                `${apiBaseUrl}reports/sla-breaches`,
            );
            expect(Reportresponse.status()).toBe(403);

            const ViewCaseresponse = await readonlyApi.get(
                `${apiBaseUrl}reports/sla-breaches`,
            );

            expect(ViewCaseresponse.status()).toBe(200);

            const EditCaseresponse = await readonlyApi.put(
                `${apiBaseUrl}reports/sla-breaches`,
            );

            expect(EditCaseresponse.status()).toBe(400);
        } finally {
            await requestContext.dispose();
        }
    });
});

test.describe("test role permission for operator", () => {
    //operator should only view cases from the region 1
    //can create a case
    //can edit case only in region 1
    //can view all reports
});

test.describe("test role permission for supervisor", () => {
    //should  view cases from all regions
    //can create a case
    //can edit case in any region
    //can view all reports
});

test.describe("test role permission for admin", () => {
    //should  view cases from all regions
    //can create a case
    //can edit case in any region
    //can view all reports
});

//operator should only view reports from the region 1
