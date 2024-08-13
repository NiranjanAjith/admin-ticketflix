import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ManageExecutivesPage = () => {
    const [executives, setExecutives] = useState([]);

    useEffect(() => {
        const fetchExecutives = async () => {
            const executivesCollection = collection(firestore, 'executives');
            const executiveSnapshot = await getDocs(executivesCollection);
            const executiveList = executiveSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setExecutives(executiveList);
        };

        fetchExecutives();
    }, []);

    const toggleCouponGeneration = async (executiveId, currentValue) => {
        const executiveRef = doc(firestore, 'executives', executiveId);
        await updateDoc(executiveRef, { allow_coupon_generation: !currentValue });
        setExecutives(executives.map(executive =>
            executive.id === executiveId 
                ? {...executive, allow_coupon_generation: !currentValue} 
                : executive
        ));
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Executive List</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Email</th>
                                    <th className="px-4 py-2 text-left">Phone Number</th>
                                    <th className="px-4 py-2 text-left">Coupon Generation</th>
                                </tr>
                            </thead>
                            <tbody>
                                {executives.map(executive => (
                                    <tr key={executive.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{executive.name}</td>
                                        <td className="px-4 py-2">{executive.email}</td>
                                        <td className="px-4 py-2">{executive.phoneNumber}</td>
                                        <td className="px-4 py-2">
                                            <button 
                                                onClick={() => toggleCouponGeneration(executive.id, executive.allow_coupon_generation)}
                                                className={`px-4 py-2 rounded-md ${
                                                    executive.allow_coupon_generation 
                                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                                    : 'bg-green-500 hover:bg-green-600 text-white'
                                                }`}
                                            >
                                                {executive.allow_coupon_generation ? 'Stop' : 'Allow'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default ManageExecutivesPage;