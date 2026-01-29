import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

export abstract class DeviceEnricherBase {
  protected browser: any = null;

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true, // Use new headless mode if available, or just true
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--lang=de-DE",
          "--disable-http2", // Fix for ERR_HTTP2_PROTOCOL_ERROR
          "--disable-features=IsolateOrigins,site-per-process",
        ],
      });
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async getPage() {
    await this.initBrowser();
    const page = await this.browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({
      "Accept-Language": "de-DE,de;q=0.9",
    });
    return page;
  }

  abstract run(limit: number): Promise<void>;
}
