const PDFDocument = require("pdfkit");

module.exports = function generateInvoice({
  orderId,
  paymentId,
  amount,
  currency,
  username,
}) {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.text(`Customer: ${username}`);
    doc.text(`Order ID: ${orderId}`);
    doc.text(`Payment ID: ${paymentId}`);
    doc.text(`Amount: ₹${amount / 100} ${currency}`);
    doc.text(`Status: Paid`);

    doc.end();
  });
};