import React from 'react';
import Header from "./Header";
import Footer from './Footer';

function PrivacyPolicy() {
    return (
        <div className="App min-h-screen flex flex-col bg-yellow-50">
            <Header />
            <main className="flex-grow flex items-start pl-48 pt-12">
                <div className="w-full max-w-3xl">
                    <h2 className="text-3xl font-bold mb-6">Privacy Policy</h2>
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold mb-2">1. Information We Collect</h3>
                            <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.</p>
                        </section>
                        <section>
                            <h3 className="text-xl font-semibold mb-2">2. How We Use Your Information</h3>
                            <p>We use the information we collect to provide, maintain, and improve our services, to process your transactions, and to communicate with you.</p>
                        </section>
                        <section>
                            <h3 className="text-xl font-semibold mb-2">3. Information Sharing and Disclosure</h3>
                            <p>We do not share your personal information with third parties except as described in this privacy policy.</p>
                        </section>
                        {/* Add more sections as needed */}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default PrivacyPolicy;