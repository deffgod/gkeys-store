import PDFDocument from 'pdfkit';
import { UserDetailsResponse } from '../types/admin.js';

/**
 * Generate PDF report for user summary
 * @param userData - User details including orders and transactions
 * @returns PDF buffer
 */
export const generateUserSummaryPDF = async (userData: UserDetailsResponse): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (error) => {
        reject(error);
      });

      // Header
      doc.fontSize(20).text('GKEYS Store - User Summary Report', { align: 'center' });
      doc.moveDown();

      // User Information Section
      doc.fontSize(16).text('User Information', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Email: ${userData.email}`);
      doc.text(`Nickname: ${userData.nickname}`);
      if (userData.firstName || userData.lastName) {
        doc.text(`Name: ${userData.firstName || ''} ${userData.lastName || ''}`.trim());
      }
      doc.text(`Balance: €${userData.balance.toFixed(2)}`);
      doc.text(`Role: ${userData.role}`);
      doc.text(`Registered: ${new Date(userData.createdAt).toLocaleDateString()}`);
      doc.moveDown();

      // Top-ups Section
      const topUps = userData.transactions.filter((t) => t.type === 'TOP_UP');
      if (topUps.length > 0) {
        doc.fontSize(16).text('Top-up History', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text('Date', 50, doc.y, { continued: true, width: 100 });
        doc.text('Amount', { continued: true, width: 100 });
        doc.text('Status', { width: 100 });
        doc.moveDown(0.3);
        doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.3);

        topUps.forEach((transaction) => {
          const date = new Date(transaction.createdAt).toLocaleDateString();
          const amount = `€${transaction.amount.toFixed(2)}`;
          doc.text(date, 50, doc.y, { continued: true, width: 100 });
          doc.text(amount, { continued: true, width: 100 });
          doc.text(transaction.status, { width: 100 });
          doc.moveDown(0.3);
        });

        const totalTopUps = topUps.reduce((sum, t) => sum + t.amount, 0);
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Total Top-ups: €${totalTopUps.toFixed(2)}`, { align: 'right' });
        doc.moveDown();
      }

      // Orders Section
      if (userData.orders.length > 0) {
        doc.fontSize(16).text('Order History', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.text('Order ID', 50, doc.y, { continued: true, width: 120 });
        doc.text('Date', { continued: true, width: 100 });
        doc.text('Total', { continued: true, width: 100 });
        doc.text('Status', { width: 100 });
        doc.moveDown(0.3);
        doc.strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.3);

        userData.orders.forEach((order) => {
          const date = new Date(order.createdAt).toLocaleDateString();
          const total = `€${order.total.toFixed(2)}`;
          const orderId = order.id.substring(0, 8) + '...';
          doc.text(orderId, 50, doc.y, { continued: true, width: 120 });
          doc.text(date, { continued: true, width: 100 });
          doc.text(total, { continued: true, width: 100 });
          doc.text(order.status, { width: 100 });
          doc.moveDown(0.3);
        });

        const totalOrders = userData.orders.reduce((sum, o) => sum + o.total, 0);
        doc.moveDown(0.5);
        doc.fontSize(12).text(`Total Orders: €${totalOrders.toFixed(2)}`, { align: 'right' });
        doc.moveDown();
      }

      // Footer
      doc
        .fontSize(8)
        .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, {
          align: 'center',
        });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
