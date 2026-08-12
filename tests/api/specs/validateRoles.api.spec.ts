import { getBearerToken } from "../../../api/helpers/auth";
import { test, expect } from "../setup/setupBackOffice";
import { request as playwrightRequest } from "@playwright/test";
import { createApiClientWithBearerToken } from "../../../api/helpers/apiClient";

type caseCreation = {
    title: string;
    description: string;
    case_type: string;
    case_status: string;
    customer_email: string;
    handler_id: string;
    region_id: string;
    channel: string;
    tag_ids: string[];
    parcel_ids: string[];
    priority: string;
};
type tag = {
    id: number;
    name: string;
};
type caseResponse = {
    id: number;
    case_number: string;
    title: string;
    description: string;
    case_type: string;
    status: string;
    priority: string;
    created_date: string;
    updated_date: string | null;
    is_escalated: boolean;
    resolved_date: string | null;
    sla_deadline: string;
    channel: string;
    resolution: string;
    satisfaction_score: number | null;
    customer_id: number;
    customer_name: string;
    handler_id: number;
    handler_name: string;
    region_id: number;
    region_name: string;
    tags: tag[];
};

let createCase: caseCreation = {
    title: "Test Case VIP assignment",
    description: "This is a test case for vip assignment",
    case_type: "LOST",
    case_status: "OPEN",
    customer_email: "petra.mueller@outlook.com",
    handler_id: "1",
    region_id: "1",
    channel: "EMAIL",
    tag_ids: ["1"],
    parcel_ids: ["1"],
    priority: "LOW",
};

test.describe("testing role permissions for readonly", () => {
    test("testing accessing reports ", async ({ apiBaseUrl }) => {
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
                `${apiBaseUrl}cases`,
            );
            expect(ViewCaseresponse.status()).toBe(403);
            //should be 200

            const CreateCaseresponse = await readonlyApi.post(
                `${apiBaseUrl}cases`,
                {
                    data: createCase,
                },
            );
            expect(CreateCaseresponse.status()).toBe(403);

            const casenumber = "CASE-2026-0001017";
            const EditCaseresponse = await readonlyApi.post(
                `${apiBaseUrl}cases/${casenumber}/change-status`,
                {
                    data: {
                        status: "IN_PROGRESS",
                    },
                },
            );

            expect(EditCaseresponse.status()).toBe(403);
        } finally {
            await requestContext.dispose();
        }
    });
});

test.describe("test role permission for operator", () => {
    test("testing accessing reports ", async ({ apiBaseUrl }) => {
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
                        "OPERATOR_BACKOFFICE_API_USERNAME",
                    ),
                    password: getRequiredEnv(
                        "OPERATOR_BACKOFFICE_API_PASSWORD",
                    ),
                },
                tokenPath: process.env.BACKOFFICE_API_TOKEN_PATH ?? "token",
            });

            const operatorApi = createApiClientWithBearerToken({
                request: requestContext,
                bearerToken,
            });
            const Reportresponse = await operatorApi.get(
                `${apiBaseUrl}reports/sla-breaches`,
            );
            expect(Reportresponse.status()).toBe(403);

            const ViewCaseresponse = await operatorApi.get(
                `${apiBaseUrl}cases`,
            );
            expect(ViewCaseresponse.status()).toBe(200);
            const ViewCaseBodyResponse: caseResponse[] =
                await ViewCaseresponse.json();

            ViewCaseBodyResponse.forEach((element) => {
                expect(element.region_id).toBe(1);
            });

            const CreateCaseresponse = await operatorApi.post(
                `${apiBaseUrl}cases`,
                {
                    data: createCase,
                },
            );
            const responsebody = await CreateCaseresponse.json();
            expect(CreateCaseresponse.status()).toBe(200);

            const casenumber = responsebody.case_number;
            const EditCaseresponse = await operatorApi.put(
                `${apiBaseUrl}cases/${casenumber}/change-status`,
                {
                    data: {
                        status: "IN_PROGRESS",
                    },
                },
            );

            expect(EditCaseresponse.status()).toBe(200);
        } finally {
            await requestContext.dispose();
        }
    });
});

test.describe("test role permission for supervisor", () => {
    test("testing accessing reports ", async ({ apiBaseUrl }) => {
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
                        "SUPERVISOR_BACKOFFICE_API_USERNAME",
                    ),
                    password: getRequiredEnv(
                        "SUPERVISOR_BACKOFFICE_API_PASSWORD",
                    ),
                },
                tokenPath: process.env.BACKOFFICE_API_TOKEN_PATH ?? "token",
            });

            const supervisorApi = createApiClientWithBearerToken({
                request: requestContext,
                bearerToken,
            });
            const Reportresponse = await supervisorApi.get(
                `${apiBaseUrl}reports/sla-breaches`,
            );
            expect(Reportresponse.status()).toBe(200);

            const ViewCaseresponse = await supervisorApi.get(
                `${apiBaseUrl}cases`,
            );
            expect(ViewCaseresponse.status()).toBe(200);
            const ViewCaseBodyResponse: caseResponse[] =
                await ViewCaseresponse.json();

            ViewCaseBodyResponse.forEach((element) => {
                expect(element.region_id).toEqual(expect.any(Number));
            });

            const CreateCaseresponse = await supervisorApi.post(
                `${apiBaseUrl}cases`,
                {
                    data: createCase,
                },
            );
            const responsebody = await CreateCaseresponse.json();
            expect(CreateCaseresponse.status()).toBe(200);

            const casenumber = responsebody.case_number;
            const EditCaseresponse = await supervisorApi.put(
                `${apiBaseUrl}cases/${casenumber}/change-status`,
                {
                    data: {
                        status: "IN_PROGRESS",
                    },
                },
            );

            expect(EditCaseresponse.status()).toBe(200);
        } finally {
            await requestContext.dispose();
        }
    });
});

test.describe("test role permission for admin", () => {
    test("testing accessing reports ", async ({ apiBaseUrl }) => {
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
                    username: getRequiredEnv("BACKOFFICE_API_USERNAME"),
                    password: getRequiredEnv("BACKOFFICE_API_PASSWORD"),
                },
                tokenPath: process.env.BACKOFFICE_API_TOKEN_PATH ?? "token",
            });

            const adminApi = createApiClientWithBearerToken({
                request: requestContext,
                bearerToken,
            });
            const Reportresponse = await adminApi.get(
                `${apiBaseUrl}reports/sla-breaches`,
            );
            expect(Reportresponse.status()).toBe(200);

            const ViewCaseresponse = await adminApi.get(`${apiBaseUrl}cases`);
            expect(ViewCaseresponse.status()).toBe(200);
            const ViewCaseBodyResponse: caseResponse[] =
                await ViewCaseresponse.json();

            ViewCaseBodyResponse.forEach((element) => {
                expect(element.region_id).toEqual(expect.any(Number));
            });

            const CreateCaseresponse = await adminApi.post(
                `${apiBaseUrl}cases`,
                {
                    data: createCase,
                },
            );
            const responsebody = await CreateCaseresponse.json();
            expect(CreateCaseresponse.status()).toBe(200);

            const casenumber = responsebody.case_number;
            const EditCaseresponse = await adminApi.put(
                `${apiBaseUrl}cases/${casenumber}/change-status`,
                {
                    data: {
                        status: "IN_PROGRESS",
                    },
                },
            );

            expect(EditCaseresponse.status()).toBe(200);
        } finally {
            await requestContext.dispose();
        }
    });
});
