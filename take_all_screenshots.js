import puppeteer from 'puppeteer';

async function capture(url, path) {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path });
    console.log(`Saved screenshot to ${path}`);
  } catch (e) {
    console.error(`Failed to capture ${url}: ${e.message}`);
  } finally {
    await browser.close();
  }
}

(async () => {
  await capture('http://localhost:3001', '/root/.gemini/antigravity-cli/brain/499c73c1-5a75-4347-b93b-5818a9e8159f/port_3001.png');
  await capture('http://localhost:3002', '/root/.gemini/antigravity-cli/brain/499c73c1-5a75-4347-b93b-5818a9e8159f/port_3002.png');
})();
