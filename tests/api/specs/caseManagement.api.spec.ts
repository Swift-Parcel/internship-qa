import { test, expect } from "../setup/setupBackOffice";

type caseCreation = {
    title: string;
    description: string;
    case_type: string;
    case_status: string;
    customer_email: string;
    handler_id: number;
    region_id: number;
    channel: string;
    tag_ids: string[];
    parcel_ids: string[];
    priority: string;
};

let validRequest: caseCreation;

test.beforeEach(async () => {
    validRequest = {
        title: "Test Case",
        description: "This is a test case",
        case_type: "DAMAGED",
        case_status: "OPEN",
        customer_email: "customer1@example.com",
        handler_id: 1,
        region_id: 1,
        channel: "EMAIL",
        tag_ids: ["1", "2"],
        parcel_ids: ["1", "2"],
        priority: "LOW",
    };
});

test.describe("test backoffice case management suite", () => {
    test("testing retrieving case management api", async ({
        api,
        apiBaseUrl,
    }) => {
        const response = await api.get(`${apiBaseUrl}cases`);
        const bodyResponse = await response.json();
        expect(response.status()).toBe(200);
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
});
