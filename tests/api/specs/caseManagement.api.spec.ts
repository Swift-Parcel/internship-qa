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
                //handler_id: expect.any(Number),
                // handler_name: expect.any(String),
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
            expect(
                element.handler_id === null ||
                    typeof element.handler_id === "number",
            ).toBe(true);
            expect(
                element.handler_name === null ||
                    typeof element.handler_name === "string",
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
    });

    test.describe("test backoffice case creation suite", () => {
        test("case creation with valid data ", async ({ api, apiBaseUrl }) => {
            const response = await api.post(`${apiBaseUrl}cases`, {
                data: validRequest,
            });
            const bodyResponse = await response.json();
            expect(response.status()).toBe(200);
            expect(bodyResponse).toMatchObject({
                case_number: expect.any(String),
            });
        });

        test("case creation with valid customer email ", async ({
            api,
            apiBaseUrl,
        }) => {
            const response = await api.post(`${apiBaseUrl}cases`, {
                data: validRequest,
            });

            const bodyResponse = await response.json();
            expect(response.status()).toBe(200);
            expect(bodyResponse).toMatchObject({
                case_number: expect.any(String),
            });
        });
        test("case creation with invalid customer email that does not exist", async ({
            api,
            apiBaseUrl,
        }) => {
            const email = "invalidemail@example.com";
            validRequest.customer_email = email;
            const response = await api.post(`${apiBaseUrl}cases`, {
                data: validRequest,
            });

            const bodyResponse = await response.json();
            expect(response.status()).toBe(404);
            expect(bodyResponse.message).toBe(
                `Customer with email '${email}' does not exist.`,
            );
        });
        test("case creation with a vip customer email ", async ({
            api,
            apiBaseUrl,
        }) => {
            const email = "petra.mueller@outlook.com";
            validRequest.customer_email = email;
            const response = await api.post(`${apiBaseUrl}cases`, {
                data: validRequest,
            });
            const bodyResponse = await response.json();
            expect(response.status()).toBe(200);
            expect(bodyResponse.priority).toBe("HIGH");
        });
    });

    test.describe("test backoffice case assignment suite", () => {
        test("case assignment to a handler ", async ({ api, apiBaseUrl }) => {
            const case_number = "CASE-2026-0001009";
            const response = await api.post(
                `${apiBaseUrl}cases/${case_number}/assign`,
                {
                    data: {
                        handler_id: 4,
                    },
                },
            );
            const bodyResponse = await response.json();
            expect(response.status()).toBe(200);
        });

        test("case should not be assigned to more than one handler and case reassignment ", async ({
            api,
            apiBaseUrl,
        }) => {
            const case_number = "CASE-2026-0001009";
            const handlerIds = [2, 4];

            for (const item of handlerIds) {
                const response = await api.post(
                    `${apiBaseUrl}cases/${case_number}/assign`,
                    {
                        data: {
                            handler_id: item,
                        },
                    },
                );

                const bodyResponse = await response.json();
                expect(response.status()).toBe(200);
                expect(bodyResponse.handler_id).toBe(item);
            }
        });

        test("case assignment to a handler that does not exist ", async ({
            api,
            apiBaseUrl,
        }) => {
            const case_number = "CASE-2026-0001009";
            const handler_id = 999;
            const response = await api.post(
                `${apiBaseUrl}cases/${case_number}/assign`,
                {
                    data: {
                        handler_id: handler_id,
                    },
                },
            );
            const bodyResponse = await response.json();
            expect(response.status()).toBe(404);
            expect(bodyResponse.message).toBe(
                `Handler with id ${handler_id} is not found.`,
            );
        });

        test("case assignment to a case that does not exist ", async ({
            api,
            apiBaseUrl,
        }) => {
            const case_number = "CASE-2026-INVALID";
            const handler_id = 4;
            const response = await api.post(
                `${apiBaseUrl}cases/${case_number}/assign`,
                {
                    data: {
                        handler_id: handler_id,
                    },
                },
            );
            const bodyResponse = await response.json();
            expect(response.status()).toBe(404);
            expect(bodyResponse.message).toBe(
                `Case with case number${case_number} is not found.`,
            );
        });
    });
    test("case reassignment to a handler with maximum open cases ", async ({
        api,
        apiBaseUrl,
    }) => {
        const case_number = "CASE-2026-0001017";
        const handler_id = "7"; // maximum open case 2

        const response = await api.post(
            `${apiBaseUrl}cases/${case_number}/assign`,
            {
                data: {
                    handler_id: handler_id,
                },
            },
        );

        const bodyResponse = await response.json();
        expect(response.status()).toBe(409);
    });
});

test.describe("test case transition suite", () => {
    test("test assigning a transition doesnt exist", async ({
        api,
        apiBaseUrl,
    }) => {
        const invalidTransiton = "WRONG_STATUS";
        const case_number = "CASE-2026-0001017";
        const response = await api.post(
            `${apiBaseUrl}cases/${case_number}/change-status`,

            {
                data: {
                    case_status: invalidTransiton,
                },
            },
        );
        const bodyresponse = (await response).json;

        expect(response.status()).toBe(400);
        expect(validRequest.case_status).toBe("OPEN");
    });

    test("case transition from open to in progress ", async ({
        api,
        apiBaseUrl,
    }) => {
        const case_number = "CASE-2026-0001017";
        const ValidTransition = [
            "OPEN",
            "IN_PROGRESS",
            "AWAITING_CUSTOMER",
            "RESOLVED",
            "CLOSED",
        ];

        for (let i = 1; i < ValidTransition.length - 1; i++) {
            const currentStatus = ValidTransition[i];
            const nextStatus = ValidTransition[i + 1];
            let prevStatus = ValidTransition[i];

            try {
                // Immediate next status is valid
                const response = await api.post(
                    `${apiBaseUrl}cases/${case_number}/change-status`,
                    {
                        data: {
                            status: nextStatus,
                        },
                    },
                );
                const bodyResponse = await response.json();

                expect(response.status()).toBe(200);
                //expect(bodyResponse.message).toBe("status update");
            } finally {
                if (prevStatus == "AWAITING_CUSTOMER") {
                    prevStatus = ValidTransition[i - 1];
                }
                // test reverting backwards to prev
                const response = await api.post(
                    `${apiBaseUrl}cases/${case_number}/change-status`,
                    {
                        data: {
                            status: prevStatus,
                        },
                    },
                );
                const bodyResponse = await response.json();

                expect(response.status()).toBe(200);
                //expect(bodyResponse.message).toBe("status update");
            }

            // The status after the next one should not be allowed
            //can skip awaiting customer
            if (
                i + 1 < ValidTransition.length &&
                ValidTransition[i + 1] !== "AWAITING_CUSTOMER"
            ) {
                try {
                    const skippedStatus = ValidTransition[i + 2];
                    const response = await api.post(
                        `${apiBaseUrl}cases/${case_number}/change-status`,
                        {
                            data: {
                                status: skippedStatus,
                            },
                        },
                    );
                    const bodyResponse = await response.json();

                    expect(response.status()).toBe(400);
                    expect(bodyResponse.message).toBe("cant skip");
                } finally {
                    const skippedStatus = ValidTransition[i + 2];
                    const response = await api.post(
                        `${apiBaseUrl}cases/${case_number}/change-status`,
                        {
                            data: {
                                status: nextStatus,
                            },
                        },
                    );
                    const bodyResponse = await response.json();

                    expect(response.status()).toBe(200);
                    expect(bodyResponse.message).toBe("okay");
                }
            }
        }
        //test from close back to open
        const firstStatus = "OPEN";
        const response = await api.post(
            `${apiBaseUrl}cases/${case_number}/change-status`,
            {
                data: {
                    status: firstStatus,
                },
            },
        );
        const bodyResponse = await response.json();

        expect(response.status()).toBe(400);
        expect(bodyResponse.message).toBe("cant update to start");
    });
});
