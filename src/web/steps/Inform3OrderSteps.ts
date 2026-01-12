import { Given, When } from "@cucumber/cucumber";
import { expect, type Page, type Locator } from "@playwright/test";
async function runCtrl19Safe(page: Page) {
 for (let attempt = 1; attempt <= 3; attempt++) {
   // 1) fermer menus (toolbox / overlays)
   await page.keyboard.press("Escape").catch(() => {});
   await page.keyboard.press("Escape").catch(() => {});
   await page.waitForTimeout(150);
   // 2) re-sélectionner une ligne (sinon la grille n’est pas active)
   await selectFirstGridRow(page, 60000);
   // 3) focus moteur M3 (TON focusM3Hard)
   await page.bringToFront().catch(() => {});
   await focusM3Hard(page);
   await page.waitForTimeout(120);
   // 4) envoyer Ctrl+19 (avec petits délais)
   await page.keyboard.down("Control");
   await page.keyboard.press("Digit1", { delay: 80 });
   await page.keyboard.press("Digit9", { delay: 80 });
   await page.keyboard.up("Control");
   await page.keyboard.press("Enter");
   await page.waitForTimeout(800);
   // 5) si ça a ouvert un écran/boite/rafraichi → OK
   const ok = await Promise.race([
     page.locator(".inforBusyIndicator, .inforLoadingIndicator").isVisible().catch(() => false),
     page.waitForTimeout(600).then(() => true),
   ]);
   if (ok) return;
   // sinon on retente
   await page.waitForTimeout(400);
 }
 throw new Error("Ctrl+19 n’a pas été pris par le moteur M3 après 3 essais (focus perdu).");
}

async function waitAttachedInAnyFrame(page: Page, selector: string, timeout = 60000): Promise<Locator> {
 return waitInAnyFrame(page, selector, timeout);
}
async function pressF3M3(page: Page) {
 // 1) fermer menus éventuels
 await page.keyboard.press("Escape").catch(() => {});
 await page.keyboard.press("Escape").catch(() => {});
 await page.waitForTimeout(120);
 // 2) cliquer dans M3 (évite la barre "Commencez votre saisie")
 await page.mouse.click(350, 350).catch(() => {});
 await page.waitForTimeout(80);
 // 3) focus moteur M3 (input caché)
 const m3Input = await waitInAnyFrame(
   page,
   'input[type="text"][tabindex="-1"], input.inforHiddenInput, input#cmdText, #cmdText',
   15000
 );
 await m3Input.click({ force: true }).catch(() => {});
 await page.waitForTimeout(80);
 // 4) F3 réel
 await page.keyboard.press("F3");
 await page.waitForTimeout(900);
}




async function selectFirstRowNoOpen(page: Page, timeout = 60000) {
 const row = await waitInAnyFrame(page, ".slick-viewport .slick-row:first-child", timeout);
 await row.scrollIntoViewIfNeeded();
 // clique dans la marge gauche (zone la + safe)
 const leftSafeCell = row.locator(".slick-cell.l0.r0, .slick-cell:first-child").first();
 const box = await leftSafeCell.boundingBox();
 if (!box) throw new Error("❌ Impossible de récupérer la position de la cellule gauche");
 // mousedown/up => moins de risques de double-click
 await page.mouse.move(box.x + 4, box.y + box.height / 2);
 await page.mouse.down();
 await page.mouse.up();
 await page.waitForTimeout(150);
}




/** Wait locator in page OR any frame */
async function waitInAnyFrame(page: Page, selector: string, timeout = 60000): Promise<Locator> {
 const start = Date.now();
 while (Date.now() - start < timeout) {
   const top = page.locator(selector);
   if (await top.count().catch(() => 0)) {
     const el = top.first();
     await el.waitFor({ state: "visible", timeout: 800 }).catch(() => {});
     if (await el.isVisible().catch(() => false)) return el;
   }

   for (const frame of page.frames()) {
     const loc = frame.locator(selector);
     if (await loc.count().catch(() => 0)) {
       const el = loc.first();
       await el.waitFor({ state: "visible", timeout: 800 }).catch(() => {});
       if (await el.isVisible().catch(() => false)) return el;
     }
   }
   await page.waitForTimeout(250);
 }
 throw new Error(`Element not found (any frame): ${selector}`);
}

/** Return the first "Infor/M3" frame (best effort) */
function getM3Frame(page: Page) {
 return page.frames().find(f => f.url().includes("infor"));
}

/** HARD focus to M3 engine (prevents typing in portal search bar) */
async function focusM3Hard(page: Page) {
 // 0) close any portal overlays
 await page.keyboard.press("Escape").catch(() => {});
 await page.waitForTimeout(100);

 // 1) click inside M3 frame body if present
 const frame = getM3Frame(page);
 if (frame) {
   await frame.evaluate(() => {
     (document.activeElement as HTMLElement | null)?.blur?.();
     document.body.focus();
     document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
     document.body.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
   }).catch(() => {});
 } else {
   // fallback click (avoid top search bar area)
   await page.mouse.click(300, 300).catch(() => {});
 }

 // 2) if cmdText exists, click it (most reliable)
 const cmd = page.locator("input#cmdText, #cmdText").first();
 if (await cmd.count().catch(() => 0)) {
   await cmd.click({ force: true }).catch(() => {});
   return;
 }

 // 3) Otherwise try hidden inputs used by M3 sometimes
 const candidates = [
   "input#cmdText, #cmdText",
   "input.inforHiddenInput",
   'input[type="text"][tabindex="-1"]',
   'input[type="text"][style*="opacity: 0"]',
 ];
 for (const sel of candidates) {
   const el = await waitInAnyFrame(page, sel, 1500).catch(() => null);
   if (el) {
     await el.click({ force: true }).catch(() => {});
     return;
   }
 }

 // 4) last resort: click center
 await page.mouse.click(400, 400).catch(() => {});
}

/** Wait cmdText ready after Ctrl+R (your main instability) */
async function waitCmdReady(page: Page, timeout = 20000) {


 // cmdText can be in a frame or top-level depending on version
 await waitInAnyFrame(page, "input#cmdText, #cmdText, input[id*='cmd']", timeout);
}

/** Stable launch program from cmdText */
async function launchProgram(page: Page, program: string) {
 await focusM3Hard(page);
 const cmd = await waitInAnyFrame(page, "input#cmdText, #cmdText, input[id*='cmd']", 20000);

 await cmd.click({ force: true });
 await page.keyboard.press("Control+A");
 await page.keyboard.type(program, { delay: 40 });
 await page.keyboard.press("Enter");
}

/** Detect if we are on OIS300 (grid/toolbox) */
async function isOIS300(page: Page) {
 return await waitInAnyFrame(page, ".slick-viewport, .slick-row, #toolBoxBtnCont", 800)
   .then(() => true)
   .catch(() => false);
}

/** Detect portal home (danger: typing will go to search bar) */
async function isPortalHome(page: Page) {
 return await waitInAnyFrame(
   page,
   "#mhdrAppBtn, text=/Commencez votre saisie/i, text=/Rechercher/i",
   800
 ).then(() => true).catch(() => false);
}

async function selectFirstGridRow(page: Page, timeout = 60000) {
 const firstRow = await waitInAnyFrame(page, ".slick-viewport .slick-row:first-child", timeout);
 await firstRow.scrollIntoViewIfNeeded();
 const box = await firstRow.boundingBox();
 if (!box) throw new Error("Impossible de récupérer la position de la 1ère ligne");
 await page.mouse.click(box.x + 8, box.y + box.height / 2);
}

/** -------------------- STATE -------------------- **/
let copiedCDV = "";

/** -------------------- STEPS -------------------- **/

Given("user opens Inform M3 Recette", async function () {
 await this.page.goto("https://recinforos.sonepar.fr/infor/homepages");
 await this.page.waitForLoadState("domcontentloaded");
 const menuBtn = this.page.locator("button#mhdrAppBtn");
 await menuBtn.waitFor({ state: "visible", timeout: 60000 });
 await menuBtn.click();
 const tile = this.page.locator("text=/Infor\\s*M3\\s*RECETTE/i").first();
 await tile.waitFor({ state: "visible", timeout: 60000 });
 await tile.scrollIntoViewIfNeeded();
 await tile.click({ force: true });
 console.log("⏳ Attente chargement moteur M3...");
 //  ON N’ATTEND PAS domcontentloaded
 //  ON ATTEND L’IFRAME M3 + cmdText
 const start = Date.now();
 while (Date.now() - start < 90000) {
   for (const frame of this.page.frames()) {
     if (frame.url().includes("infor")) {
       const cmd = frame.locator("input#cmdText, #cmdText");
       if (await cmd.count().catch(() => 0)) {
         console.log("✅ Moteur M3 prêt");
         return;
       }
     }
   }
   await this.page.waitForTimeout(500);
 }
 throw new Error("❌ Moteur M3 non chargé après 90s");
});
When("user presses Ctrl R", async function () {
 await focusM3Hard(this.page);
 await this.page.keyboard.press("Control+R");
 // wait cmdText to come back (fixes random fails)
 await waitCmdReady(this.page, 20000);
});

When("user launches OIS300", async function () {
  // attendre que M3 soit prêt après Ctrl+R
  await this.page.waitForTimeout(2000);
 
  // taper OIS300
  await this.page.keyboard.type("OIS300", { delay: 100 });
 
  // valider
  await this.page.keyboard.press("Enter");
 
  await this.page.waitForTimeout(3000);
});
When("user clicks on new order", async function () {
 const newOrderBtn = await waitInAnyFrame(
   this.page,
   "button#WYQ0615.inforFormButton, #WYQ0615",
   60000
 );
 await newOrderBtn.click({ force: true });

 await Promise.race([
   waitInAnyFrame(this.page, ":is(input#OACUNO, input[name='OACUNO'])", 60000),
   waitInAnyFrame(this.page, "text=/OIS100/i", 60000),
 ]);
});

When("user fills order header", async function () {
 const client = await waitInAnyFrame(this.page, "input#OACUNO, input[name='OACUNO']", 60000);
 const typeCdv = await waitInAnyFrame(this.page, "input#OAORTP, input#AOARTP, input[name='OAORTP']", 60000);
 const etab = await waitInAnyFrame(this.page, "input#OAFACI, input[name='OAFACI']", 60000);
 const suivant = await waitInAnyFrame(this.page, "button#Next", 60000);

 await client.click({ force: true });
 await this.page.keyboard.press("Control+A");
 await this.page.keyboard.type("41402764", { delay: 40 });
 await this.page.keyboard.press("Tab");

 await typeCdv.click({ force: true });
 await this.page.keyboard.press("Control+A");
 await this.page.keyboard.type("EMP", { delay: 40 });
 await this.page.keyboard.press("Tab");

 await etab.click({ force: true });
 await this.page.keyboard.press("Control+A");
 await this.page.keyboard.type("2ME", { delay: 40 });
 await this.page.keyboard.press("Tab");

 await suivant.click({ force: true });
});

When("user fills customer order number", async function () {
 await waitInAnyFrame(this.page, "button#Next", 60000);

 const depot = await waitInAnyFrame(this.page, "input#OAWHLO, input#OAWLO", 60000);
 await depot.click({ force: true });
 await this.page.keyboard.press("Control+A");
 await this.page.keyboard.type("2ME", { delay: 40 });
 await this.page.keyboard.press("Tab");

 const cmdClient = await waitInAnyFrame(this.page, "input#OACUOR", 60000);
 await cmdClient.click({ force: true });
 await this.page.keyboard.press("Control+A");
 await this.page.keyboard.type("testFINALE2", { delay: 40 });

 const suivant = await waitInAnyFrame(this.page, "button#Next", 60000);
 await suivant.click({ force: true });

 await cmdClient.waitFor({ state: "hidden", timeout: 60000 }).catch(() => {});
});
When("user fills product and quantity and presses Enter", async function () {
  const article = await waitInAnyFrame(this.page, "input#WBITNO", 60000);
  const qte = await waitInAnyFrame(this.page, "input#WBORQA", 60000);

  await article.click({ force: true });
  await this.page.keyboard.type("00126673253", { delay: 30 });

  await qte.click({ force: true });
  await this.page.keyboard.type("10", { delay: 30 });
  // Date (ton inspecteur montre input#WBDWDZ)
const date = await waitInAnyFrame(this.page, "input#WBDWDZ, input[name='WBDWDZ']", 60000);
  await date.click({ force: true });
  await this.page.keyboard.press("Control+A");
  await this.page.keyboard.type("150126", { delay: 30 }); // exemple: 12/01/26


  await this.page.keyboard.press("Enter");



  await expect(article).toHaveValue("", { timeout: 10000 });
});

When("user copies the CDV number", async function () {
  const cdv = await waitInAnyFrame(
    this.page,
    "input#OAORNO, input[name='OAORNO']",
    10000
  );

  copiedCDV = (await cdv.inputValue()).trim();
  if (!copiedCDV) throw new Error("CDV vide");
  console.log("CDV =", copiedCDV);
});

When("user exits OIS100 to OIS300 with F3", async function () {
 for (let i = 1; i <= 4; i++) {

   await pressF3M3(this.page);
 }
});

When("user filters by establishment {string}", async function (etabValue: string) {
 // On attend la grille OIS300 (sinon le champ n’existe pas)
 await waitInAnyFrame(this.page, ".slick-viewport, .slick-row, #toolBoxBtnCont", 60000);
 const etab = await waitInAnyFrame(
   this.page,
   'input#W10BKV, input[id^="W1"][id$="BKV"], input[aria-label*="Etablissement"]',
   60000
 );
 await etab.click({ force: true });
 await this.page.keyboard.press("Control+A");
 await this.page.keyboard.type(etabValue, { delay: 20 });
 await this.page.keyboard.press("Tab");
 // Si le bouton "Appliquer" existe, on clique (souvent obligatoire)
 const appliquer = await waitInAnyFrame(this.page, 'button:has-text("Appliquer")', 1500).catch(() => null);
 if (appliquer) await appliquer.click({ force: true });
});

When("user filters by CDV {string}", async function (cdvValue: string) {
 if (!(await isOIS300(this.page))) throw new Error("On n'est pas dans OIS300 au moment du filtre CDV");

 const value = cdvValue === "COPIED" ? copiedCDV : cdvValue;
 if (!value) throw new Error("CDV non disponible (copiedCDV vide)");


 const cdv = await waitInAnyFrame(
   this.page,
   "input#W20BKV, input[id^='W2'][id$='BKV'], input[aria-label*='N° cdv'], input[aria-label*='N° CDV']",
   60000
 );
 await cdv.click({ force: true });
 await this.page.keyboard.press("Control+A");
 await this.page.keyboard.type(value, { delay: 20 });
 await this.page.keyboard.press("Enter");
 console.log("✅ Filtre CDV =", value);
});

When("user selects first row", async function () {
 await selectFirstRowNoOpen(this.page);
});

When("user opens MWS410 via option {int}", async function (num: number) {
 const toolboxBtn = await waitInAnyFrame(this.page, "#toolBoxBtnCont > button.inforIconButton", 60000);

 // prepare popup BEFORE choosing option
 const ctx = this.page.context();
 const newPagePromise = ctx.waitForEvent("page", { timeout: 8000 }).catch(() => null);

 await toolboxBtn.click({ force: true });

 const option = await waitInAnyFrame(this.page, `li:has-text("${num} -")`, 60000);
 await option.scrollIntoViewIfNeeded();
 await option.dblclick({ force: true });

 const newPage = await newPagePromise;
 const target: Page = newPage ?? this.page;

 await target.waitForLoadState("domcontentloaded");
 await Promise.race([
   target.waitForURL(/MWS410/i, { timeout: 60000 }).catch(() => null),
   waitInAnyFrame(target, "text=/MWS410/i", 60000).catch(() => null),
 ]);

 if (newPage) this.page = newPage;
});

When("user selects first row in MWS410 and runs option {int}", async function (num: number) {
 await selectFirstGridRow(this.page, 60000);

 const toolboxBtn = await waitInAnyFrame(
   this.page,
   "#toolBoxBtnCont > button.inforIconButton, button.inforIconButton",
   60000
 );
 await toolboxBtn.click({ force: true });

 const opt = await waitInAnyFrame(this.page, `li:has-text("${num} -")`, 60000);
 await opt.scrollIntoViewIfNeeded();
 await opt.dblclick({ force: true });
 await this.page.waitForTimeout(15000);
});


// Ctrl+19 + rester 20s
When("user runs option 19 in MWS410", async function () {
 // fermer menus éventuels
 await this.page.keyboard.press("Escape").catch(() => {});
 await this.page.keyboard.press("Escape").catch(() => {});
 await this.page.waitForTimeout(150);
 // être sûr qu'une ligne est sélectionnée
 await selectFirstGridRow(this.page, 60000);
 //  focus moteur M3 (sinon Ctrl+19 part dans le vide)
 await focusM3Hard(this.page);
 await this.page.waitForTimeout(100);
 // Ctrl+19 (Infor shortcut)
 await this.page.keyboard.down("Control");
 await this.page.keyboard.press("Digit1");
 await this.page.keyboard.press("Digit9");
 await this.page.keyboard.up("Control");
 await this.page.keyboard.press("Enter");
 //  rester 20s sur la page (comme tu veux)s
 await this.page.waitForTimeout(10000);
});

//  1 seul F3 pour sortir -> attendre OIS300 -> rester 30s
When(/^user exits MWS410 to OIS300 with f3$/i, async function () {
 await this.page.keyboard.press("Escape").catch(() => {});
 await this.page.keyboard.press("Escape").catch(() => {});
 await this.page.waitForTimeout(200);
 await focusM3Hard(this.page);
 await this.page.waitForTimeout(120);
 await this.page.keyboard.press("F3"); // 1 seul F3
 await Promise.race([
   waitInAnyFrame(this.page, ".slick-viewport .slick-row, #toolBoxBtnCont", 30000),
   waitInAnyFrame(this.page, "text=/OIS300/i", 30000),
 ]);
 await this.page.waitForTimeout(30000); // rester 30s sur OIS300
});
 






