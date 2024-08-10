import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import './Theatre.css';
import Header from '../components/Header';

const Theatre = () => {
    const [theaters, setTheaters] = useState([]);
    const [editingTheater, setEditingTheater] = useState(null);

    useEffect(() => {
        const fetchTheaters = async () => {
            const theatersCollection = collection(firestore, 'theatres');
            const theaterSnapshot = await getDocs(theatersCollection);
            const theaterList = theaterSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTheaters(theaterList);
        };

        fetchTheaters();
    }, []);

    const handleEdit = (theater) => {
        setEditingTheater(theater);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const theaterRef = doc(firestore, 'theatres', editingTheater.id);
        await updateDoc(theaterRef, editingTheater);
        setTheaters(theaters.map(theater =>
            theater.id === editingTheater.id ? editingTheater : theater
        ));
        setEditingTheater(null);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingTheater(prev => ({
            ...prev,
            [name]: name === 'seat-capacity' ? Number(value) : value
        }));
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this theater?')) {
            await deleteDoc(doc(firestore, 'theatres', id));
            setTheaters(theaters.filter(theater => theater.id !== id));
        }
    };

    return (
        <div className="theatre-page">
            <Header />
            <div className="theatre-list-container">
                <h2>Theatre List</h2>
                <table className="theatre-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Owner</th>
                            <th>Contact</th>
                            <th>Email</th>
                            <th>Capacity</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {theaters.map(theater => (
                            <tr key={theater.id}>
                                <td>{theater['theatre-name']}</td>
                                <td>{theater.owner}</td>
                                <td>{theater['contact-phone']}</td>
                                <td>{theater.email}</td>
                                <td>{theater['seat-capacity']}</td>
                                <td>
                                    <button onClick={() => handleEdit(theater)} className="icon-button edit">
                                        <FaEdit />
                                    </button>
                                    <button onClick={() => handleDelete(theater.id)} className="icon-button delete">
                                        <FaTrashAlt />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {editingTheater && (
                    <div className="edit-form-overlay">
                        <form onSubmit={handleUpdate} className="edit-form">
                            <h3>Edit Theatre</h3>
                            <input
                                name="theatre-name"
                                value={editingTheater['theatre-name']}
                                onChange={handleEditChange}
                                placeholder="Theatre Name"
                            />
                            <input
                                name="owner"
                                value={editingTheater.owner}
                                onChange={handleEditChange}
                                placeholder="Owner Name"
                            />
                            <input
                                name="contact-phone"
                                value={editingTheater['contact-phone']}
                                onChange={handleEditChange}
                                placeholder="Contact Phone"
                            />
                            <input
                                name="email"
                                type="email"
                                value={editingTheater.email}
                                onChange={handleEditChange}
                                placeholder="Email"
                            />
                            <input
                                name="seat-capacity"
                                type="number"
                                value={editingTheater['seat-capacity']}
                                onChange={handleEditChange}
                                placeholder="Seat Capacity"
                            />
                            <textarea
                                name="description"
                                value={editingTheater.description}
                                onChange={handleEditChange}
                                placeholder="Description"
                            />
                            <div className="form-actions">
                                <button type="submit" className="btn-update">Update Theatre</button>
                                <button type="button" onClick={() => setEditingTheater(null)} className="btn-cancel">Cancel</button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Theatre;