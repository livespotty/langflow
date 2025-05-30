import { expect, test } from "@playwright/test";
import { awaitBootstrapTest } from "../../utils/await-bootstrap-test";
test(
  "user should be able to edit tools",
  { tag: ["@release", "@components"] },
  async ({ page }) => {
    await awaitBootstrapTest(page);

    await page.getByTestId("blank-flow").click();

    await page.getByTestId("sidebar-search-input").click();
    await page.getByTestId("sidebar-search-input").fill("api request");

    await page.waitForSelector('[data-testid="dataAPI Request"]', {
      timeout: 3000,
    });

    await page
      .getByTestId("dataAPI Request")
      .hover()
      .then(async () => {
        await page.getByTestId("add-component-button-api-request").click();
      });

    await page.waitForSelector(
      '[data-testid="generic-node-title-arrangement"]',
      {
        timeout: 3000,
      },
    );

    await page.getByTestId("generic-node-title-arrangement").click();

    await page.waitForTimeout(500);

    await page.getByTestId("tool-mode-button").click();

    await page.locator('[data-testid="icon-Hammer"]').nth(0).waitFor({
      timeout: 3000,
      state: "visible",
    });

    await page.waitForSelector("text=actions", { timeout: 30000 });

    await page.getByTestId("button_open_actions").click();

    await page.waitForSelector("text=API Request", { timeout: 30000 });

    const rowsCount = await page.getByRole("gridcell").count();

    expect(rowsCount).toBeGreaterThan(3);

    expect(
      await page.locator('input[data-ref="eInput"]').nth(0).isChecked(),
    ).toBe(true);

    expect(
      await page.locator('input[data-ref="eInput"]').nth(3).isChecked(),
    ).toBe(true);

    expect(
      await page.locator('input[data-ref="eInput"]').nth(4).isChecked(),
    ).toBe(true);

    await page.locator('input[data-ref="eInput"]').nth(0).click();

    await page.waitForTimeout(500);

    expect(
      await page.locator('input[data-ref="eInput"]').nth(3).isChecked(),
    ).toBe(false);

    expect(
      await page.locator('input[data-ref="eInput"]').nth(4).isChecked(),
    ).toBe(false);

    await page.getByText("Close").last().click();

    await page.waitForSelector(
      '[data-testid="generic-node-title-arrangement"]',
      {
        timeout: 3000,
      },
    );

    await page.waitForSelector('[data-testid="div-tools_tools_metadata"]', {
      timeout: 3000,
    });

    expect(
      await page
        .locator('[data-testid="div-tools_tools_metadata"]')
        .isVisible(),
    ).toBe(true);

    await page.getByTestId("div-tools_tools_metadata").click();

    await page.waitForTimeout(500);

    expect(
      await page.locator('input[data-ref="eInput"]').nth(3).isChecked(),
    ).toBe(false);

    expect(
      await page.locator('input[data-ref="eInput"]').nth(4).isChecked(),
    ).toBe(false);

    await page.locator('input[data-ref="eInput"]').nth(3).click();

    await page.waitForTimeout(500);

    expect(
      await page.locator('input[data-ref="eInput"]').nth(3).isChecked(),
    ).toBe(true);

    await page.getByRole("gridcell").nth(0).click();

    expect(
      await page.locator('[data-testid="sidebar_header_name"]').isVisible(),
    ).toBe(true);

    expect(
      await page
        .locator('[data-testid="sidebar_header_description"]')
        .isVisible(),
    ).toBe(true);

    await page.waitForTimeout(500);

    await page.getByText("Close").last().click();

    expect(
      await page.locator('[data-testid="tool_make_requests"]').isVisible(),
    ).toBe(true);
  },
);
