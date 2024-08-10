import React, { useState } from 'react';

import { collection, updateDoc, doc, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { addDoc, Timestamp } from 'firebase/firestore';
import { firestore, storage } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { sha256 } from 'js-sha256';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';


function QRCodeGenerator() {
    const [numCoupons, setNumCoupons] = useState(null);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [amountPaid, setAmountPaid] = useState('');
    const [executiveId, setExecutiveId] = useState('');
    const [tickets, setTickets] = useState([]);

    // Function to fetch codes from Firestore
    // const fetchCodesFromFirestore = async () => {
    //     const ticketsRef = collection(firestore, 'tickets');
    //     const snapshot = await getDocs(ticketsRef);
    //     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // };

    // Function to hash the movie code
    const hashCode = (code) => {
        return sha256(code);
    };

    // Function to generate QR code
    const generateQRCode = async (hashedCode) => {
        return await QRCode.toDataURL(hashedCode);
    };

    // Function to save QR code to Firebase Storage
    const saveQRCodeToStorage = async (qrDataUrl, ticketId) => {
        const storageRef = ref(storage, `qrcodes/${ticketId}.png`);
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    };

    // Function to update Firestore document with QR code URL
    const updateFirestoreWithQRCodeUrl = async (ticketId, qrCodeUrl) => {
        const ticketRef = doc(firestore, 'tickets', ticketId);
        await updateDoc(ticketRef, { qrCodeUrl });
    };

    // Function to generate PDF file with all QR codes
    const generatePDF = async (qrCodes) => {
        const pdf = new jsPDF();
        let yOffset = 10;

        for (let i = 0; i < qrCodes.length; i++) {
            if (i > 0 && i % 4 === 0) {
                pdf.addPage();
                yOffset = 10;
            }

            pdf.addImage(qrCodes[i].qrDataUrl, 'PNG', 10, yOffset, 50, 50);
            pdf.text(`Ticket ID: ${qrCodes[i].ticketId}`, 70, yOffset + 25);
            yOffset += 60;
        }

        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
    };

    // Function to create a new ticket document with error handling
    const createNewTicket = async (amt, exec) => {
        try {
            const ticketsRef = collection(firestore, 'tickets');
            const newTicket = {
                'amount-paid': amt,
                'coupon_code': `FREE${Math.random().toString(36).substring(7).toUpperCase()}`,
                'show-id': '',
                'ticket-id': `T${Math.random().toString(36).substring(7).toUpperCase()}`,
                'user-id': '',
                'executiveId': exec
            };

            const docRef = await addDoc(ticketsRef, newTicket);
            return { id: docRef.id, ...newTicket };

        } catch (error) {
            console.error("Error adding document: ", error);
            throw new Error('Failed to create new ticket. Please try again later.');
        }
    };


    // Main function to process coupons
    const processCoupons = async () => {
        const processedTickets = [];

        // Create new tickets if needed
        const newTicketsNeeded = Math.max(0, numCoupons - tickets.length);
        const newTickets = [];
        for (let i = 0; i < newTicketsNeeded; i++) {
            const newTicket = await createNewTicket(amountPaid, executiveId);
            newTickets.push(newTicket);
        }
        setTickets(prevTickets => [...prevTickets, ...newTickets]);

        // Process all tickets
        for (let i = 0; i < numCoupons; i++) {
            try {
                const ticket = newTickets[i];
                const hashedCode = hashCode(ticket.coupon_code);
                const urlCode = encodeURIComponent(hashedCode + ticket.id); // Encode URL component
                const ticketURL = `https://www.ticketflix.com/ticket/view/${urlCode}`;
                const qrDataUrl = await generateQRCode(ticketURL);
                const storageUrl = await saveQRCodeToStorage(qrDataUrl, ticket.id);
                await updateFirestoreWithQRCodeUrl(ticket.id, storageUrl);
                processedTickets.push({ ticketId: ticket.id, qrDataUrl });
            } catch (error) {
                console.error(`Error processing ticket ${i}:`, error);
            }
        }
        

        await generatePDF(processedTickets);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isNaN(parseFloat(amountPaid)) || !executiveId) {
            alert('Please provide valid inputs.');
            return;
        }
        await processCoupons();
    };

    return (
        <div>
            <Header />
            <div style={{ paddingTop: '60px' }}>
                <input
                    type="number"
                    value={numCoupons}
                    onChange={(e) => setNumCoupons(parseInt(e.target.value))}
                    placeholder="Number of coupons"
                />
                <br />
                <label />
                <input
                    type="number"
                    id="amountPaid"
                    placeholder='Amount Paid'
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    required
                />
                <br />
                <label />
                <input
                    type="text"
                    id="executiveId"
                    placeholder='Executive ID'
                    value={executiveId}
                    onChange={(e) => setExecutiveId(e.target.value)}
                    required
                />
                <br /><br />
                <button onClick={handleSubmit}>Generate QR Codes</button>
                {pdfUrl && (
                    <br><a href={pdfUrl} download="qr_codes.pdf">Download QR Codes PDF</a></br>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default QRCodeGenerator;