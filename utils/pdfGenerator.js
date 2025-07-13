const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePDF(data, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(18).text('Formulaire de Recrutement - Georgia State Patrol', { align: 'center' });
    doc.moveDown();

    const entries = {
      "Nom RP": data.nomRP,
      "Âge RP": data.ageRP,
      "Nom Discord": data.nomDiscord,
      "Âge IRL": data.ageIRL,
      "Motivations": data.motivations,
      "Qualités": data.qualites,
      "Disponibilités": data.disponibilite,
      "Casier Judiciaire": data.infractions,
      "Expérience dans les forces de l'ordre": data.anciennete
    };

    for (const [label, value] of Object.entries(entries)) {
      doc.font('Helvetica-Bold').text(label + ':');
      doc.font('Helvetica').text(value || 'Non renseigné');
      doc.moveDown();
    }

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

module.exports = generatePDF;
