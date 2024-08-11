import React, { useState, useEffect } from 'react';
import { collection, updateDoc, doc, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { sha256 } from 'js-sha256';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';


function QRCodeGenerator() {
    const [numCoupons, setNumCoupons] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [amountPaid, setAmountPaid] = useState('');
    const [executiveId, setExecutiveId] = useState('');
    const [tickets, setTickets] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [executives, setExecutives] = useState([]);

    useEffect(() => {
        const fetchExecutives = async () => {
            const executivesRef = collection(firestore, 'executives');
            const executivesSnapshot = await getDocs(executivesRef);
            const executivesList = executivesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExecutives(executivesList);
        };

        fetchExecutives();
    }, []);

    const hashCode = (code) => {
        return sha256(code);
    };

    const generateQRCode = async (hashedCode) => {
        return await QRCode.toDataURL(hashedCode);
    };

    const saveQRCodeToStorage = async (qrDataUrl, ticketId) => {
        const storageRef = ref(storage, `qrcodes/${ticketId}.png`);
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    };

    const updateFirestoreWithQRCodeUrl = async (ticketId, qrCodeUrl) => {
        const ticketRef = doc(firestore, 'tickets', ticketId);
        await updateDoc(ticketRef, { qrCodeUrl });
    };

    const drawTicket = (pdf, ticket, qrDataUrl, startX, startY, ticketWidth, ticketHeight, totalAmount, totalTickets) => {
        // Calculate individual ticket amount
        const ticketAmount = (totalAmount / totalTickets).toFixed(2);

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
        pdf.text(`Type: ${ticket.class}`, startX + 10, startY + 20);
    
        pdf.setFontSize(24);
        pdf.text("TICKET FLIX", startX + 10, startY + 40);
    
        pdf.setFillColor(79, 70, 229); // indigo-600
        pdf.roundedRect(startX + 10, startY + 50, ticketWidth * 0.3, 15, 7.5, 7.5, 'F');
        pdf.setFontSize(12);
        pdf.text(`Amount: ${ticketAmount} Rs.`, startX + 15, startY + 60);

        // Add total amount and ticket count
        pdf.setFontSize(8);
        pdf.text(`Total: ${totalAmount} Rs.(${totalTickets} tickets)`, startX + 15, startY + 70);
    
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
        pdf.text("Coupon Code", column2X, startY + 20);

        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(column2X, startY + 23, column2Width, boxHeight, 3, 3, 'F');

        pdf.setTextColor(0, 128, 128);
        pdf.setFontSize(contentFontSize);
        const couponCode = ticket.coupon_code;
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
        pdf.text(executiveCode, column2X + 5, executiveCodeY);

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
    
        // Add ticket number out of total
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.text(`Ticket ${ticket.ticketNumber} of ${totalTickets}`, startX + ticketWidth - 60, startY + ticketHeight - 10);

        // Add shadow effect (approximation)
        pdf.setDrawColor(0, 0, 0);
        pdf.setFillColor(0, 0, 0);
        pdf.setGState(new pdf.GState({opacity: 0.1}));
        pdf.roundedRect(startX + 2, startY + 2, ticketWidth, ticketHeight, 5, 5, 'F');
        pdf.setGState(new pdf.GState({opacity: 1}));
    };

    const generatePDF = (ticketsWithQR, totalAmount) => {
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
            const pageIndex = Math.floor(index / ticketsPerPage);
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

    const createNewTicket = async (amt, exec) => {
        try {
            const couponsRef = collection(firestore, 'coupon');
            const newCoupon = {
                'amount-paid': amt,
                'coupon_code': `FREE${Math.random().toString(36).substring(7).toUpperCase()}`,
                'show-id': '',
                'ticket-id': `T${Math.random().toString(36).substring(7).toUpperCase()}`,
                'user-id': '',
                'executiveId': exec,
                'class': 'Standard' // Added class field
            };

            const docRef = await addDoc(couponsRef, newCoupon);
            return { id: docRef.id, ...newCoupon };

        } catch (error) {
            console.error("Error adding document: ", error);
            throw new Error('Failed to create new coupon. Please try again later.');
        }
    };

    const processCoupons = async () => {
        setIsGenerating(true);
        const processedTickets = [];

        try {
            const newTicketsNeeded = Math.max(0, parseInt(numCoupons) - tickets.length);
            const newTickets = [];
            for (let i = 0; i < newTicketsNeeded; i++) {
                const newTicket = await createNewTicket(amountPaid, executiveId);
                newTickets.push(newTicket);
            }
            setCoupons(prevCoupons => [...prevCoupons, ...newCoupons]);

            for (let i = 0; i < parseInt(numCoupons); i++) {
                const coupon = newCoupons[i];
                if (!coupon) {
                    console.error(`Coupon at index ${i} is undefined`);
                    continue;
                }
                const hashedCode = hashCode(coupon.coupon_code);
                const urlCode = encodeURIComponent(hashedCode + coupon.id);
                const couponURL = `https://www.ticketflix.com/coupon/view/${urlCode}`;
                const qrDataUrl = await generateQRCode(couponURL);
                const storageUrl = await saveQRCodeToStorage(qrDataUrl, coupon.id);
                await updateFirestoreWithQRCodeUrl(coupon.id, storageUrl);
                processedCoupons.push({ coupon, qrDataUrl });
            }

            generatePDF(processedTickets);
        } catch (error) {
            console.error("Error processing coupons:", error);
            alert("An error occurred while processing coupons. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isNaN(parseFloat(amountPaid)) || !executiveCode || !numCoupons || !ticketType) {
            alert('Please provide valid inputs for all fields.');
            return;
        }
        await processCoupons();
    };

    return (
        <div>
            <Header />
            <div style={{ padding: '60px 20px' }}>
                <input
                    type="number"
                    value={numCoupons}
                    onChange={(e) => setNumCoupons(e.target.value)}
                    placeholder="Number of coupons"
                    style={{ marginBottom: '10px', display: 'block', width: '100%', padding: '8px' }}
                />
                <input
                    type="number"
                    id="amountPaid"
                    placeholder='Amount Paid'
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    required
                    style={{ marginBottom: '10px', display: 'block', width: '100%', padding: '8px' }}
                />
                <select
                    id="executiveCode"
                    value={executiveCode}
                    onChange={(e) => setExecutiveCode(e.target.value)}
                    required
                    style={{ marginBottom: '10px', display: 'block', width: '100%', padding: '8px' }}
                >
                    <option value="">Select an Executive</option>
                    {executives.map((executive) => (
                        <option key={executive.executiveCode} value={executive.executiveCode}>
                            {executive.name} ({executive.executiveCode})
                        </option>
                    ))}
                </select>
                <select
                    id="ticketType"
                    value={ticketType}
                    onChange={(e) => setTicketType(e.target.value)}
                    required
                    style={{ marginBottom: '10px', display: 'block', width: '100%', padding: '8px' }}
                />
                <button 
                    onClick={handleSubmit} 
                    disabled={isGenerating}
                    style={{ marginBottom: '10px', display: 'block', width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    {isGenerating ? 'Generating...' : 'Generate QR Codes'}
                </button>
                {pdfUrl && (
                    <a
                        href={pdfUrl}
                        download="qr_codes.pdf"
                        style={{ display: 'block', textAlign: 'center', padding: '10px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px' }}
                    >
                        Download QR Codes PDF
                    </a>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default QRCodeGenerator;