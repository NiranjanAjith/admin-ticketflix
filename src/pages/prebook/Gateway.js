import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PaymentGateway() {
    const navigate = useNavigate();

    useEffect(() => {
        // Simulate payment processing
        const timer = setTimeout(() => {
            // Randomly decide if payment was successful
            const isSuccessful = Math.random() < 0.8; // 80% success rate
            navigate(isSuccessful ? '/success' : '/failure');
        }, 3000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="App min-h-screen flex flex-col bg-yellow-50">
            {/* <Header /> */}
            <main className="flex-grow flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-3xl font-bold mb-4">Processing Payment</h2>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto"></div>
                </div>
            </main>
            {/* <Footer /> */}
        </div>
    );
}

export default PaymentGateway;