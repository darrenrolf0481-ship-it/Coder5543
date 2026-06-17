import puppeteer from 'puppeteer';

(async () => {
  const targetUrl = process.argv[2] || `http://localhost:${process.env.PORT || '3002'}`;

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  console.log(`Loading ${targetUrl}...`);
  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for splash screen to be removed (React useEffect removes it)
    console.log('Waiting for splash screen removal...');
    await page.waitForFunction(() => !document.getElementById('splash'), { timeout: 10000 });
    
    const content = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        rootEmpty: root ? root.innerHTML === '' : true,
        text: document.body.innerText.substring(0, 500),
        hasPhiGrid: !!document.querySelector('.phi-grid'),
        tabs: Array.from(document.querySelectorAll('button')).map(b => b.innerText).filter(t => t.length > 3)
      };
    });
    
    console.log('Verification Results:', JSON.stringify(content, null, 2));
    
    if (content.rootEmpty) {
      console.error('FAILED: Root is empty.');
      process.exit(1);
    } else {
      console.log('SUCCESS: Application loaded and rendered.');
    }
  } catch (err) {
    console.error('ERROR during verification:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
