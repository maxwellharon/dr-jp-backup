// api/send-report.js
import nodemailer from 'nodemailer';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST supported' });

    const { recipients, reportData, reportType, filters } = req.body;
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'No recipients provided' });
    }
    if (!reportData) {
        return res.status(400).json({ error: 'No report data provided' });
    }

    const periodText = filters?.dateFrom && filters?.dateTo
        ? `For the period ${filters.dateFrom} to ${filters.dateTo}`
        : `For the period ${new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}`;

    const subjectLine = filters?.dateFrom && filters?.dateTo
        ? `${reportType} - For the period ${filters.dateFrom} to ${filters.dateTo}`
        : `${reportType} - For the period ${new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}`;

    try {
        const doc = new jsPDF('p', 'mm', 'a4');
        const now = new Date().toLocaleString('en-KE', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'Africa/Nairobi'
        });
        const primary = [30, 41, 59];
        const accent = [79, 70, 229];
        const lightBg = [245, 247, 250];
        let y = 20;

        // Header
        doc.setFillColor(...primary);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('DR. JP OGALO CLINIC', 14, 15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('Automated Report', 14, 22);
        doc.setFontSize(9);
        doc.text(`Generated: ${now}`, 14, 29);
        doc.text(`Period: ${periodText}`, 14, 34);
        y = 42;

        // Report Type
        doc.setTextColor(...primary);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(reportType, 14, y);
        y += 8;

        // Summary
        if (reportData.summary && Object.keys(reportData.summary).length > 0) {
            doc.setDrawColor(...accent);
            doc.setLineWidth(0.5);
            doc.line(14, y - 3, 196, y - 3);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary', 14, y);
            y += 6;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            Object.entries(reportData.summary).forEach(([key, value]) => {
                if (y > 270) { doc.addPage(); y = 20; }
                doc.setTextColor(80, 80, 80);
                doc.text(`${key}:`, 14, y);
                doc.setTextColor(30, 41, 59);
                doc.text(String(value), 70, y);
                y += 5;
            });
            y += 4;
        }

        // AI Insights
        if (reportData.aiInsights && reportData.aiInsights.length > 0) {
            if (y > 240) { doc.addPage(); y = 20; }
            doc.setFillColor(...accent);
            doc.rect(14, y - 5, 182, 1, 'F');
            y += 4;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(...primary);
            doc.text('AI Insights', 14, y);
            y += 8;

            reportData.aiInsights.forEach(ins => {
                const lines = doc.splitTextToSize(ins.message, 174);
                const textHeight = lines.length * 4;
                const cardHeight = Math.max(20, 6 + textHeight + 5);

                if (y + cardHeight > 280) {
                    doc.addPage();
                    y = 20;
                }

                doc.setFillColor(...lightBg);
                doc.roundedRect(14, y, 182, cardHeight, 2, 2, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(...accent);
                doc.text(ins.title, 18, y + 6);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(60, 60, 60);
                let lineY = y + 11;
                lines.forEach(line => {
                    if (lineY > y + cardHeight - 2) return;
                    doc.text(line, 18, lineY);
                    lineY += 4;
                });

                y += cardHeight + 4;
            });
            y += 2;
        }

        // Charts/Images
        if (reportData.images && reportData.images.length > 0) {
            for (const img of reportData.images) {
                if (y > 240) { doc.addPage(); y = 20; }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(...primary);
                doc.text(img.title, 14, y);
                y += 4;
                doc.addImage(img.image, 'PNG', 14, y, 180, 90);
                y += 100;
            }
        }

        // Tables
        if (reportData.tables && reportData.tables.length > 0) {
            for (const table of reportData.tables) {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(...primary);
                doc.text(table.title, 14, y);
                y += 4;
                autoTable(doc, {
                    startY: y,
                    head: [table.headers],
                    body: table.rows,
                    theme: 'striped',
                    headStyles: { fillColor: primary, textColor: 255, fontStyle: 'bold', fontSize: 8 },
                    styles: { fontSize: 8, cellPadding: 2, valign: 'middle', overflow: 'linebreak' },
                    alternateRowStyles: { fillColor: lightBg },
                    margin: { left: 14, right: 14 }
                });
                y = doc.lastAutoTable.finalY + 10;
            }
        }

        const pdfBuffer = doc.output('arraybuffer');

        const smtpConfig = {
            host: process.env.SMTP_HOST || 'mail.drjpogalo.co.ke',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER || 'accounts@drjpogalo.co.ke',
                pass: process.env.SMTP_PASS || 'accounts@drjp!',
            },
        };

        const transporter = nodemailer.createTransport(smtpConfig);

        const info = await transporter.sendMail({
            from: `"Dr. JP Reports" <${smtpConfig.auth.user}>`,
            to: recipients.join(', '),
            subject: subjectLine,
            text: `Please find attached the requested report. ${periodText}`,
            attachments: [
                {
                    filename: `report_${Date.now()}.pdf`,
                    content: Buffer.from(pdfBuffer),
                },
            ],
        });

        console.log('Email sent:', info.messageId);
        res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('❌ send-report error:', error);
        res.status(500).json({ error: 'Failed to send email: ' + error.message });
    }
}