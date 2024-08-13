import React, { useState, useEffect, useContext } from "react";
import {
  collection,
  updateDoc,
  doc,
  addDoc,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../../firebase";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { sha256 } from "js-sha256";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { AuthContext } from "../../context/AuthContext"; // Ensure this path is correct



function QRCodeGenerator() {
  const [numCoupons, setNumCoupons] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [executiveCode, setExecutiveCode] = useState("");
  const [tickets, setTickets] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [allowCouponGeneration, setAllowCouponGeneration] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchExecutiveData = async () => {
      if (user) {
        const executivesRef = collection(firestore, "executives");
        const q = query(executivesRef, where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const executiveData = querySnapshot.docs[0].data();
          setExecutiveCode(executiveData.executiveCode);
          setAllowCouponGeneration(executiveData.allow_coupon_generation);
        }
        setLoading(false);
      }
    };

    fetchExecutiveData();
  }, [user]);

  const saveQRCodeToStorage = async (qrDataUrl, ticketId) => {
    const storageRef = ref(storage, `qrcodes/${ticketId}.png`);
    const response = await fetch(qrDataUrl);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const updateFirestoreWithQRCodeUrl = async (ticketId, qrCodeUrl) => {
    const ticketRef = doc(firestore, "coupon", ticketId);
    await updateDoc(ticketRef, { qrCodeUrl });
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

    const pdfBlob = pdf.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setPdfUrl(pdfUrl);
  };

  const createNewTicket = async (amt) => {
    try {
      const ticketsRef = collection(firestore, "coupon");
      const newTicket = {
        "amount-paid": amt,
        coupon_code: `FREE${Math.random().toString(36).substring(7).toUpperCase()}`,
        "user-id": "",
        executiveCode: executiveCode,
      };

      const docRef = await addDoc(ticketsRef, newTicket);
      return { id: docRef.id, ...newTicket };
    } catch (error) {
      console.error("Error adding document: ", error);
      throw new Error("Failed to create new ticket. Please try again later.");
    }
  };

  const processCoupons = async () => {
    setIsGenerating(true);
    const processedTickets = [];
    const totalAmount = parseFloat(amountPaid);

    try {
      const newTicketsNeeded = Math.max(0, parseInt(numCoupons) - tickets.length);
      const newTickets = [];
      for (let i = 0; i < newTicketsNeeded; i++) {
        const newTicket = await createNewTicket(amountPaid);
        newTickets.push(newTicket);
      }
      setTickets((prevTickets) => [...prevTickets, ...newTickets]);

      for (let i = 0; i < parseInt(numCoupons); i++) {
        const ticket = newTickets[i];
        if (!ticket) {
          console.error(`Ticket at index ${i} is undefined`);
          continue;
        }
        const hashedCode = sha256(ticket.coupon_code);
        const urlCode = encodeURIComponent(hashedCode + ticket.id);
        const ticketURL = `https://www.ticketflix.in/ticket/view/${urlCode}`;
        const qrDataUrl = await QRCode.toDataURL(ticketURL);
        const storageUrl = await saveQRCodeToStorage(qrDataUrl, ticket.id);
        await updateFirestoreWithQRCodeUrl(ticket.id, storageUrl);
        processedTickets.push({ ticket, qrDataUrl });
      }

      generatePDF(processedTickets, totalAmount);
    } catch (error) {
      console.error("Error processing coupons:", error);
      alert("An error occurred while processing coupons. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isNaN(parseFloat(amountPaid)) || !numCoupons || !executiveCode) {
      alert("Please provide valid inputs for all fields.");
      return;
    }
    await processCoupons();
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
          <h2 className="text-2xl font-bold mb-6">Generate QR Codes</h2>
          {allowCouponGeneration ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="numCoupons" className="block text-sm font-medium text-gray-700">Number of Coupons</label>
                <input
                  type="number"
                  id="numCoupons"
                  value={numCoupons}
                  onChange={(e) => setNumCoupons(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required
                />
              </div>
              <div>
                <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700">Amount Paid</label>
                <input
                  type="number"
                  id="amountPaid"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  required
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
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-200"
              >
                {isGenerating ? "Generating..." : "Generate QR Codes"}
              </button>
            </form>
          ) : (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p className="font-bold">Coupon Generation Not Allowed</p>
              <p>You are not currently authorized to generate coupons. Please contact your administrator for assistance.</p>
            </div>
          )}
          {pdfUrl && (
            <a
              href={pdfUrl}
              download="qr_codes.pdf"
              className="mt-4 block text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200"
            >
              Download QR Codes PDF
            </a>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default QRCodeGenerator;