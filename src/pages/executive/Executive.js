import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const Executive = () => {
    const [executives, setExecutives] = useState([]);
    const [editingExecutive, setEditingExecutive] = useState(null);

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

    const handleEdit = (executive) => {
        setEditingExecutive(executive);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const executiveRef = doc(firestore, 'executives', editingExecutive.id);
        await updateDoc(executiveRef, editingExecutive);
        setExecutives(executives.map(executive =>
            executive.id === editingExecutive.id ? editingExecutive : executive
        ));
        setEditingExecutive(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingExecutive(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this executive?')) {
            await deleteDoc(doc(firestore, 'executives', id));
            setExecutives(executives.filter(executive => executive.id !== id));
        }
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
                                    <th className="px-4 py-2 text-left">Position</th>
                                    <th className="px-4 py-2 text-left">Department</th>
                                    <th className="px-4 py-2 text-left">Hire Date</th>
                                    <th className="px-4 py-2 text-left">Phone Number</th>
                                    <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {executives.map(executive => (
                                    <tr key={executive.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{executive.name}</td>
                                        <td className="px-4 py-2">{executive.email}</td>
                                        <td className="px-4 py-2">{executive.position}</td>
                                        <td className="px-4 py-2">{executive.department}</td>
                                        <td className="px-4 py-2">{executive.hireDate}</td>
                                        <td className="px-4 py-2">{executive.phoneNumber}</td>
                                        <td className="px-4 py-2">
                                            <button onClick={() => handleEdit(executive)} className="text-blue-600 hover:text-blue-800 mr-2">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDelete(executive.id)} className="text-red-600 hover:text-red-800">
                                                <FaTrashAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {editingExecutive && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="my-modal">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Executive</h3>
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <input
                                        name="name"
                                        value={editingExecutive.name}
                                        onChange={handleEditChange}
                                        placeholder="Name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <input
                                        name="email"
                                        type="email"
                                        value={editingExecutive.email}
                                        onChange={handleEditChange}
                                        placeholder="Email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <input
                                        name="position"
                                        value={editingExecutive.position}
                                        onChange={handleEditChange}
                                        placeholder="Position"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <input
                                        name="department"
                                        value={editingExecutive.department}
                                        onChange={handleEditChange}
                                        placeholder="Department"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <input
                                        name="hireDate"
                                        type="date"
                                        value={editingExecutive.hireDate}
                                        onChange={handleEditChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <input
                                        name="phoneNumber"
                                        value={editingExecutive.phoneNumber}
                                        onChange={handleEditChange}
                                        placeholder="Phone Number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    <div className="flex justify-end space-x-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setEditingExecutive(null)} 
                                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Update Executive
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default Executive;