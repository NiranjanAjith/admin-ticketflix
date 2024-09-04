import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const ShareCoupon = () => {
  const { couponImageUrl } = useParams();
  const decodedImageUrl = decodeURIComponent(couponImageUrl);
  const [blob, setBlob] = useState(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await fetch(decodedImageUrl);
        const imageBlob = await response.blob();
        setBlob(imageBlob);
      } catch (error) {
        console.error("Error fetching image:", error);
      }
    };

    fetchImage();
    setCanShare(navigator.share !== undefined);
  }, [decodedImageUrl]);

  const shareCoupon = async () => {
    if (canShare && blob) {
      try {
        await navigator.share({
          files: [new File([blob], 'coupon.png', { type: blob.type })],
          title: 'Check out this coupon!',
          text: 'Here\'s a great coupon for you!',
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: download the image
      downloadImage();
    }
  };

  const downloadImage = () => {
    if (blob) {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'coupon.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Share Your Coupon</h2>
     
      <img src={decodedImageUrl} alt="Coupon" className="w-64 h-64 mb-6" />
      <div className="flex space-x-4">
        <button 
          onClick={shareCoupon}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {canShare ? 'Share Coupon' : 'Download Coupon'}
        </button>
      </div>
    </div>
  );
};

export default ShareCoupon;