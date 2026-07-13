import { expect as baseExpect, test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { MainPage } from "../pages/MainPage";

export interface UiEnv {
    loginUrl: string;
    username: string;
    password: string;
    mainUrlPattern: string;
}

function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}. Configure it in .env.`,
        );
    }

    return value;
}

interface UiWorkerFixtures {
    uiEnv: UiEnv;
}

interface UiTestFixtures {
    loginPage: LoginPage;
    mainPage: MainPage;
}

export const test = base.extend<UiTestFixtures, UiWorkerFixtures>({
    uiEnv: [
        async ({}, use) => {
            await use({
                loginUrl: getRequiredEnv("UI_LOGIN_URL"),
                username: getRequiredEnv("UI_USERNAME"),
                password: getRequiredEnv("UI_PASSWORD"),
                mainUrlPattern: process.env.UI_MAIN_URL_PATTERN ?? "/",
            });
        },
        { scope: "worker" },
    ],

    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    mainPage: async ({ page }, use) => {
        await use(new MainPage(page));
    },
});

export const expect = baseExpect;
