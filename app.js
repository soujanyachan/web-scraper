// Imports
const puppeteer = require('puppeteer');
const fs = require('fs');
// https://try-puppeteer.appspot.com/

//Constants
let savedToPdf = [];
const baseUrl = 'http://highscalability.com';
const basePdfPath = 'pdfs';
const baseFilePath = '.';
const origin = '/blog/category/example';
const options = {waitUntil: 'networkidle2', timeout: 0};
const logFileName = 'saved_pdfs.txt';

//Functions
const getHrefsAndNextPage = async (page, url, logFilePointer, savedToPdf) => {
    console.log('Page url: ' + url);
    await page.goto(url, options);

    // get all links of particular class from page
    const hrefs = await page.evaluate(
        () => Array.from(
            document.querySelectorAll('.journal-entry-navigation-current'),
            a => a.getAttribute('href')
        )
    );

    // loop through links and convert to pdf
    for (let i = 0; i < hrefs.length; i++) {
        let newUrl;
        if (!savedToPdf.includes(hrefs[i])) {
            newUrl = `${baseUrl}${hrefs[i]}`
            await page.goto(newUrl, options);
            console.log('Saving article: ' + newUrl);
            const filePath = `${baseFilePath}/${basePdfPath}/${hrefs[i].replace(/\//g, '-').slice(1, hrefs[i].length).split('.')[0]}`;
            await page.pdf({
                path: `${filePath}.pdf`,
                format: 'A4'
            });
            logFilePointer.write(hrefs[i] + '\n');
            savedToPdf.push(hrefs[i]);
        }
    }

    // return to list page after converting list links to pdf
    await page.goto(url, options);

    // return url of next page
    return await page.evaluate(
        () => Array.from(
            document.querySelectorAll('.paginationControlNextPageSuffix a[href]'),
            a => a.getAttribute('href')
        )
    );
};
const getSavedPdfDataFromFile = async () => {
    let savedToPdf;
    try {
        const data = await fs.readFileSync(`${baseFilePath}/${logFileName}`, {encoding: 'utf8', flag: 'r'});
        console.log('Found saved pdfs already!');
        savedToPdf = data.split('\n');
    } catch (e) {
        savedToPdf = [];
        if (e.code === 'ENOENT') {
            console.log('File ' + logFileName + ' not found!');
            await fs.writeFileSync(`${baseFilePath}/${logFileName}`, '');
        } else {
            throw e;
        }
    }
    return savedToPdf;
};
const createPdfFolder = async () => {
    try {
        await fs.mkdirSync(`${baseFilePath}/${basePdfPath}`, {recursive: true});
        console.log('Created folder for pdfs...');
    } catch (e) {
        console.log(e.message);
        throw e;
    }
};
const getLogFilePointer = async () => {
    try {
        const logFilePointer = await fs.createWriteStream(`${baseFilePath}/${logFileName}`, {flags: 'a'});
        console.log('Opened log file...');
        return logFilePointer;
    } catch (e) {
        throw e;
    }
};

//Main
try {
    (async () => {
        const browser = await puppeteer.launch({headless: true});
        console.log('Launched headless browser...');
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);

        savedToPdf = await getSavedPdfDataFromFile();
        await createPdfFolder();

        let nextPageLink, url = `${baseUrl}${origin}`;
        let logFilePointer = await getLogFilePointer();
        nextPageLink = await getHrefsAndNextPage(page, url, logFilePointer, savedToPdf);
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
