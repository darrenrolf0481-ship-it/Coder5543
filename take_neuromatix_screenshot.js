import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (error) => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', (request) =>
    console.log('PAGE REQUEST FAILED:', request.url(), request.failure()?.errorText),
  );

  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to http://localhost:8003...');
  try {
    await page.goto('http://localhost:8003', { waitUntil: 'networkidle0', timeout: 15000 });
    console.log('Page loaded. Waiting 3 seconds for rendering...');
    await new Promise((r) => setTimeout(r, 3000));

    await page.screenshot({ path: '/root/.gemini/antigravity-cli/brain/499c73c1-5a75-4347-b93b-5818a9e8159f/neuromatix.png' });
    console.log('Screenshot saved successfully.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
})();
