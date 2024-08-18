import React, { useState, useEffect, useContext } from "react";
import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  runTransaction,
  serverTimestamp  
} from "firebase/firestore";
import QRCode from "qrcode";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../../firebase";
import { sha256 } from "js-sha256";
import { jsPDF } from "jspdf";
import { AuthContext } from "../../context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

function CouponGeneration() {
  const [numCoupons, setNumCoupons] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [couponAmount, setCouponAmount] = useState("");
  const [executiveCode, setExecutiveCode] = useState("");
  const [coupons, setCoupons] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [allowExecutiveAccess, setAllowExecutiveAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchExecutiveData = async () => {
      if (user) {
        try {
          const executivesRef = collection(firestore, "executives");
          const q = query(executivesRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const executiveData = querySnapshot.docs[0].data();
            setExecutiveCode(executiveData.executiveCode);
            setAllowExecutiveAccess(executiveData.allow_executive_access);
          } else {
            throw new Error("Executive data not found");
          }
        } catch (error) {
          console.error("Error fetching executive data:", error);
          alert("Failed to fetch executive data. Please try again or contact support.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchExecutiveData();
  }, [user]);

  const saveQRCodeToStorage = async (qrDataUrl, ticketId) => {
    try {
      const storageRef = ref(storage, `qrcodes/${ticketId}.png`);
      const response = await fetch(qrDataUrl);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error saving QR code to storage:", error);
      throw new Error("Failed to save QR code. Please try again.");
    }
  };

  const updateFirestoreWithQRCodeUrl = async (ticketId, qrCodeUrl) => {
    try {
      const couponDoc = doc(firestore, "coupons", ticketId);
      await updateDoc(couponDoc, { qrCodeUrl });
    } catch (error) {
      console.error("Error updating Firestore with QR code URL:", error);
      throw new Error("Failed to update coupon with QR code URL. Please try again.");
    }
  };

  const drawTicket = (
    pdf,
    ticket,
    qrDataUrl,
    startX,
    startY,
    ticketWidth,
    ticketHeight
  ) => {
    // Draw background (gradient approximation)
    const gradientColors = [
      { r: 20, g: 184, b: 166 }, // teal-500
      { r: 8, g: 145, b: 178 }, // cyan-600
    ];
    for (let i = 0; i < ticketWidth; i++) {
      const t = i / ticketWidth;
      const r = Math.round(
        gradientColors[0].r * (1 - t) + gradientColors[1].r * t
      );
      const g = Math.round(
        gradientColors[0].g * (1 - t) + gradientColors[1].g * t
      );
      const b = Math.round(
        gradientColors[0].b * (1 - t) + gradientColors[1].b * t
      );
      pdf.setDrawColor(r, g, b);
      pdf.setFillColor(r, g, b);
      pdf.rect(startX + i, startY, 1, ticketHeight, "F");
    }

    // Add rounded corners (approximation)
    pdf.setDrawColor(255, 255, 255);
    pdf.setFillColor(255, 255, 255);
    const cornerRadius = 5;
    pdf.circle(startX, startY, cornerRadius, "F");
    pdf.circle(startX + ticketWidth, startY, cornerRadius, "F");
    pdf.circle(startX, startY + ticketHeight, cornerRadius, "F");
    pdf.circle(startX + ticketWidth, startY + ticketHeight, cornerRadius, "F");

    // Column 1
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(255, 255, 255);
    pdf.text("TICKET FLIX", startX + 10, startY + 40);

    pdf.setFillColor(79, 70, 229); // indigo-600
    pdf.roundedRect(startX + 10, startY + 50, ticketWidth * 0.3, 15, 6, 6, "F");
    pdf.setFontSize(12);
    pdf.text(`Amount: Rs. ${ticket["amount-paid"]}`, startX + 15, startY + 59);

    // Column 2
    const column2X = startX + ticketWidth * 0.38;
    pdf.setFontSize(10);
    pdf.text("Coupon Code", column2X, startY + 18.5);
    pdf.setFillColor(255, 255, 255);
    pdf.setTextColor(0, 128, 128);
    pdf.roundedRect(
      column2X,
      startY + 21.3,
      ticketWidth * 0.3 - 20,
      15,
      3,
      3,
      "F"
    );
    pdf.setFontSize(12);
    pdf.text(ticket.coupon_code, column2X + 4, startY + 30.4);

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text("Executive ID", column2X, startY + 49.5);
    pdf.setFillColor(255, 255, 255);
    pdf.setTextColor(0, 128, 128);
    pdf.roundedRect(
      column2X,
      startY + 52,
      ticketWidth * 0.3 - 20,
      15,
      3,
      3,
      "F"
    );
    pdf.setFontSize(12);
    pdf.text(ticket.executiveCode, column2X + 4, startY + 61.25);

    // Column 3 (QR Code)
    const qrSize = ticketHeight * 0.7;
    pdf.addImage(
      qrDataUrl,
      "PNG",
      startX + ticketWidth - qrSize - 10,
      startY + (ticketHeight - qrSize) / 2,
      qrSize,
      qrSize
    );

    // Add shadow effect (approximation)
    pdf.setDrawColor(0, 0, 0);
    pdf.setFillColor(0, 0, 0);
    pdf.setGState(new pdf.GState({ opacity: 0.1 }));
    pdf.roundedRect(
      startX + 2,
      startY + 2,
      ticketWidth,
      ticketHeight,
      5,
      5,
      "F"
    );
    pdf.setGState(new pdf.GState({ opacity: 1 }));
  };

  const generatePDF = (ticketsWithQR) => {
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const ticketWidth = pageWidth - 2 * margin;
    const ticketHeight = 80; // Fixed height for each ticket
    const ticketsPerPage = Math.floor(
      (pageHeight - 2 * margin) / (ticketHeight + margin)
    );

    ticketsWithQR.forEach((item, index) => {
      const ticketIndex = index % ticketsPerPage;

      if (ticketIndex === 0 && index > 0) {
        pdf.addPage();
      }

      const startX = margin;
      const startY = margin + ticketIndex * (ticketHeight + margin);

      drawTicket(
        pdf,
        item.ticket,
        item.qrDataUrl,
        startX,
        startY,
        ticketWidth,
        ticketHeight
      );
    });

    return pdf;
  };

  const savePDFToStorage = async (pdf, executiveCode) => {
    const pdfBlob = pdf.output("blob");
    const fileName = `coupons_${executiveCode}_${Date.now()}.pdf`;
    const storageRef = ref(storage, `coupon_pdfs/${fileName}`);
    await uploadBytes(storageRef, pdfBlob);
    const downloadURL = await getDownloadURL(storageRef);
    return { fileName, downloadURL };
  };

  const updateExecutiveCouponPDF = async (executiveCode, fileName, downloadURL) => {
    const executivesRef = collection(firestore, "executives");
    const q = query(executivesRef, where("executiveCode", "==", executiveCode));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const executiveDoc = querySnapshot.docs[0];
      await updateDoc(doc(firestore, "executives", executiveDoc.id), {
        couponPDFs: [...(executiveDoc.data().couponPDFs || []), { fileName, downloadURL }]
      });
    }
  };

  const createCouponsTransaction = async (amount, count) => {
    try {
      return await runTransaction(firestore, async (transaction) => {
        const couponsCollection = collection(firestore, "coupons");
        const newCoupons = [];
  
        for (let i = 0; i < count; i++) {
          const couponData = {
            "amount-paid": amount,
            coupon_code: `FLIX${Math.random().toString(36).substring(7).toUpperCase()}`,
            executiveCode: executiveCode,
            createdAt: new Date(),
            generated_date: serverTimestamp(),
            is_sold: false,
            is_redeemed: false,  // New field
            sale_date: null,
            validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          };
          const newCouponRef = doc(couponsCollection);
          transaction.set(newCouponRef, couponData);
          newCoupons.push({ id: newCouponRef.id, ...couponData });
        }
  
        // Update executive's coupon count
        const executivesRef = collection(firestore, "executives");
        const executiveQuery = query(executivesRef, where("executiveCode", "==", executiveCode));
        const executiveSnapshot = await getDocs(executiveQuery);
        if (!executiveSnapshot.empty) {
          const executiveDoc = executiveSnapshot.docs[0];
          const currentCount = executiveDoc.data().coupon_count || 0;
          transaction.update(executiveDoc.ref, { 
            coupon_count: currentCount + count,
            unsold_coupons: (executiveDoc.data().unsold_coupons || 0) + count
          });
        }
  
        return newCoupons;
      });
    } catch (error) {
      console.error("Error creating coupons:", error);
      throw new Error("Failed to create new coupons. Please try again later.");
    }
  };


  const processCoupons = async () => {
    setIsGenerating(true);
    setProgress(0);
    const processedTickets = [];
    const totalAmount = parseFloat(couponAmount);

    try {
      const newTicketsNeeded = parseInt(numCoupons);
      if (newTicketsNeeded > 100) {
        throw new Error("Cannot generate more than 100 coupons at once.");
      }

      const newTickets = await createCouponsTransaction(couponAmount, newTicketsNeeded);
      setCoupons((prevTickets) => [...prevTickets, ...newTickets]);
      setProgress(20);

      for (let i = 0; i < newTickets.length; i++) {
        const ticket = newTickets[i];
        const hashedCode = sha256(ticket.coupon_code);
        const urlCode = encodeURIComponent(hashedCode + ticket.id);
        const ticketURL = `https://www.ticketflix.in/view-coupon/${urlCode}`;
        const qrDataUrl = await QRCode.toDataURL(ticketURL);
        const storageUrl = await saveQRCodeToStorage(qrDataUrl, ticket.id);
        await updateFirestoreWithQRCodeUrl(ticket.id, storageUrl);
        processedTickets.push({ ticket, qrDataUrl });
        setProgress(20 + Math.floor((i + 1) / newTickets.length * 60));
      }

      const pdf = generatePDF(processedTickets, totalAmount);
      setProgress(90);
      const { fileName, downloadURL } = await savePDFToStorage(pdf, executiveCode);
      await updateExecutiveCouponPDF(executiveCode, fileName, downloadURL);

      setPdfUrl(downloadURL);
      setProgress(100);
    } catch (error) {
      console.error("Error processing coupons:", error);
      throw new Error(`An error occurred while processing coupons: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isNaN(parseFloat(couponAmount)) || !numCoupons || !executiveCode) {
      alert("Please provide valid inputs for all fields.");
      return;
    }
    try {
      await processCoupons();
      alert("Coupons generated successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-center">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6">Generate Coupons</h2>
          {allowExecutiveAccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="numCoupons" className="block text-sm font-medium text-gray-700">Number of coupons</label>
                <input
                  type="number"
                  id="numCoupons"
                  value={numCoupons}
                  onChange={(e) => setNumCoupons(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50" required
                  min="1"
                  max="100"
                />
              </div>
              <div>
                <label htmlFor="couponAmount" className="block text-sm font-medium text-gray-700">Coupon Amount</label>
                <input
                  type="number"
                  id="couponAmount"
                  value={couponAmount}
                  onChange={(e) => setCouponAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="executiveCode" className="block text-sm font-medium text-gray-700">Executive Code</label>
                <input
                  type="text"
                  id="executiveCode"
                  value={executiveCode}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                />
              </div>
              {isGenerating && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{width: `${progress}%`}}
                  ></div>
                </div>
              )}
              <button
                type="submit"
                disabled={isGenerating}
                className={`
                  w-full py-3 px-6 rounded-lg text-white font-semibold text-lg
                  transition duration-300 ease-in-out transform hover:scale-105
                  focus:outline-none focus:ring-4 focus:ring-opacity-50
                  shadow-lg hover:shadow-xl
                  ${
                    isGenerating
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 focus:ring-rose-500'
                  }
                `}
              >
                <span className="flex items-center justify-center">
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Coupons
                      <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>
          ) : (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p className="font-bold">Coupon Generation not allowed</p>
              <p>You are not currently authorized to generate coupons. Please contact your administrator for assistance.</p>
            </div>
          )}
          {pdfUrl && (
            <a
              href={pdfUrl}
              download="qr_codes.pdf"
              className="mt-4 block text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200"
            >
              Download generated coupons
            </a>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CouponGeneration;