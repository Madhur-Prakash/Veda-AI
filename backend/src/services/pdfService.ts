import PDFDocument from 'pdfkit';
import type { GeneratedAssessment } from '@/types.js';

const DIFF_LABEL: Record<string, string> = {
  Easy: 'Easy',
  Medium: 'Moderate',
  Hard: 'Challenging'
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

    const schoolName = meta?.school ?? 'Delhi Public School, Sector-4, Bokaro';

    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text(schoolName, { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#1a1a1a').text('Question Paper', { align: 'center' });
    doc.moveDown(0.5);

    if (meta?.subject) doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text(`Subject: ${meta.subject}`, { align: 'center' });
    if (meta?.className) doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text(`Class: ${meta.className}`, { align: 'center' });

    doc.moveDown(0.5);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a');
    if (meta?.duration) doc.text(`Time Allowed: ${meta.duration} minutes`);
    if (meta?.totalMarks) doc.text(`Maximum Marks: ${meta.totalMarks}`);
    doc.moveDown(0.4);

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text('All questions are compulsory unless stated otherwise.');
    doc.moveDown(0.6);
    doc.text('Name: __________________');
    doc.text('Roll Number: ______________');
    doc.text(`Class: ${meta?.className ?? ''} Section: ________`);
    doc.moveDown(0.8);

    function getSectionHeader(title: string, index: number) {
      const match = title.match(/^Section\s+([A-Z0-9]+)\s*[–-]\s*(.+)$/i);
      if (match) {
        const sectionCode = match[1] ?? String.fromCharCode(65 + index);
        const sectionTitle = match[2] ?? title.trim();
        return {
          label: `Section ${sectionCode.toUpperCase()}`,
          subtitle: sectionTitle.trim()
        };
      }

      return {
        label: `Section ${String.fromCharCode(65 + index)}`,
        subtitle: title.trim()
      };
    }

    for (const [si, section] of assessment.sections.entries()) {
      if (si > 0) doc.moveDown(1.2);

      const header = getSectionHeader(section.title, si);
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1a1a1a').text(header.label, { align: 'center' });
      doc.moveDown(0.15);

      if (section.instruction) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text(section.instruction, { align: 'center' });
        doc.moveDown(0.3);
      }

      for (const [qi, q] of section.questions.entries()) {
        const diffLabel = DIFF_LABEL[q.difficulty] ?? q.difficulty;
        doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#1a1a1a').text(`${qi + 1}. `, { continued: true });
        doc.font('Helvetica-Bold').text(`[${diffLabel}] `, { continued: true });
        doc.font('Helvetica').text(q.question, { continued: true });
        doc.font('Helvetica-Bold').text(` [${q.marks} ${q.marks === 1 ? 'Mark' : 'Marks'}]`);
        doc.moveDown(0.45);
      }
    }

    doc.end();
  });
}