import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../components/Header";
import Footer from '../components/Footer';
// import './form.css'

function PrebookingForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        executiveCode: ''
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you would typically send the form data to your backend
        // After successful submission, redirect to payment gateway
        navigate('/payment');
    };

    return (
        <div className="App min-h-screen flex flex-col bg-yellow-50">
            <Header />
            <main className="flex-grow flex items-center pl-48">
                <div className="w-full max-w-lg">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {['name', 'email', 'phone', 'location', 'executiveCode'].map((field) => (
                            <div key={field} className="relative">
                                <input
                                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                                    id={field}
                                    name={field}
                                    value={formData[field]}
                                    onChange={handleChange}
                                    className="peer w-full px-3 py-2 border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                                    placeholder=" "
                                    required={field !== 'executiveCode'}
                                />
                                <label
                                    htmlFor={field}
                                    className="absolute left-3 -top-3.5 text-gray-600 text-sm transition-all 
                                               peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2
                                               peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm"
                                >
                                    {field.charAt(0).toUpperCase() + field.slice(1)}
                                </label>
                            </div>
                        ))}
                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                        >
                            Pay
                        </button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default PrebookingForm;