import { Locator, Page } from "@playwright/test";

export class MainPage {
    readonly page: Page;
    readonly appShell: Locator;

    constructor(page: Page) {
        this.page = page;
        this.appShell = page.getByRole("main");
    }

    async expectLoaded(): Promise<void> {
        await this.appShell.waitFor({ state: "visible" });
    }
}
