import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { FaDownload } from 'react-icons/fa';

const CouponDisplay = () => {
  const { couponId } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [couponData, setCouponData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchCouponData = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        const couponDoc = await getDoc(doc(db, "coupons", couponId));
       
        if (couponDoc.exists()) {
          const data = couponDoc.data();
          setCouponData(data);
          const storage = getStorage();
          const imageRef = ref(storage, data.imageUrl);
          const url = await getDownloadURL(imageRef);
          setImageUrl(url);
        } else {
          throw new Error("Coupon not found");
        }
      } catch (error) {
        console.error("Error fetching coupon data:", error);
        setError("Failed to load the coupon. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCouponData();
  }, [couponId]);

  const handleDownload = async () => {
    if (imageUrl) {
      try {
        setDownloading(true);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `coupon-${couponData.coupon_code}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error("Error downloading image:", error);
        setError("Failed to download the coupon. Please try again.");
      } finally {
        setDownloading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <div className="flex flex-col items-center justify-center flex-grow p-4">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Header />
        <div className="flex flex-col items-center justify-center flex-grow p-4">
          <h2 className="text-2xl font-bold text-red-600 mb-6">Error</h2>
          <p className="text-gray-800 mb-6">{error}</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <div className="flex flex-col items-center justify-center flex-grow p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Coupon</h2>
       
        {imageUrl && (
          <div className="relative group mb-6">
            <img 
              src={imageUrl} 
              alt="Coupon" 
              className="max-w-full w-auto h-auto max-h-[70vh] object-contain rounded-lg shadow-md transition-all duration-300 group-hover:opacity-75" 
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                onClick={handleDownload}
                disabled={downloading}
                className="bg-white text-blue-500 px-4 py-2 rounded-full shadow-lg hover:bg-blue-500 hover:text-white transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500"
              >
                <FaDownload className="inline mr-2" /> 
                {downloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        )}
       
        {couponData && (
          <div className="text-center mb-6">
            <p className="text-xl font-semibold">Code: {couponData.coupon_code}</p>
            <p className="text-gray-600">Valid until: {new Date(couponData.validity.seconds * 1000).toLocaleDateString()}</p>
            {couponData["amount-paid"] && (
              <p className="text-lg font-medium mt-2">Value: Rs. {couponData["amount-paid"]}</p>
            )}
          </div>
        )}
       
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300 disabled:bg-gray-300 disabled:text-gray-500"
        >
          <FaDownload className="inline mr-2" /> 
          {downloading ? 'Downloading...' : 'Download Coupon'}
        </button>
      </div>
      <Footer />
    </div>
  );
};

export default CouponDisplay;