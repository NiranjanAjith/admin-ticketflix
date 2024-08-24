import React, { useEffect, useState } from "react";
import { verifyAndGetTicket } from "../utils/verifyTicket";

const ViewTicket = () => {
  const [documentData, setDocumentData] = useState(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await verifyAndGetTicket();
        !!data ? setDocumentData(data) : setIsError(true);
      } catch (error) {
        console.error("Error verifying coupon code:", error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 text-xl font-bold">
        404 Error: Document not found or invalid coupon code.
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {documentData && (
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold mb-4 text-center text-fuchsia-800">
            Movie Ticket
          </h1>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 font-semibold">Ticket ID:</p>
              <p className="text-xl font-bold">{documentData["ticket-id"]}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Amount Paid:</p>
              <p className="text-xl font-bold">
                ₹{documentData["amount-paid"]}
              </p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Class:</p>
              <p className="text-xl font-bold">{documentData.class}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Coupon Code:</p>
              <p className="text-xl font-bold">{documentData.coupon_code}</p>
            </div>
            <div>
              <p className="text-gray-600 font-semibold">Executive ID:</p>
              <p className="text-xl font-bold">{documentData.executiveId}</p>
            </div>
            <div className="flex justify-center mt-6">
              <img
                src={documentData.qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTicket;
