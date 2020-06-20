const puppeteer = require('puppeteer');
// https://try-puppeteer.appspot.com/

try {
    (async () => {
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        const baseurl = 'http://highscalability.com';
        await page.setDefaultNavigationTimeout(0);
        const options = {waitUntil: 'networkidle2', timeout: 0}
        await page.goto('http://highscalability.com/blog/category/example', options);
        let hrefs1 = await page.evaluate(
            () => Array.from(
                document.querySelectorAll('ul.archive-item-list-pt li a[href]'),
                a => a.getAttribute('href')
            )
        );
        console.log(Array.isArray(hrefs1));
        hrefs1.forEach((href) => {
            console.log(href);
        });
        let nextPageLink = await page.evaluate(
            () => Array.from(
                document.querySelectorAll('.paginationControlNextPageSuffix a[href]'),
                a => a.getAttribute('href')
            )
        );
        console.log(nextPageLink);

        while (nextPageLink && nextPageLink[0]) {
            await page.goto(baseurl + nextPageLink, options);
            hrefs1 = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('ul.archive-item-list-pt li a[href]'),
                    a => a.getAttribute('href')
                )
            );
            console.log(Array.isArray(hrefs1));
            hrefs1.forEach((href) => {
                console.log(href);
            })

            nextPageLink = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('.paginationControlNextPageSuffix a[href]'),
                    a => a.getAttribute('href')
                )
            );
            console.log(nextPageLink);
        }
        await browser.close();
    })();
} catch (e) {
    console.log(e)
}
