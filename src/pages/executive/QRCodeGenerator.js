import React, { useState, useEffect } from "react";
import {
  collection,
  updateDoc,
  doc,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firestore, storage } from "../../firebase";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { sha256 } from "js-sha256";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

function QRCodeGenerator() {
  const [numCoupons, setNumCoupons] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [amountPaid, setAmountPaid] = useState("");
  const [executiveCode, setExecutiveCode] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [tickets, setTickets] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [executives, setExecutives] = useState([]);

  useEffect(() => {
    const fetchExecutives = async () => {
      const executivesRef = collection(firestore, "executives");
      const executivesSnapshot = await getDocs(executivesRef);
      const executivesList = executivesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExecutives(executivesList);
    };

    fetchExecutives();
  }, []);

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
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`Type: ${ticket.class}`, startX + 10, startY + 30); // 20

    pdf.setFontSize(24);
    pdf.text("TICKET FLIX", startX + 10, startY + 40);

    pdf.setFillColor(79, 70, 229); // indigo-600
    pdf.roundedRect(startX + 10, startY + 50, ticketWidth * 0.3, 15, 6, 6, "F");
    pdf.setFontSize(12);
    pdf.text(`Amount: Rs. ${ticket["amount-paid"]}`, startX + 15, startY + 59); // 60

    // Column 2
    const column2X = startX + ticketWidth * 0.38;
    pdf.setFontSize(10);
    pdf.text("Coupon Code", column2X, startY + 18.5); // 15
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
    pdf.text("Executive ID", column2X, startY + 49.5); // 50
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
    pdf.text(ticket.executiveCode, column2X + 4, startY + 61.25); // 60

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
      // const pageIndex = Math.floor(index / ticketsPerPage);
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

  const createNewTicket = async (amt, execCode, type) => {
    try {
      const ticketsRef = collection(firestore, "coupon");
      const newTicket = {
        // FIXEME: field names
        "amount-paid": amt,
        coupon_code: `FREE${Math.random()
          .toString(36)
          .substring(7)
          .toUpperCase()}`,
        "user-id": "",
        executiveCode: execCode,
        class: type,
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
      const newTicketsNeeded = Math.max(
        0,
        parseInt(numCoupons) - tickets.length
      );
      const newTickets = [];
      for (let i = 0; i < newTicketsNeeded; i++) {
        const newTicket = await createNewTicket(
          amountPaid,
          executiveCode,
          ticketType
        );
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
    if (
      isNaN(parseFloat(amountPaid)) ||
      !executiveCode ||
      !numCoupons ||
      !ticketType
    ) {
      alert("Please provide valid inputs for all fields.");
      return;
    }
    await processCoupons();
  };

  return (
    <div className="h-screen">
      <Header />
      <div style={{ padding: "60px 20px" }} className="h-[77.8vh]">
        <input
          type="number"
          value={numCoupons}
          onChange={(e) => setNumCoupons(e.target.value)}
          placeholder="Number of coupons"
          style={{
            marginBottom: "10px",
            display: "block",
            width: "100%",
            padding: "8px",
          }}
        />
        <input
          type="number"
          id="amountPaid"
          placeholder="Amount Paid"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          required
          style={{
            marginBottom: "10px",
            display: "block",
            width: "100%",
            padding: "8px",
          }}
        />
        <select
          id="executiveCode"
          value={executiveCode}
          onChange={(e) => setExecutiveCode(e.target.value)}
          required
          style={{
            marginBottom: "10px",
            display: "block",
            width: "100%",
            padding: "8px",
          }}
        >
          <option value="">Select an Executive</option>
          {executives.map((executive) => (
            <option
              key={executive.executiveCode}
              value={executive.executiveCode}
            >
              {executive.name} ({executive.executiveCode})
            </option>
          ))}
        </select>
        <select
          id="ticketType"
          value={ticketType}
          onChange={(e) => setTicketType(e.target.value)}
          required
          style={{
            marginBottom: "10px",
            display: "block",
            width: "100%",
            padding: "8px",
          }}
        >
          <option value="">Select Ticket Type</option>
          <option value="Standard">Standard</option>
          <option value="Luxury">Luxury</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={isGenerating}
          style={{
            marginBottom: "10px",
            display: "block",
            width: "100%",
            padding: "10px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {isGenerating ? "Generating..." : "Generate QR Codes"}
        </button>
        {pdfUrl && (
          <a
            href={pdfUrl}
            download="qr_codes.pdf"
            style={{
              display: "block",
              textAlign: "center",
              padding: "10px",
              backgroundColor: "#28a745",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
            }}
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
