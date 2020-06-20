const puppeteer = require('puppeteer');
const fs = require('fs');
// https://try-puppeteer.appspot.com/
const savedToPdf = {};
try {
    (async () => {
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        const baseUrl = 'http://highscalability.com';
        const origin = '/blog/category/example';
        await page.setDefaultNavigationTimeout(0);
        const options = {waitUntil: 'networkidle2', timeout: 0};
        const url = `${baseUrl}${origin}`;
        console.log(url);
        await page.goto(url, options);
        console.log(page.url());
        let hrefs1 = await page.evaluate(
            () => Array.from(
                document.querySelectorAll('ul.archive-item-list-pt li a[href]'),
                a => a.getAttribute('href')
            )
        );
        console.log(Array.isArray(hrefs1));
        for(let i=0;i <hrefs1.length; i++) {
            let newUrl;
            if(!savedToPdf[hrefs1[i]]) {
                newUrl = `${baseUrl}${hrefs1[i]}`
                await page.goto(newUrl, options);
                console.log(page.url());
                await page.pdf({
                    path: `./${hrefs1[i].replace('/', '-').slice(1,hrefs1[i].length)}.pdf`,
                    format: 'A4'
                });
                savedToPdf[hrefs1[i]] = true;
            }
        }
        await page.goto(url, options);
        let nextPageLink = await page.evaluate(
            () => Array.from(
                document.querySelectorAll('.paginationControlNextPageSuffix a[href]'),
                a => a.getAttribute('href')
            )
        );
        console.log(nextPageLink);

        while (nextPageLink && nextPageLink[0]) {
            await page.goto(baseUrl + nextPageLink, options);
            hrefs1 = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('ul.archive-item-list-pt li a[href]'),
                    a => a.getAttribute('href')
                )
            );
            console.log(Array.isArray(hrefs1));
            for(let i=0;i <hrefs1.length; i++) {
                let newUrl;
                if(!savedToPdf[hrefs1[i]]) {
                    newUrl = `${baseUrl}${hrefs1[i]}`
                    await page.goto(newUrl, options);
                    console.log(page.url());
                    await page.pdf({
                        path: `./${hrefs1[i].replace('/', '-').slice(1,hrefs1[i].length)}.pdf`,
                        format: 'A4'
                    });
                    savedToPdf[hrefs1[i]] = true;
                }
            }
            await page.goto(baseUrl + nextPageLink, options);

            nextPageLink = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('.paginationControlNextPageSuffix a[href]'),
                    a => a.getAttribute('href')
                )
            );
            console.log(nextPageLink);
        }
        await browser.close();
        console.log(savedToPdf);
        await fs.writeFileSync('./saved_pdfs.txt', JSON.stringify(savedToPdf));
    })();
} catch (e) {
    console.log(e)
}
