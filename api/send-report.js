// api/send-report.js
import nodemailer from 'nodemailer';
import jsPDF from 'jspdf';
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

    try {
        // Generate PDF
        const doc = new jsPDF('p', 'mm', 'a4');
        const now = new Date().toLocaleString('en-KE', {
            dateStyle: 'full',
            timeStyle: 'short',
            timeZone: 'Africa/Nairobi'
        });
        let y = 20;

        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('DR. JP OGALO CLINIC - REPORT', 14, 12);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${now}`, 14, 19);
        doc.text(`Report Type: ${reportType}`, 14, 26);
        y = 40;

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.text('Summary:', 14, y);
        y += 6;
        doc.setFontSize(9);
        if (reportData.summary) {
            Object.entries(reportData.summary).forEach(([key, value]) => {
                doc.text(`${key}: ${value}`, 14, y);
                y += 4;
            });
        }

        if (reportData.tables && reportData.tables.length > 0) {
            for (const table of reportData.tables) {
                if (y > 250) {
                    doc.addPage();
                    y = 20;
                }
                doc.setFontSize(12);
                doc.text(table.title, 14, y);
                y += 6;
                autoTable(doc, {
                    startY: y,
                    head: [table.headers],
                    body: table.rows,
                    theme: 'striped',
                    headStyles: { fillColor: [30, 41, 59], textColor: 255 },
                    styles: { fontSize: 8 },
                    margin: { left: 14, right: 14 }
                });
                y = doc.lastAutoTable.finalY + 8;
            }
        }

        const pdfBuffer = doc.output('arraybuffer');

        // SMTP configuration
        const smtpConfig = {
            host: process.env.SMTP_HOST || 'mail.drjpogalo.co.ke',
            port: Number(process.env.SMTP_PORT) || 465,
            secure: true,
            auth: {
                user: process.env.SMTP_USER || 'accounts@drjpogalo.co.ke',
                pass: process.env.SMTP_PASS || 'accounts@drjp!',
            },
        };

        console.log('SMTP config:', {
            host: smtpConfig.host,
            port: smtpConfig.port,
            user: smtpConfig.auth.user,
        });

        const transporter = nodemailer.createTransport(smtpConfig);

        const info = await transporter.sendMail({
            from: `"Dr. JP Reports" <${smtpConfig.auth.user}>`,
            to: recipients.join(', '),
            subject: `${reportType} - ${new Date().toLocaleDateString('en-KE', { timeZone: 'Africa/Nairobi' })}`,
            text: 'Please find attached the requested report.',
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
        res.status(500).json({
            error: 'Failed to send email: ' + error.message,
            stack: error.stack,
        });
    }
}