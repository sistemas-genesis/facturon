// Reemplazo de html-pdf (PhantomJS, descontinuado y roto en Node moderno) usando Puppeteer.
// Mantiene la misma API: pdf.create(html, options).toStream(cb) / toBuffer(cb) / toFile(path, cb)
const puppeteer = require("puppeteer");
const { Readable } = require("stream");
const fs = require("fs");

let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] })
      .catch((e) => {
        browserPromise = null;
        throw e;
      });
  }
  return browserPromise;
}

const wrap = (html) =>
  `<div style="width:100%;font-size:10px;-webkit-print-color-adjust:exact;">${html || ""}</div>`;

async function render(html, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const header = options.header && options.header.contents;
    const footer = options.footer && options.footer.contents;
    const buf = await page.pdf({
      format: options.format || "A4",
      landscape: options.orientation === "landscape",
      printBackground: true,
      displayHeaderFooter: !!(header || footer),
      headerTemplate: wrap(header && (header.default || header)),
      footerTemplate: wrap(footer && (footer.default || footer)),
      margin: {
        top: (options.header && options.header.height) || "0",
        bottom: (options.footer && options.footer.height) || "0",
      },
    });
    return Buffer.from(buf);
  } finally {
    await page.close().catch(() => {});
  }
}

exports.create = (html, options) => ({
  toBuffer: (cb) => render(html, options).then((b) => cb(null, b), (e) => cb(e)),
  toStream: (cb) =>
    render(html, options).then((b) => cb(null, Readable.from([b])), (e) => cb(e)),
  toFile: (path, cb) =>
    render(html, options).then(
      (b) => fs.writeFile(path, b, (e) => cb(e, { filename: path })),
      (e) => cb(e)
    ),
});
