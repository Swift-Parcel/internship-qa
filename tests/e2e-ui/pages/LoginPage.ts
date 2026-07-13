import { Locator, Page } from "@playwright/test";

export class LoginPage {
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.usernameInput = page.getByLabel(/username|email/i);
        this.passwordInput = page.getByLabel(/password/i);
        this.loginButton = page.getByRole("button", {
            name: /log in|login|sign in/i,
        });
    }

    async goto(loginUrl: string): Promise<void> {
        await this.page.goto(loginUrl);
    }

    async login(username: string, password: string): Promise<void> {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }
}
