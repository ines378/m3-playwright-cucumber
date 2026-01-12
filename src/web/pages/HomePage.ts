import { Page, BrowserContext } from "@playwright/test";

export default class HomePage {
  constructor(
    private page: Page,
    private context: BrowserContext
  ) {}

  async waitHomeLoaded(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  async openApplicationsMenu(): Promise<void> {
    // bouton grille à gauche
    await this.page.locator('button[aria-label="Homepages"]').click({ force: true });
  }

  async openInformM3Recette(): Promise<Page> {
    const frame = this.page.frameLocator('iframe[name^="homepages"]');

    // 👉 clic via l’identifiant technique M3
    const [m3Page] = await Promise.all([
      this.context.waitForEvent("page"),
      frame.locator('[data-logical-id="infor.m3.rec"]').click({ force: true })
    ]);

    await m3Page.waitForLoadState("domcontentloaded");
    return m3Page;
  }
}





