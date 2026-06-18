const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("console", msg => {
    if (msg.type() === "error") console.log("CONSOLE ERROR:", msg.text());
  });
  page.on("pageerror", err => console.log("PAGE ERROR:", err.message));

  await page.goto("http://localhost:5180");
  await page.waitForSelector("text=F1 Manager");

  // --- Desktop sidebar ---
  await page.screenshot({ path: "/tmp/01-initial-desktop.png" });

  const initialOrder = await page.$$eval("aside nav a", links => links.map(a => a.textContent.trim()));
  console.log("Initial desktop order:", JSON.stringify(initialOrder));

  await page.click("aside button:has-text(\"Modifier l'ordre\")");
  await page.waitForSelector("aside [data-rfd-drag-handle-draggable-id]");
  await page.screenshot({ path: "/tmp/02-edit-mode-desktop.png" });

  const draggableCount = await page.$$eval("aside [data-rfd-drag-handle-draggable-id]", els => els.length);
  console.log("Draggable items in edit mode (desktop):", draggableCount);

  // Drag first item to last position using mouse, with intermediate steps (react-beautiful-dnd needs movement)
  const items = await page.$$("aside [data-rfd-drag-handle-draggable-id]");
  const first = items[0];
  const last = items[items.length - 1];
  const firstBox = await first.boundingBox();
  const lastBox = await last.boundingBox();

  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y + firstBox.height / 2 + 10, { steps: 5 });
  await page.mouse.move(lastBox.x + lastBox.width / 2, lastBox.y + lastBox.height / 2 + 5, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);

  await page.screenshot({ path: "/tmp/03-after-drag-desktop.png" });

  // Click "Terminer" to exit edit mode
  await page.click("aside button:has-text(\"Terminer\")");
  await page.waitForTimeout(200);

  const reorderedDesktop = await page.$$eval("aside nav a", links => links.map(a => a.textContent.trim()));
  console.log("Desktop order after drag + Terminer:", JSON.stringify(reorderedDesktop));
  await page.screenshot({ path: "/tmp/04-normal-mode-after-reorder.png" });

  // Check localStorage persistence
  const storedOrder = await page.evaluate(() => localStorage.getItem("goldie-racing:nav-order"));
  console.log("localStorage goldie-racing:nav-order =", storedOrder);

  // Verify navigation still works (click second item, confirm URL changes)
  await page.click("aside nav a:nth-child(2)");
  await page.waitForTimeout(200);
  console.log("URL after clicking 2nd nav link:", page.url());

  // Reload and confirm order persisted
  await page.reload();
  await page.waitForSelector("text=F1 Manager");
  const afterReloadOrder = await page.$$eval("aside nav a", links => links.map(a => a.textContent.trim()));
  console.log("Desktop order after reload:", JSON.stringify(afterReloadOrder));
  await page.screenshot({ path: "/tmp/05-after-reload.png" });

  // --- Mobile drawer ---
  await page.setViewportSize({ width: 500, height: 800 });
  await page.waitForTimeout(200);
  await page.screenshot({ path: "/tmp/06-mobile-header.png" });

  await page.click("header button, .lg\\:hidden button"); // hamburger - try generic
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/07-mobile-drawer-open.png" });

  const mobileOrder = await page.$$eval("nav a", links => links.map(a => a.textContent.trim())).catch(() => []);
  console.log("Mobile drawer links found:", JSON.stringify(mobileOrder));

  const mobileEditBtn = await page.$("text=Modifier l'ordre");
  console.log("Mobile edit toggle button found:", !!mobileEditBtn);
  if (mobileEditBtn) {
    await mobileEditBtn.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: "/tmp/08-mobile-edit-mode.png" });
    const mobileDraggables = await page.$$eval("[data-rfd-drag-handle-draggable-id]", els => els.length);
    console.log("Mobile draggable items:", mobileDraggables);
  }

  await browser.close();
})().catch(err => {
  console.error("SCRIPT FAILED:", err);
  process.exit(1);
});
