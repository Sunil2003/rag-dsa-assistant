const fs = require("fs");
const pdf = require("pdf-parse");

async function loadPDF(path) {
  const data = fs.readFileSync(path);
  const pdfData = await pdf(data);
  return pdfData.text;
}

module.exports = { loadPDF };