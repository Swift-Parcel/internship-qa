import { APIResponse } from "@playwright/test";
import { expect, test } from "../setup/setupBackOffice";

type Case = {
    id: number | string;
    case_number: string;
    title: string;
    description: string;
    case_type: string | number;
    status: string | number;
    priority: string | number;
    created_date: string;
    updated_date: null | string;
    is_escalated: boolean;
    resolved_date: null | string;
    sla_deadline: string;
    channel: string | number;
    resolution: null | string;
    satisfaction_score: null | number | string;
    customer_id: number | string;
    customer_name: string;
    handler_id: null | number | string;
    handler_name: null | string;
    region_id: number | string;
    region_name: string;
    tags: [
        {
            id: number | string;
            name: string;
        },
    ];
};

let caseTypes = [
    "LOST",
    "DAMAGED",
    "DELAYED",
    "WRONG_ADDRESS",
    "BILLING",
    "DELIVERY_CHANGE",
    "OTHER",
];

async function getBadSlaCalculationsByCaseType(
    response: APIResponse,
    caseType: string,
): Promise<string[]> {
    const responseBody = await response.json();
    let getCreatedCaseArray: Case[] = new Array();
    responseBody.forEach((element: Case) => {
        if (element.case_type === caseType) {
            getCreatedCaseArray.push(element);
        }
    });
    let badSlaCalcCases: string[] = new Array();

    let sla_hours: number = 48;
    if (caseType === "BILLING" || caseType === "OTHER") {
        sla_hours = 72;
    } else if (caseType === "DELIVERY_CHANGE") {
        sla_hours = 24;
    }
    getCreatedCaseArray.forEach((c: Case) => {
        const createdTime = new Date(c.created_date).getTime();
        const sla_deadline = new Date(c.sla_deadline).getTime();
        if (sla_deadline !== createdTime + sla_hours * 60 * 60 * 1000) {
            badSlaCalcCases.push(c.case_number);
        }
    });
    return badSlaCalcCases;
}

test.describe("SLA management tests - positive", () => {
    test(
        "SLA deadline generates for a new case",
        { tag: "@smoke" },
        async ({ api, apiBaseUrl }) => {
            const createCaseResponse = await api.post(`${apiBaseUrl}cases`, {
                data: {
                    title: "SLA GEN TC",
                    description: "This is a test case for SLA generation",
                    case_type: 0,
                    case_status: 5,
                    customer_email: "customer2@example.com",
                    handler_id: "2",
                    region_id: "6",
                    channel: 0,
                    tag_ids: ["1"],
                    parcel_ids: ["1"],
                    priority: 3,
                    require_authentication: true,
                    allowed_roles: [0, 3],
                },
            });
            const createCaseResponseBody = await createCaseResponse.json();
            let createdCaseNumber = createCaseResponseBody.case_number;
            const getCaseResponse = await api.get(`${apiBaseUrl}cases`);
            const getCaseResponseBody = await getCaseResponse.json();
            let createdCase: Case;
            getCaseResponseBody.forEach((c: Case) => {
                if (c.case_number === createdCaseNumber) {
                    createdCase = c;
                }
            });

            expect(getCaseResponse.status(), "Status Code 200").toBe(200);
            expect(
                createdCase!.sla_deadline,
                "SLA deadline has generated",
            ).not.toBe(undefined);
        },
    );

    test(
        "SLA deadline calculation for generated case",
        { tag: "@smoke" },
        async ({ api, apiBaseUrl }) => {
            const createCaseResponse = await api.post(`${apiBaseUrl}cases`, {
                data: {
                    title: "SLA GEN TC",
                    description: "This is a test case for SLA generation",
                    case_type: 0,
                    case_status: 5,
                    customer_email: "customer2@example.com",
                    handler_id: "2",
                    region_id: "6",
                    channel: 0,
                    tag_ids: ["1"],
                    parcel_ids: ["1"],
                    priority: 3,
                    require_authentication: true,
                    allowed_roles: [0, 3],
                },
            });
            const createCaseResponseBody = await createCaseResponse.json();
            let createdCaseNumber = createCaseResponseBody.case_number;
            const getCaseResponse = await api.get(`${apiBaseUrl}cases`);
            const getCaseResponseBody = await getCaseResponse.json();
            let createdCase: Case;
            getCaseResponseBody.forEach((c: Case) => {
                if (c.case_number === createdCaseNumber) {
                    createdCase = c;
                }
            });
            expect(getCaseResponse.status(), "Status Code 200").toBe(200);
            expect(
                new Date(createdCase!.sla_deadline).getTime(),
                "Generated SLA deadline is correct",
            ).toBe(
                new Date(createdCase!.created_date).getTime() +
                    48 * 60 * 60 * 1000,
            );
        },
    );

    caseTypes.forEach((caseType: string) => {
        test(`SLA deadline calculation for ${caseType} case type`, async ({
            api,
            apiBaseUrl,
        }) => {
            const response = await api.get(`${apiBaseUrl}cases`);

            const badSlaCalcCases = await getBadSlaCalculationsByCaseType(
                response,
                caseType,
            );

            expect(response.status(), "Status Code 200").toBe(200);
            expect(
                badSlaCalcCases,
                `SLA deadlines for all cases with type ${caseType} is correct`,
            ).toHaveLength(0);
        });
    });

    test("SLA breaches flagged correctly for current breaches", async ({
        api,
        apiBaseUrl,
    }) => {
        const casesResponse = await api.get(`${apiBaseUrl}cases`);
        const casesResponseBody = await casesResponse.json();
        let currentBreaches: number = 0;
        casesResponseBody.forEach((c: Case) => {
            if (c.status !== "CLOSED") {
                if (
                    c.resolved_date !== null &&
                    new Date(c.resolved_date).getTime() >
                        new Date(c.sla_deadline).getTime()
                ) {
                    currentBreaches++;
                    console.log("res not null ", c.case_number);
                }
            }
        });

        const breachesResponse = await api.get(
            `${apiBaseUrl}reports/sla-breaches`,
        );
        const breachesResponseBody = await breachesResponse.json();
        expect(breachesResponse.status(), "Status Code 200").toBe(200);
        expect(
            breachesResponseBody.current_breaches,
            "Number of current breaches is correct",
        ).toBe(currentBreaches);
    });

    test("SLA breaches flagged correctly for historical breaches", async ({
        api,
        apiBaseUrl,
    }) => {
        const casesResponse = await api.get(`${apiBaseUrl}cases`);
        const casesResponseBody = await casesResponse.json();
        let historicalBreaches: number = 0;
        casesResponseBody.forEach((c: Case) => {
            if (c.status === "CLOSED") {
                if (
                    new Date(Date.now()).getTime() >
                    new Date(c.sla_deadline).getTime()
                ) {
                    historicalBreaches++;
                    console.log("res null", c.case_number);
                }
            }
        });

        const breachesResponse = await api.get(
            `${apiBaseUrl}reports/sla-breaches`,
        );
        const breachesResponseBody = await breachesResponse.json();
        expect(breachesResponse.status(), "Status Code 200").toBe(200);
        expect(
            breachesResponseBody.historical_breaches,
            "Number of current breaches is correct",
        ).toBe(historicalBreaches);
    });
});
