const puppeteer = require('puppeteer');
const fs = require('fs');
// https://try-puppeteer.appspot.com/
let savedToPdf = [];
try {
    (async () => {
        let logFilePointer;
        try {
            const data = fs.readFileSync('./saved_pdfs.txt', {encoding: 'utf8', flag: 'r'});
            savedToPdf = data.split('\n');
        } catch (e) {
            savedToPdf = [];
            if (e.code === 'ENOENT') {
                console.log('File saved_pdfs.txt not found!');
                await fs.writeFileSync('./saved_pdfs.txt', '');
            } else {
                throw e;
            }
        }
        try {
            logFilePointer = await fs.createWriteStream('./saved_pdfs.txt', {flags:'a'})
        } catch (e) {
            throw e;
        }
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        const baseUrl = 'http://highscalability.com';
        const baseFilePath = './pdfs';
        try {
            await fs.mkdirSync('./pdfs', { recursive: true });
        } catch (e) {
            console.log(e.message);
        }
        const origin = '/blog/category/example';
        await page.setDefaultNavigationTimeout(0);
        let hrefs1, nextPageLink;
        const options = {waitUntil: 'networkidle2', timeout: 0};
        const url = `${baseUrl}${origin}`;
        await page.goto(url, options);
        hrefs1 = await page.evaluate(
            () => Array.from(
                document.querySelectorAll('.journal-entry-navigation-current'),
                a => a.getAttribute('href')
            )
        );
        for(let i=0;i <hrefs1.length; i++) {
            let newUrl;
            if(!savedToPdf.includes(hrefs1[i])) {
                newUrl = `${baseUrl}${hrefs1[i]}`
                await page.goto(newUrl, options);
                const filePath = `${baseFilePath}/${hrefs1[i].replace(/\//g, '-').slice(1,hrefs1[i].length).split('.')[0]}`;
                await page.pdf({
                    path: `${filePath}.pdf`,
                    format: 'A4'
                });
                logFilePointer.write(hrefs1[i] + '\n');
                savedToPdf.push(hrefs1[i]);
            }
        }
        await page.goto(url, options);
        nextPageLink = await page.evaluate(
            () => Array.from(
                document.querySelectorAll('.paginationControlNextPageSuffix a[href]'),
                a => a.getAttribute('href')
            )
        );

        while (nextPageLink && nextPageLink[0]) {
            await page.goto(`${baseUrl + nextPageLink[0]}`, options);
            hrefs1 = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('.journal-entry-navigation-current'),
                    a => a.getAttribute('href')
                )
            );
            for(let i=0;i <hrefs1.length; i++) {
                let newUrl;
                if(!savedToPdf.includes(hrefs1[i])) {
                    newUrl = `${baseUrl}${hrefs1[i]}`;
                    await page.goto(newUrl, options);
                    const filePath = `${baseFilePath}/${hrefs1[i].replace(/\//g, '-').slice(1,hrefs1[i].length).split('.')[0]}`;
                    await page.pdf({
                        format: 'A4',
                        path: `${filePath}.pdf`
                    });
                    logFilePointer.write(hrefs1[i] + '\n');
                    savedToPdf.push(hrefs1[i]);
                }
            }
            await page.goto(baseUrl + nextPageLink[0], options);

            nextPageLink = await page.evaluate(
                () => Array.from(
                    document.querySelectorAll('.paginationControlNextPageSuffix a[href]'),
                    a => a.getAttribute('href')
                )
            );
        }
        await browser.close();
    })().then(async () => {
        console.log("done");
        console.log(savedToPdf);
    });
} catch (e) {
    console.log(e)
}
