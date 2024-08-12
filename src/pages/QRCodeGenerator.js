import React, { useState, useEffect } from 'react';
import { collection, updateDoc, doc, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { sha256 } from 'js-sha256';
import QRCode from 'qrcode';
import generatePDF from '../utils/couponPDF'


function QRCodeGenerator() {
    const [numCoupons, setNumCoupons] = useState('');
    const [pdfUrl, setPdfUrl] = useState(null);
    const [amount, setAmount] = useState('');
    const [executiveCode, setExecutiveCode] = useState('');
    const [couponType, setCouponType] = useState('');
    const [coupons, setCoupons] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [executives, setExecutives] = useState([]);

    const fetchExecutives = async () => {
        const executivesRef = collection(firestore, 'executives');
        const executivesSnapshot = await getDocs(executivesRef);
        const executivesList = executivesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setExecutives(executivesList);
    };
    useEffect(() => { fetchExecutives() }, []);

    const processCoupons = async () => {
        setIsGenerating(true);
        const processedCoupons = [];
        const couponAmount = parseFloat(amount);

        try {
            const newCouponsCount = Math.max(0, parseInt(numCoupons) - coupons.length);
            const newCoupons = [];
            for (let i = 0; i < newCouponsCount; i++) {
                const newCoup = await createNewCoupon(amount, executiveCode, couponType);
                newCoupons.push(newCoup);
                console.log(newCoup)
            }
            setCoupons(prevCoup => [...prevCoup, ...newCoupons]);

            for (let i = 0; i < parseInt(numCoupons); i++) {
                const coup = newCoupons[i];
                if (!coup) {
                    console.error(`Ticket at index ${i} is undefined`);
                    continue;
                }
                const hashedCode = sha256(coup.coupon_code);
                const urlCode = encodeURIComponent(hashedCode + coup.id);
                const couponURL = `https://www.ticketflix.in/ticket/view/${urlCode}`;
                const qrDataUrl = await QRCode.toDataURL(couponURL);
                await saveQRCodeToStorage(qrDataUrl, coup.id);
                // await updateFirestoreWithQRCodeUrl(ticket.id, storageUrl);
                processedCoupons.push({ ticket: coup, qrDataUrl });
            }
            generatePDF(processedCoupons, couponAmount, setPdfUrl);
        } catch (error) {
            console.error("Error processing coupons:", error);
            alert("An error occurred while processing coupons. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (isNaN(parseFloat(amount)) || !executiveCode || !numCoupons || !couponType) {
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
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
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
                    value={couponType}
                    onChange={(e) => setCouponType(e.target.value)}
                    required
                    style={{ marginBottom: '10px', display: 'block', width: '100%', padding: '8px' }}
                >
                    <option value="">Select Ticket Type</option>
                    <option value="Standard">Standard</option>
                    <option value="Luxury">Luxury</option>
                </select>
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

const saveQRCodeToStorage = async (qrDataUrl, couponId) => {
    const storageRef = ref(storage, `qrcodes/${couponId}.png`);
    const response = await fetch(qrDataUrl);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    const qrCodeUrl = await getDownloadURL(storageRef);
    const couponRef = doc(firestore, 'coupon', couponId);
    await updateDoc(couponRef, { qrCodeUrl });
};

const createNewCoupon = async (amt, execCode, type) => {
    try {
        const couponRef = collection(firestore, 'coupon');
        const newCoupon = {
            // FIXEME: field names
            'amount-paid': amt,
            'coupon_code': `FREE${Math.random().toString(36).substring(7).toUpperCase()}`,
            'user-id': '',
            'executiveCode': execCode,
            'class': type
        };

        const docRef = await addDoc(couponRef, newCoupon);
        return { id: docRef.id, ...newCoupon };

    } catch (error) {
        console.error("Error adding document: ", error);
        throw new Error('Failed to create new ticket. Please try again later.');
    }
};

export default QRCodeGenerator;