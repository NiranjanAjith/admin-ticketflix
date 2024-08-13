import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Function to generate executive code (remains unchanged)
const generateExecutiveCode = (name, phoneNumber) => {
    const nameParts = name.split(' ');
    const initials = nameParts.map(part => part.charAt(0).toUpperCase()).join('');
    const phonePart = phoneNumber.slice(-4);
    return `${initials}${phonePart}`;
};

const AddExecutive = () => {
    const [executive, setExecutive] = useState({
        name: '',
        email: '',
        position: '',
        department: '',
        hireDate: '',
        phoneNumber: '',
        executiveCode: '',
    });

    const [message, setMessage] = useState({ type: '', content: '' });

    useEffect(() => {
        if (executive.name && executive.phoneNumber) {
            const code = generateExecutiveCode(executive.name, executive.phoneNumber);
            setExecutive(prevState => ({
                ...prevState,
                executiveCode: code
            }));
        }
    }, [executive.name, executive.phoneNumber]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setExecutive(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(firestore, 'executives'), executive);
            setMessage({ type: 'success', content: 'Executive added successfully!' });
            setExecutive({
                name: '',
                email: '',
                position: '',
                department: '',
                hireDate: '',
                phoneNumber: '',
                executiveCode: '',
            });
        } catch (error) {
            console.error('Error adding executive: ', error);
            setMessage({ type: 'error', content: 'Error adding executive. Please try again.' });
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Executive</h2>
                    {message.content && (
                        <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {message.content}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="executiveCode" className="block text-sm font-medium text-gray-700">Executive Code:</label>
                            <input
                                type="text"
                                id="executiveCode"
                                name="executiveCode"
                                value={executive.executiveCode}
                                readOnly
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name:</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={executive.name}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={executive.email}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position:</label>
                            <input
                                type="text"
                                id="position"
                                name="position"
                                value={executive.position}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department:</label>
                            <input
                                type="text"
                                id="department"
                                name="department"
                                value={executive.department}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="hireDate" className="block text-sm font-medium text-gray-700">Hire Date:</label>
                            <input
                                type="date"
                                id="hireDate"
                                name="hireDate"
                                value={executive.hireDate}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number:</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={executive.phoneNumber}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <button 
                                type="submit"
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Add Executive
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AddExecutive;