import { expect, test } from "../../setup/setup";

test.describe("Login with page object model", () => {
    test("user can log in and lands on main page", async ({
        page,
        uiEnv,
        loginPage,
        mainPage,
    }) => {
        await loginPage.goto(uiEnv.loginUrl);
        await loginPage.login(uiEnv.username, uiEnv.password);

        await expect(page).toHaveURL(new RegExp(uiEnv.mainUrlPattern));
        await mainPage.expectLoaded();
    });
});
