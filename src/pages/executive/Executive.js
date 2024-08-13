import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../firebase';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import "../styles/Dashboard.css";
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
        <div className="executive-page">
            <Header />
            <div className="executive-list-container">
                <h2>Executive List</h2>
                <table className="executive-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Position</th>
                            <th>Department</th>
                            <th>Hire Date</th>
                            <th>Phone Number</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {executives.map(executive => (
                            <tr key={executive.id}>
                                <td>{executive.name}</td>
                                <td>{executive.email}</td>
                                <td>{executive.position}</td>
                                <td>{executive.department}</td>
                                <td>{executive.hireDate}</td>
                                <td>{executive.phoneNumber}</td>
                                <td>
                                    <button onClick={() => handleEdit(executive)} className="icon-button edit">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDelete(executive.id)} className="icon-button delete">
                                        <FaTrashAlt />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {editingExecutive && (
                    <div className="edit-form-overlay">
                        <form onSubmit={handleUpdate} className="edit-form">
                            <h3>Edit Executive</h3>
                            <input
                                name="name"
                                value={editingExecutive.name}
                                onChange={handleEditChange}
                                placeholder="Name"
                            />
                            <input
                                name="email"
                                type="email"
                                value={editingExecutive.email}
                                onChange={handleEditChange}
                                placeholder="Email"
                            />
                            <input
                                name="position"
                                value={editingExecutive.position}
                                onChange={handleEditChange}
                                placeholder="Position"
                            />
                            <input
                                name="department"
                                value={editingExecutive.department}
                                onChange={handleEditChange}
                                placeholder="Department"
                            />
                            <input
                                name="hireDate"
                                type="date"
                                value={editingExecutive.hireDate}
                                onChange={handleEditChange}
                            />
                            <input
                                name="phoneNumber"
                                value={editingExecutive.phoneNumber}
                                onChange={handleEditChange}
                                placeholder="Phone Number"
                            />
                            <div className="form-actions">
                                <button type="submit" className="btn-update">Update Executive</button>
                                <button type="button" onClick={() => setEditingExecutive(null)} className="btn-cancel">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default Executive;