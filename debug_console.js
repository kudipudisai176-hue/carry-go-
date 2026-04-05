const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER_ERROR:', error.message));

  try {
    console.log('Navigating to http://localhost:8080/sender...');
    await page.goto('http://localhost:8080/sender', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('Page loaded.');
  } catch (e) {
    console.error('Failed to load page:', e.message);
  }

  await browser.close();
})();
