import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import process from "node:process";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testMatch: "**/*.spec.ts", //new

    testIgnore: "**/setup/**/setup.ts", //new

    testDir: ".",
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: true,
    /* Retry on CI only */
    retries: 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : 2,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: "html",
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('')`. */
        // baseURL: 'http://localhost:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: "retain-on-failure",
    },

    /* Configure API and browser projects */
    projects: [
        {
            name: "api",
            testDir: "./tests/api",
            testMatch: "**/*.spec.ts", //new
        },

        {
            name: "e2e-ui",
            testDir: "./tests/e2e-ui",
            testMatch: "**/*.spec.ts", //new
            use: { ...devices["Desktop Chrome"] },
        },
    ],
});
