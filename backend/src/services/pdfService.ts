import PDFDocument from 'pdfkit';
import type { GeneratedAssessment } from '@/types.js';

const DIFF_COLOR: Record<string, string> = {
  Easy: '#16a34a',
  Medium: '#d97706',
  Hard: '#dc2626'
};

export function generatePdfBuffer(
  assessment: GeneratedAssessment,
  meta?: { title?: string; subject?: string; className?: string; duration?: number; totalMarks?: number; school?: string }
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageW = 595 - 120; // A4 width minus margins

    // School name
    if (meta?.school) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000000').text(meta.school, { align: 'center' });
      doc.moveDown(0.3);
    }

    // Title
    doc.fontSize(18).font('Helvetica-Bold').text(meta?.title ?? 'Assessment', { align: 'center' });
    doc.moveDown(0.3);
    if (meta?.subject) doc.fontSize(12).font('Helvetica').text(`Subject: ${meta.subject}`, { align: 'center' });
    if (meta?.className) doc.fontSize(12).text(`Class: ${meta.className}`, { align: 'center' });

    doc.moveDown(0.8);

    // Time / Marks row
    if (meta?.duration ?? meta?.totalMarks) {
      const y = doc.y;
      doc.fontSize(11).font('Helvetica');
      if (meta?.duration) doc.text(`Time: ${meta.duration} min`, 60, y);
      if (meta?.totalMarks) doc.text(`Max Marks: ${meta.totalMarks}`, 60, y, { align: 'right', width: pageW });
      doc.moveDown(0.8);
    }

    // Divider
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.moveDown(0.8);

    // Student info
    doc.fontSize(11).font('Helvetica').fillColor('#000000');
    doc.text('Name: ___________________________     Roll No: _______________     Section: ________');
    doc.moveDown(1.5);

    // Sections
    for (const [si, section] of assessment.sections.entries()) {
      // Section gap (extra space before all sections except the first)
      if (si > 0) doc.moveDown(1.5);

      // Section divider line
      doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#aaaaaa').lineWidth(0.5).stroke();
      doc.moveDown(0.6);

      doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000').text(section.title, { align: 'center' });
      doc.moveDown(0.4);

      if (section.instruction) {
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#555555').text(section.instruction, { align: 'center' });
        doc.fillColor('#000000');
      }
      doc.moveDown(0.8);

      for (const [qi, q] of section.questions.entries()) {
        const diffColor = DIFF_COLOR[q.difficulty] ?? '#555555';

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#000000').text(`Q${qi + 1}. `, { continued: true });
        doc.font('Helvetica').text(q.question);
        doc.moveDown(0.25);

        doc.fontSize(9).font('Helvetica').fillColor(diffColor).text(`[${q.difficulty}]`, { continued: true });
        doc.fillColor('#444444').text(`    (${q.marks} Mark${q.marks > 1 ? 's' : ''})   ${q.blooms_level ? `• ${q.blooms_level}` : ''}`);
        doc.fillColor('#000000');
        doc.moveDown(0.7);
      }
    }

    // End marker
    doc.moveDown(1.2);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.moveDown(0.8);
    doc.fontSize(10).font('Helvetica-Oblique').fillColor('#888888').text('— End of Question Paper —', { align: 'center' });

    // Answer Key (new page)
    doc.addPage();
    doc.fillColor('#000000');
    doc.fontSize(16).font('Helvetica-Bold').text('Answer Key', { align: 'center' });
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor('#555555').text(`${meta?.title ?? 'Assessment'} — ${meta?.subject ?? ''}, Class ${meta?.className ?? ''}`, { align: 'center' });
    doc.fillColor('#000000');
    doc.moveDown(0.8);
    doc.moveTo(60, doc.y).lineTo(535, doc.y).strokeColor('#cccccc').lineWidth(0.5).stroke();
    doc.moveDown(0.8);

    let qNum = 1;
    for (const [si, section] of assessment.sections.entries()) {
      if (si > 0) doc.moveDown(1.2);

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000').text(section.title);
      doc.moveDown(0.5);

      for (const q of section.questions) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#cc4400').text(`Q${qNum}. `, { continued: true });
        doc.font('Helvetica').fillColor('#000000').text(q.answer_key ?? '—');
        doc.moveDown(0.5);
        qNum++;
      }
    }

    doc.end();
  });
}
