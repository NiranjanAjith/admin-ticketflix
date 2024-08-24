import React from 'react';

const TicketFlixCoupon = ({ type, amount, couponCode, executiveCode, qrCodeUrl }) => {
  return (
    <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-8 w-full max-w-3xl mx-auto rounded-lg shadow-lg relative overflow-hidden">
      <div className="flex justify-between items-center">
        {/* Column 1 */}
        <div className="flex-1 pr-4">
          <div className="text-xs font-semibold tracking-wide uppercase mb-2 opacity-90">Type: {type}</div>
          <h1 className="text-5xl font-extrabold text-gray-100 mb-4 leading-none tracking-tight">TICKET FLIX</h1>
          <div className="bg-indigo-600 text-white inline-block px-6 py-2 rounded-full text-xl font-semibold shadow-lg">
            Amount: ₹{amount}
          </div>
        </div>
        {/* Column 2 */}
        <div className="flex-1 flex flex-col justify-center px-4 space-y-4">
          <div>
            <span className="text-gray-300 text-xs block mb-1">Coupon Code</span>
            <div className="bg-white text-teal-800 inline-block px-4 py-2 rounded-lg text-lg font-semibold shadow-md border border-teal-300">
              {couponCode}
            </div>
          </div>
          <div>
            <span className="text-gray-300 text-xs block mb-1">Executive ID</span>
            <div className="bg-white text-teal-800 inline-block px-4 py-2 rounded-lg text-lg font-semibold shadow-md border border-teal-300">
              {executiveCode}
            </div>
          </div>
        </div>
        {/* Column 3 */}
        <div className="flex-none flex items-center justify-end pl-4">
          <div className="bg-white p-2 rounded-lg shadow-lg">
            <img src={qrCodeUrl} alt="QR Code" className="w-24 h-24 object-cover" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketFlixCoupon;