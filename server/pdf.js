import puppeteer from 'puppeteer';

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({ headless: true }).catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

export async function closeBrowser() {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  await browser?.close();
}

const PAGE_SIZES = {
  a4: { width: 794, height: 1123 },
  letter: { width: 816, height: 1056 },
};

export async function renderPdf(origin, cv) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    const format = cv?.style?.pageFormat ?? 'continuous';
    const width = format === 'letter' ? PAGE_SIZES.letter.width : PAGE_SIZES.a4.width;
    await page.setViewport({ width, height: 1123, deviceScaleFactor: 1 });
    await page.emulateMediaType('print');
    await page.goto(`${origin}/print`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForFunction('typeof window.__renderCV === "function"', { timeout: 15000 });
    await page.evaluate((data) => window.__renderCV(data), cv);
    await page.waitForSelector('body[data-cv-ready="1"]', { timeout: 20000 });

    if (format === 'continuous') {
      // One tall page, A4 wide, exactly as high as the content (like the sample CV).
      const height = await page.evaluate(
        () => Math.ceil(document.querySelector('.cv').getBoundingClientRect().height),
      );
      return Buffer.from(
        await page.pdf({
          width: `${width}px`,
          height: `${height + 1}px`,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          pageRanges: '1',
        }),
      );
    }

    return Buffer.from(
      await page.pdf({
        format: format === 'letter' ? 'Letter' : 'A4',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        preferCSSPageSize: true,
      }),
    );
  } finally {
    await page.close().catch(() => {});
  }
}
