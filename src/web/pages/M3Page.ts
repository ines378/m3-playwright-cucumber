import { Page, expect } from "@playwright/test";

export default class InformM3Page {
  constructor(private page: Page) {}

  async waitLoaded() {
    await expect(
      this.page.locator("text=Infor M3")
    ).toBeVisible({ timeout: 30000 });
  }
}
