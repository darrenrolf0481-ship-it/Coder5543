import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });
    // Wait an extra second
    await new Promise(r => setTimeout(r, 1000));

    const html = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML : 'Root not found';
    });

    fs.writeFileSync('scratch/dom_dump.txt', html);
    console.log('DOM dumped to scratch/dom_dump.txt successfully.');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await browser.close();
  }
})();
