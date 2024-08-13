import { jsPDF } from 'jspdf';
// import QRCode from 'qrcode';


const drawTicket = (pdf, ticket, qrDataUrl, startX, startY, ticketWidth, ticketHeight, amount, totalTickets) => {
    // Draw background (gradient approximation)
    const gradientColors = [
        { r: 20, g: 184, b: 166 },  // teal-500
        { r: 8, g: 145, b: 178 }    // cyan-600
    ];
    for (let i = 0; i < ticketWidth; i++) {
        const t = i / ticketWidth;
        const r = Math.round(gradientColors[0].r * (1 - t) + gradientColors[1].r * t);
        const g = Math.round(gradientColors[0].g * (1 - t) + gradientColors[1].g * t);
        const b = Math.round(gradientColors[0].b * (1 - t) + gradientColors[1].b * t);
        pdf.setDrawColor(r, g, b);
        pdf.setFillColor(r, g, b);
        pdf.rect(startX + i, startY, 1, ticketHeight, 'F');
    }

    // Add rounded corners (approximation)
    pdf.setDrawColor(255, 255, 255);
    pdf.setFillColor(255, 255, 255);
    const cornerRadius = 5;
    pdf.circle(startX, startY, cornerRadius, 'F');
    pdf.circle(startX + ticketWidth, startY, cornerRadius, 'F');
    pdf.circle(startX, startY + ticketHeight, cornerRadius, 'F');
    pdf.circle(startX + ticketWidth, startY + ticketHeight, cornerRadius, 'F');

    // Column 1
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Type: ${ticket.class}`, startX + 10, startY + 32);

    pdf.setFontSize(24);
    pdf.text("TICKET FLIX", startX + 10, startY + 40);

    pdf.setFillColor(79, 70, 229); // indigo-600
    pdf.roundedRect(startX + 10, startY + 50, ticketWidth * 0.3, 15, 7.5, 7.5, 'F');
    pdf.setFontSize(12);
    pdf.text(`Amount: Rs.${amount.toFixed(2)}`, startX + 17, startY + 59);

    // Add total amount and ticket count
    // pdf.setFontSize(8);
    // pdf.text(`Total: ${amount} Rs.(${totalTickets} tickets)`, startX + 15, startY + 70);

    // Column 2
    const column2X = startX + ticketWidth * 0.4;
    const column2Width = ticketWidth * 0.3;
    const labelFontSize = 8;
    const contentFontSize = 10;
    const boxHeight = 18;
    const spaceBetweenBoxes = 10;

    // Coupon Code
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(labelFontSize);
    pdf.text("Coupon Code", column2X, startY + 23); //22

    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(column2X, startY + 24, column2Width, boxHeight, 3, 3, 'F');

    pdf.setTextColor(0, 128, 128);
    pdf.setFontSize(contentFontSize);
    const couponCode = ticket.coupon_code
    const couponCodeY = startY + 23 + (boxHeight / 2) + (contentFontSize / 4);
    pdf.text(couponCode, column2X + 5, couponCodeY);

    // Executive ID
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(labelFontSize);
    pdf.text("Executive ID", column2X, startY + 20 + boxHeight + spaceBetweenBoxes);

    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(column2X, startY + 23 + boxHeight + spaceBetweenBoxes, column2Width, boxHeight, 3, 3, 'F');

    pdf.setTextColor(0, 128, 128);
    pdf.setFontSize(contentFontSize);
    const executiveCode = ticket.executiveCode;
    const executiveCodeY = startY + 23 + boxHeight + spaceBetweenBoxes + (boxHeight / 2) + (contentFontSize / 4);
    pdf.text(ticket.executiveCode, column2X + 5, executiveCodeY + 3);

    // Add a clipping mask to prevent text overflow
    pdf.saveGraphicsState();
    pdf.rect(column2X + 5, startY + 23, column2Width - 10, boxHeight, 'S');
    pdf.clip();
    pdf.text(couponCode, column2X + 5, couponCodeY);
    pdf.restoreGraphicsState();

    pdf.saveGraphicsState();
    pdf.rect(column2X + 5, startY + 23 + boxHeight + spaceBetweenBoxes, column2Width - 10, boxHeight, 'S');
    pdf.clip();
    pdf.text(executiveCode, column2X + 5, executiveCodeY);
    pdf.restoreGraphicsState();
    
    // Column 3 (QR Code)
    const qrSize = ticketHeight * 0.7;
    pdf.addImage(qrDataUrl, 'PNG', startX + ticketWidth - qrSize - 20, startY + (ticketHeight - qrSize) / 2, qrSize, qrSize);

    // // Add ticket number out of total
    // pdf.setTextColor(255, 255, 255);
    // pdf.setFontSize(10);
    // pdf.text(`Ticket ${ticket.ticketNumber} of ${totalTickets}`, startX + ticketWidth - 60, startY + ticketHeight - 10);

    // Add shadow effect (approximation)
    pdf.setDrawColor(0, 0, 0);
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({opacity: 0.1}));
    pdf.roundedRect(startX + 2, startY + 2, ticketWidth, ticketHeight, 5, 5, 'F');
    pdf.setGState(new pdf.GState({opacity: 1}));
};

const generatePDF = (ticketsWithQR, totalAmount, setPdfUrl) => {
    const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const ticketWidth = pageWidth - 2 * margin;
    const ticketHeight = 80; // Fixed height for each ticket
    const ticketsPerPage = Math.floor((pageHeight - 2 * margin) / (ticketHeight + margin));

    const totalTickets = ticketsWithQR.length;

    ticketsWithQR.forEach((item, index) => {
        // const pageIndex = Math.floor(index / ticketsPerPage);
        const ticketIndex = index % ticketsPerPage;

        if (ticketIndex === 0 && index > 0) {
            pdf.addPage();
        }

        const startX = margin;
        const startY = margin + ticketIndex * (ticketHeight + margin);

        // Add ticket number to the ticket object
        item.ticket.ticketNumber = index + 1;

        drawTicket(pdf, item.ticket, item.qrDataUrl, startX, startY, ticketWidth, ticketHeight, totalAmount, totalTickets);
    });

    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfUrl(pdfUrl);
};

export default generatePDF