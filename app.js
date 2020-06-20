const puppeteer = require('puppeteer');
const fs = require('fs');
// https://try-puppeteer.appspot.com/
let savedToPdf = [];
const baseUrl = 'http://highscalability.com';
const baseFilePath = './pdfs';
const origin = '/blog/category/example';
const options = {waitUntil: 'networkidle2', timeout: 0};

const getHrefsAndNextPage =  async (page, url, logFilePointer) => {
    console.log('Page url: ' + url);
    await page.goto(url, options);
    const hrefs1 = await page.evaluate(
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
            console.log('Saving article: ' + newUrl);
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
    return await page.evaluate(
        () => Array.from(
            document.querySelectorAll('.paginationControlNextPageSuffix a[href]'),
            a => a.getAttribute('href')
        )
    );
};

try {
    (async () => {
        let logFilePointer;
        try {
            const data = await fs.readFileSync('./saved_pdfs.txt', {encoding: 'utf8', flag: 'r'});
            console.log('Found saved pdfs already!');
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
            logFilePointer = await fs.createWriteStream('./saved_pdfs.txt', {flags:'a'});
            console.log('Opened log file...');
        } catch (e) {
            throw e;
        }
        const browser = await puppeteer.launch({headless: true});
        console.log('Launched headless browser...');
        const page = await browser.newPage();
        try {
            await fs.mkdirSync('./pdfs', { recursive: true });
            console.log('Created folder for pdfs...');
        } catch (e) {
            console.log(e.message);
        }
        await page.setDefaultNavigationTimeout(0);
        let nextPageLink, url = `${baseUrl}${origin}`;
        nextPageLink = await getHrefsAndNextPage(page, url, logFilePointer);
        while (nextPageLink && nextPageLink[0]) {
            nextPageLink = await getHrefsAndNextPage(page, `${baseUrl + nextPageLink[0]}`, logFilePointer);
        }
        await browser.close();
    })().then(async () => {
        console.log("done");
        console.log(savedToPdf);
    });
} catch (e) {
    console.log(e)
}
