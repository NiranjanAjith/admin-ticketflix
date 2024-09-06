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
  const [couponAmount, setCouponAmount] = useState("");
  const [executiveCode, setExecutiveCode] = useState("");
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

  const saveImageToStorage = async (imageDataUrl, ticketId) => {
    try {
      const storageRef = ref(storage, `coupons/${ticketId}.png`);
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error saving image to storage:", error);
      throw new Error("Failed to save image. Please try again.");
    }
  };

  const updateFirestoreWithImageUrl = async (ticketId, imageUrl) => {
    try {
      const couponDoc = doc(firestore, "coupons", ticketId);
      await updateDoc(couponDoc, { imageUrl });
    } catch (error) {
      console.error("Error updating Firestore with image URL:", error);
      throw new Error("Failed to update coupon with image URL. Please try again.");
    }
  };

  const drawTicket = (
    canvas,
    ticket,
    qrDataUrl,
    startX,
    startY,
    ticketWidth,
    ticketHeight
  ) => {
    return new Promise((resolve) => {
      const ctx = canvas.getContext('2d');

      // Clear the canvas
      ctx.clearRect(startX, startY, ticketWidth, ticketHeight);

      // Draw background (gradient)
      const gradient = ctx.createLinearGradient(startX, startY, startX + ticketWidth, startY);
      gradient.addColorStop(0, '#14b8a6'); // teal-500
      gradient.addColorStop(1, '#0891b2'); // cyan-600
      ctx.fillStyle = gradient;
      ctx.fillRect(startX, startY, ticketWidth, ticketHeight);

      // Add rounded corners
      const cornerRadius = 10;
      ctx.beginPath();
      ctx.moveTo(startX + cornerRadius, startY);
      ctx.lineTo(startX + ticketWidth - cornerRadius, startY);
      ctx.quadraticCurveTo(startX + ticketWidth, startY, startX + ticketWidth, startY + cornerRadius);
      ctx.lineTo(startX + ticketWidth, startY + ticketHeight - cornerRadius);
      ctx.quadraticCurveTo(startX + ticketWidth, startY + ticketHeight, startX + ticketWidth - cornerRadius, startY + ticketHeight);
      ctx.lineTo(startX + cornerRadius, startY + ticketHeight);
      ctx.quadraticCurveTo(startX, startY + ticketHeight, startX, startY + ticketHeight - cornerRadius);
      ctx.lineTo(startX, startY + cornerRadius);
      ctx.quadraticCurveTo(startX, startY, startX + cornerRadius, startY);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = gradient;
      ctx.fillRect(startX, startY, ticketWidth, ticketHeight);

      // Column 1
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px Arial';
      ctx.fillText("TICKET FLIX", startX + 20, startY + 50);

      ctx.fillStyle = '#4f46e5'; // indigo-600
      ctx.beginPath();
      ctx.roundRect(startX + 20, startY + 70, ticketWidth * 0.4, 40, 6);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`Amount: Rs. ${ticket["amount-paid"]}`, startX + 30, startY + 98);

      // Column 2
      const column2X = startX + ticketWidth * 0.1;
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText("Coupon Code", column2X, startY + 150);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(column2X, startY + 160, ticketWidth * 0.5, 40, 6);
      ctx.fill();
      ctx.fillStyle = '#008080';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(ticket.coupon_code, column2X + 10, startY + 188);

      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.fillText("Executive ID", column2X, startY + 230);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(column2X, startY + 240, ticketWidth * 0.5, 40, 6);
      ctx.fill();
      ctx.fillStyle = '#008080';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(ticket.executiveCode, column2X + 10, startY + 268);

      // QR Code
      const qrSize = ticketHeight * 0.5;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, startX + ticketWidth - qrSize - 20, startY + (ticketHeight - qrSize) / 2, qrSize, qrSize);
        resolve();
      };
      img.src = qrDataUrl;
    });
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

      pdf.addImage(item.imageDataUrl, 'PNG', startX, startY, ticketWidth, ticketHeight);
    });

    return pdf;
  };

  const createCouponsTransaction = async (amount, count) => {
    try {
      return await runTransaction(firestore, async (transaction) => {
        const couponsCollection = collection(firestore, "coupons");
        const newCoupons = [];
  
        for (let i = 0; i < count; i++) {
          const couponData = {
            "amount-paid": amount,
            coupon_code: `FLIX${Math.random()
              .toString(36)
              .substring(7)
              .toUpperCase()}`,
            executiveCode: executiveCode,
            createdAt: new Date(),
            generated_date: serverTimestamp(),
            is_redeemed: false,
            sale_date: null,
            validity: new Date(Date.now() + 2592000000), // 30 days from now
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
      setProgress(20);

      for (let i = 0; i < newTickets.length; i++) {
        const ticket = newTickets[i];
        const hashedCode = sha256(ticket.coupon_code);
        const urlCode = encodeURIComponent(hashedCode + ticket.id);
        const ticketURL = `https://www.ticketflix.in/view-coupon/${urlCode}`;
        const qrDataUrl = await QRCode.toDataURL(ticketURL);
        
        // Create canvas and draw ticket
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 320;
        await drawTicket(canvas, ticket, qrDataUrl, 0, 0, 800, 320);
        
        const imageDataUrl = canvas.toDataURL('image/png');
        const storageUrl = await saveImageToStorage(imageDataUrl, ticket.id);
        await updateFirestoreWithImageUrl(ticket.id, storageUrl);
        processedTickets.push({ ticket, imageDataUrl });
        setProgress(20 + Math.floor((i + 1) / newTickets.length * 60));
      }

      const pdf = generatePDF(processedTickets, totalAmount);
      setProgress(90);
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setProgress(100);
      return pdfUrl;
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
      const pdfUrl = await processCoupons();
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'generated_coupons.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(pdfUrl);
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
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
              <p className="font-bold">Coupon Generation not allowed</p>
              <p>You are not currently authorized to generate coupons. Please contact your administrator for assistance.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default CouponGeneration;