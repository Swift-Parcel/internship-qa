import { array } from "node:stream/iter";
import { test, expect } from "../setup/setupBackOffice";

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

let validRequest: caseCreation;

test.beforeEach(async () => {
    validRequest = {
        title: "Test Case",
        description: "This is a test case",
        case_type: "DAMAGED",
        case_status: "OPEN",
        customer_email: "customer1@example.com",
        handler_id: "1",
        region_id: "1",
        channel: "EMAIL",
        tag_ids: ["1"],
        parcel_ids: ["1"],
        priority: "LOW",
    };
});

test.describe("test backoffice case management suite", () => {
    test("testing retrieving case management api", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}cases`);
        const bodyResponse: caseResponse[] = await response.json();
        expect(response.status()).toBe(200);
        expect(Array.isArray(bodyResponse)).toBe(true);

        bodyResponse.forEach((element) => {
            expect(element).toMatchObject({
                id: expect.any(Number),
                case_number: expect.any(String),
                title: expect.any(String),
                description: expect.any(String),
                case_type: expect.any(String),
                status: expect.any(String),
                priority: expect.any(String),
                created_date: expect.any(String),
                //updated_date: expect.any(String),
                is_escalated: expect.any(Boolean),
                //resolved_date: expect.any(String),
                sla_deadline: expect.any(String),
                channel: expect.any(String),
                //resolution: expect.anything,
                customer_id: expect.any(Number),
                customer_name: expect.any(String),
                handler_id: expect.any(Number),
                handler_name: expect.any(String),
                region_id: expect.any(Number),
                region_name: expect.any(String),
                tags: expect.any(Array),
            });
            expect(
                element.resolution === null ||
                    typeof element.resolution === "string",
            ).toBe(true);

            expect(
                element.resolved_date === null ||
                    typeof element.resolved_date === "string",
            ).toBe(true);

            expect(
                element.updated_date === null ||
                    typeof element.updated_date === "string",
            ).toBe(true);

            expect(
                element.satisfaction_score === null ||
                    typeof element.satisfaction_score === "number",
            ).toBe(true);
        });
    });

    test("testing retrieving case for operator see only region assigned to", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}cases`);
        const bodyResponse = await response.json();
        expect(response.status()).toBe(200);
        //expect the reponse to have a list of cases with the operator region only
    });

    test.describe("test backoffice case creation suite", () => {
        test("case creation with valid data ", async ({ api, apiBaseUrl }) => {
            const response = await api.post(`${apiBaseUrl}cases`, {
                data: validRequest,
            });
            const bodyResponse = await response.json();
            expect(response.status()).toBe(201);
        });

        test("case creation with valid customer email ", async ({
            api,
            apiBaseUrl,
        }) => {
            const response = await api.post(`${apiBaseUrl}cases`, {
                data: validRequest,
            });
            const bodyResponse = await response.json();
            //expect(response.status()).toBe(400);
            //expect (bodyResponse.message).toBe("Invalid customer email");
        });
        test("case creation with invalid customer email that does not exist", async ({
            api,
            apiBaseUrl,
        }) => {
            const response = await api.post(`${apiBaseUrl}cases`, {
                data: validRequest,
            });
            const bodyResponse = await response.json();
            //expect(response.status()).toBe(400);
            //expect (bodyResponse.message).toBe("Invalid customer email");
        });
        test("case creation with a vip customer email ", async ({
            api,
            apiBaseUrl,
        }) => {
            const response = await api.post(`${apiBaseUrl}cases`, {
                data: validRequest,
            });
            const bodyResponse = await response.json();
            expect(response.status()).toBe(201);
            //expect the case to have a priority of HIGH
            expect(bodyResponse.priority).toBe("HIGH");
        });

        test("case should not be assigned to more than one handler ", async ({
            api,
            apiBaseUrl,
        }) => {
            const response = await api.post(`${apiBaseUrl}cases`, {
                data: validRequest,
            });
            const bodyResponse = await response.json();
            //check that the case is assigned to only one handler
        });
    });

    test.describe("test backoffice case assignment suite", () => {
        test("case assignment to a handler ", async ({ api, apiBaseUrl }) => {
            const response = await api.post(`${apiBaseUrl}cases/assign`, {
                data: {
                    case_id: 1,
                    handler_id: 1,
                },
            });
            const bodyResponse = await response.json();
            expect(response.status()).toBe(200);
        });
        test("case assignment to a handler that does not exist ", async ({
            api,
            apiBaseUrl,
        }) => {
            const case_id = 1;
            const handler_id = 999; // Assuming this handler ID does not exist
            const response = await api.post(
                `${apiBaseUrl}api/cases/${case_id}/assign`,
                {
                    data: {
                        handler_id: handler_id,
                    },
                },
            );
            const bodyResponse = await response.json();
            expect(response.status()).toBe(400);
            //expect (bodyResponse.message).toBe("Handler does not exist");
            //case assignment is only depart to depart IE LOST should be assigned to that department.
        });

        test("case reassignment to a different handler ", async ({
            api,
            apiBaseUrl,
        }) => {
            //previously assigned case reassigned to another hanlder.
            const case_id = 1;
            const handler_id = 999; // Assuming this handler ID does not exist
            const response = await api.post(
                `${apiBaseUrl}api/cases/${case_id}/assign`,
                {
                    data: {
                        handler_id: handler_id,
                    },
                },
            );
            const bodyResponse = await response.json();
            expect(response.status()).toBe(400);
            //expect (bodyResponse.message).toBe("Handler does not exist");
            //case assignment is only depart to depart IE LOST should be assigned to that department.
        });
        test("case reassignment to a handler with maximum open cases ", async ({
            api,
            apiBaseUrl,
        }) => {
            //test case reassignment to a handler with maximum open cases
            const case_id = 1;
            const handler_id = 999; // Assuming this handler ID does not exist
            const response = await api.post(
                `${apiBaseUrl}api/cases/${case_id}/assign`,
                {
                    data: {
                        handler_id: handler_id,
                    },
                },
            );
            const bodyResponse = await response.json();
            expect(response.status()).toBe(400);
            //expect (bodyResponse.message).toBe("Handler does not exist");
            //case assignment to a user with maximum open cases should not be allowed.
        });
    });

    test.describe("test case transition suite", () => {
        test("test assigning a transition doesnt exist", async ({
            api,
            apiBaseUrl,
        }) => {
            const invalidTransiton = "WRONG_STATUS";
            const case_id = 1;
            const response = api.put(
                `${apiBaseUrl}cases/${case_id}/transition`,
                {
                    data: {
                        case_status: invalidTransiton,
                    },
                },
            );
            expect((await response).status).toBe(400);
            expect(validRequest.case_status).toBe("OPEN");
        });

        test("case transition from open to in progress ", async ({
            api,
            apiBaseUrl,
        }) => {
            const case_id = 1;
            const ValidTransition = [
                "OPEN",
                "IN_PROGRESS",
                "RESOLVED",
                "CLOSED",
            ];
            const invalidTransitions = [
                "RESOLVED",
                "IN_PROGRESS",
                "CLOSED",
                "AWAITING_CUSTOMER",
            ];
            for (const status of ValidTransition) {
                const response = await api.patch(
                    `${apiBaseUrl}cases/${case_id}/transition`,
                    {
                        data: {
                            case_status: status,
                        },
                    },
                );
                const bodyResponse = await response.json();
                expect(response.status()).toBe(200);
            }
        });
    });
});
