const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR STACK:', error.stack));
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        await browser.close();
        console.log('DONE');
    } catch (err) {
        console.error('Puppeteer Error:', err);
    }
})();
