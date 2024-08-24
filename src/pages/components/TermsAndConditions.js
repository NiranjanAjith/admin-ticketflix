import React from 'react';
import Header from "./Header";
import Footer from './Footer';

function TermsAndConditions() {
    return (
        <div className="App min-h-screen flex flex-col bg-yellow-50">
            <Header />
            <main className="flex-grow flex items-start pl-48 pt-12">
                <div className="w-full max-w-3xl">
                    <h2 className="text-3xl font-bold mb-6">Terms and Conditions</h2>
                    <div className="space-y-6">
                        <section>
                            <h3 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h3>
                            <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>
                        </section>
                        <section>
                            <h3 className="text-xl font-semibold mb-2">2. Use of Website</h3>
                            <p>You agree to use the website for lawful purposes only and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website.</p>
                        </section>
                        <section>
                            <h3 className="text-xl font-semibold mb-2">3. Intellectual Property</h3>
                            <p>All trademarks, copyright, database rights and other intellectual property rights in the materials on this website are owned by us or our licensors.</p>
                        </section>
                        {/* Add more sections as needed */}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default TermsAndConditions;