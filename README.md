# Internship QA - Playwright Test Framework

This repository contains two Playwright test suites:

- API tests in `tests/api`
- End-to-end UI tests in `tests/e2e-ui` (Chromium only)

## Project structure

```text
api/
	helpers/
		auth.ts
		apiClient.ts
tests/
	api/
		setup/
			setup.ts
		example.api.spec.ts
	e2e-ui/
		setup/
			setup.ts
		pages/
			LoginPage.ts
			MainPage.ts
		specs/
			login/
				login.pom.spec.ts
playwright.config.ts
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
# API
API_AUTH_URL=
API_USERNAME=
API_PASSWORD=
API_BASE_URL=
API_TOKEN_PATH=token

# UI
UI_LOGIN_URL=
UI_USERNAME=
UI_PASSWORD=
UI_MAIN_URL_PATTERN=/dashboard
```

Use `.env.example` as the template.

## Run tests

Run all tests:

```bash
npx playwright test
```

Run API tests only:

```bash
npx playwright test --project=api
```

Run UI tests only (Chromium):

```bash
npx playwright test --project=e2e-ui
```

Run the sample tests:

```bash
npx playwright test tests/api/example.api.spec.ts --project=api
npx playwright test tests/e2e-ui/specs/login/login.pom.spec.ts --project=e2e-ui
```

## How API authentication works

Authentication is centralized and not repeated in each API test.

1. `tests/api/setup/setup.ts` validates required env vars:
    - `API_AUTH_URL`
    - `API_USERNAME`
    - `API_PASSWORD`
    - `API_BASE_URL`

2. It calls `getBearerToken` from `api/helpers/auth.ts`.
    - Sends POST request to `API_AUTH_URL`
    - Uses body with `username` and `password`
    - Reads token from `API_TOKEN_PATH` (default `token`)

3. The token is cached in a worker-scoped fixture.

4. `api/helpers/apiClient.ts` injects the header automatically for every request:
    - `Authorization: Bearer <token>`

5. API specs import fixtures from `tests/api/setup/setup.ts` and use:
    - `api` (authenticated client)
    - `apiBaseUrl`

## Create a new API test

1. Create a file under `tests/api`, for example:
    - `tests/api/users.api.spec.ts`

2. Import `test` and `expect` from API setup:

```ts
import { expect, test } from "./setup/setup";

test("get users", async ({ api, apiBaseUrl }) => {
    const response = await api.get(`${apiBaseUrl}/users`);
    expect(response.ok()).toBeTruthy();
});
```

Do not repeat auth calls in spec files. The setup fixture already handles that.

## Create a new E2E UI test (Page Object Model)

1. Add or reuse page objects in `tests/e2e-ui/pages`.

2. If needed, expose additional pages in `tests/e2e-ui/setup/setup.ts` as fixtures.

3. Create spec file under `tests/e2e-ui/specs`, for example:
    - `tests/e2e-ui/specs/profile/profile.spec.ts`

4. Import `test` and `expect` from UI setup:

```ts
import { expect, test } from "../../setup/setup";

test("user can log in", async ({ page, uiEnv, loginPage, mainPage }) => {
    await loginPage.goto(uiEnv.loginUrl);
    await loginPage.login(uiEnv.username, uiEnv.password);

    await expect(page).toHaveURL(new RegExp(uiEnv.mainUrlPattern));
    await mainPage.expectLoaded();
});
```

## Linting and formatting

Run lint:

```bash
npm run lint
```

Auto-fix lint issues where possible:

```bash
npm run lint:fix
```

Format project with Prettier:

```bash
npx prettier --write .
```
