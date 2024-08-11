import React, { useState, useEffect } from 'react';
import { collection, updateDoc, doc, addDoc } from 'firebase/firestore';
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
    const [appLogo, setAppLogo] = useState(null);

    const logoUrl = "https://firebasestorage.googleapis.com/v0/b/movie-campaign.appspot.com/o/ticketflix-high-resolution-logo.png?alt=media&token=806c6054-f2d1-449e-80a6-690bde74134f";

    useEffect(() => {
        // Load app logo
        fetch(logoUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.blob();
            })
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => setAppLogo(reader.result);
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error("Error loading app logo:", error);
                // Set a default logo or handle the error as needed
            });
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

    const drawTicket = (pdf, ticket, qrDataUrl) => {
        // Set up dimensions
        const ticketWidth = 180;
        const ticketHeight = 80;
        const leftWidth = 130;
        const rightWidth = 50;
        const margin = 10;

        // Draw outer border
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, margin, ticketWidth, ticketHeight);

        // Draw left side
        pdf.setFillColor(255, 191, 0);
        pdf.rect(margin, margin, leftWidth, ticketHeight, 'F');

        // Draw right side (white background)
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin + leftWidth, margin, rightWidth, ticketHeight, 'F');

        // Add content to left side
        pdf.setFontSize(12);
        pdf.setTextColor(0);
        pdf.text(`Ticket ID: ${ticket['ticket-id']}`, margin + 5, margin + 15);
        pdf.text(`Class: ${ticket['class'] || 'Standard'}`, margin + 5, margin + 25);
        pdf.text(`Number of Tickets: ${numCoupons}`, margin + 5, margin + 35);
        pdf.text(`Amount Paid: ${ticket['amount-paid']}`, margin + 5, margin + 45);

        // Add app logo
        if (appLogo) {
            pdf.addImage(appLogo, 'PNG', margin + 5, margin + 55, 40, 20);
        }

        // Add QR code to right side
        const qrSize = 40;
        const qrMargin = (rightWidth - qrSize) / 2;
        pdf.addImage(qrDataUrl, 'PNG', margin + leftWidth + qrMargin, margin + (ticketHeight - qrSize) / 2, qrSize, qrSize);

        // Draw dividing line
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.5);
        pdf.line(margin + leftWidth, margin, margin + leftWidth, margin + ticketHeight);

        // Add decorative circles
        [0.2, 0.4, 0.6, 0.8].forEach(y => {
            pdf.setFillColor(255, 255, 255);
            pdf.circle(margin + leftWidth, margin + y * ticketHeight, 3, 'F');
            pdf.setDrawColor(0);
            pdf.circle(margin + leftWidth, margin + y * ticketHeight, 3, 'S');
        });
    };

    const generatePDF = (ticketsWithQR) => {
        const pdf = new jsPDF({
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        });

        ticketsWithQR.forEach((item, index) => {
            if (index > 0) {
                pdf.addPage();
            }
            drawTicket(pdf, item.ticket, item.qrDataUrl);
        });

        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
    };

    const createNewTicket = async (amt, exec) => {
        try {
            const ticketsRef = collection(firestore, 'tickets');
            const newTicket = {
                'amount-paid': amt,
                'coupon_code': `FREE${Math.random().toString(36).substring(7).toUpperCase()}`,
                'show-id': '',
                'ticket-id': `T${Math.random().toString(36).substring(7).toUpperCase()}`,
                'user-id': '',
                'executiveId': exec,
                'class': 'Standard' // Added class field
            };

            const docRef = await addDoc(ticketsRef, newTicket);
            return { id: docRef.id, ...newTicket };

        } catch (error) {
            console.error("Error adding document: ", error);
            throw new Error('Failed to create new ticket. Please try again later.');
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
            setTickets(prevTickets => [...prevTickets, ...newTickets]);

            for (let i = 0; i < parseInt(numCoupons); i++) {
                const ticket = newTickets[i];
                if (!ticket) {
                    console.error(`Ticket at index ${i} is undefined`);
                    continue;
                }
                const hashedCode = hashCode(ticket.coupon_code);
                const urlCode = encodeURIComponent(hashedCode + ticket.id);
                const ticketURL = `https://www.ticketflix.com/ticket/view/${urlCode}`;
                const qrDataUrl = await generateQRCode(ticketURL);
                const storageUrl = await saveQRCodeToStorage(qrDataUrl, ticket.id);
                await updateFirestoreWithQRCodeUrl(ticket.id, storageUrl);
                processedTickets.push({ ticket, qrDataUrl });
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
        if (isNaN(parseFloat(amountPaid)) || !executiveId || !numCoupons) {
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
                <input
                    type="text"
                    id="executiveId"
                    placeholder='Executive ID'
                    value={executiveId}
                    onChange={(e) => setExecutiveId(e.target.value)}
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