import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebase';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import './Theatre.css';
import Header from '../components/Header';

const keralaDistricts = [
  "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", 
  "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", 
  "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
];

const keralaCities = {
  "Alappuzha": ["Alappuzha", "Cherthala", "Kayamkulam"],
  "Ernakulam": ["Kochi", "Aluva", "Angamaly", "Perumbavoor", "Muvattupuzha"],
  "Idukki": ["Munnar", "Thodupuzha", "Adimali"],
  "Kannur": ["Kannur", "Thalassery", "Payyanur"],
  "Kasaragod": ["Kasaragod", "Kanhangad", "Nileshwar"],
  "Kollam": ["Kollam", "Karunagappally", "Punalur"],
  "Kottayam": ["Kottayam", "Pala", "Changanassery"],
  "Kozhikode": ["Kozhikode", "Vadakara", "Koyilandy"],
  "Malappuram": ["Malappuram", "Manjeri", "Tirur"],
  "Palakkad": ["Palakkad", "Ottapalam", "Shornur"],
  "Pathanamthitta": ["Pathanamthitta", "Adoor", "Thiruvalla"],
  "Thiruvananthapuram": ["Thiruvananthapuram", "Neyyattinkara", "Attingal"],
  "Thrissur": ["Thrissur", "Chalakudy", "Kodungallur"],
  "Wayanad": ["Kalpetta", "Mananthavady", "Sulthan Bathery"]
};

const Theatre = () => {
    const [theaters, setTheaters] = useState([]);
    const [editingTheater, setEditingTheater] = useState(null);
    const [cities, setCities] = useState([]);

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

    useEffect(() => {
        if (editingTheater && editingTheater.district) {
            setCities(keralaCities[editingTheater.district] || []);
        } else {
            setCities([]);
        }
    }, [editingTheater]);

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
            [name]: value
        }));
    };

    const handleSeatMatrixChange = (e) => {
        const { name, value } = e.target;
        const [screen, dimension] = name.split('-');
        setEditingTheater(prev => ({
            ...prev,
            'seat-matrix-layout': {
                ...prev['seat-matrix-layout'],
                [screen]: {
                    ...prev['seat-matrix-layout'][screen],
                    [dimension]: Number(value)
                }
            }
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
                            <th>District</th>
                            <th>City</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {theaters.map(theater => (
                            <tr key={theater.id}>
                                <td>{theater['theatre-name']}</td>
                                <td>{theater.owner}</td>
                                <td>{theater.phone}</td>
                                <td>{theater.email}</td>
                                <td>{theater.district}</td>
                                <td>{theater.city}</td>
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
                            <label htmlFor="theatre-name">Theatre Name</label>
                            <input
                                id="theatre-name"
                                name="theatre-name"
                                value={editingTheater['theatre-name']}
                                onChange={handleEditChange}
                                placeholder="Theatre Name"
                            />
                            <label htmlFor="owner">Owner Name</label>
                            <input
                                id="owner"
                                name="owner"
                                value={editingTheater.owner}
                                onChange={handleEditChange}
                                placeholder="Owner Name"
                            />
                            <label htmlFor="phone">Contact Phone</label>
                            <input
                                id="phone"
                                name="phone"
                                value={editingTheater.phone}
                                onChange={handleEditChange}
                                placeholder="Contact Phone"
                            />
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={editingTheater.email}
                                onChange={handleEditChange}
                                placeholder="Email"
                            />
                            <label htmlFor="district">District</label>
                            <select
                                id="district"
                                name="district"
                                value={editingTheater.district}
                                onChange={handleEditChange}
                            >
                                <option value="">Select a district</option>
                                {keralaDistricts.map(district => (
                                    <option key={district} value={district}>{district}</option>
                                ))}
                            </select>
                            <label htmlFor="city">City</label>
                            <select
                                id="city"
                                name="city"
                                value={editingTheater.city}
                                onChange={handleEditChange}
                                disabled={!editingTheater.district}
                            >
                                <option value="">Select a city</option>
                                {cities.map(city => (
                                    <option key={city} value={city}>{city}</option>
                                ))}
                            </select>
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={editingTheater.description}
                                onChange={handleEditChange}
                                placeholder="Description"
                            />
                            <h4>Seat Matrix Layout</h4>
                            {editingTheater['seat-matrix-layout'] && Object.entries(editingTheater['seat-matrix-layout']).map(([screen, layout]) => (
                                <div key={screen} className="screen-layout">
                                    <h5>{screen}</h5>
                                    <label htmlFor={`${screen}-rows`}>Number of Rows</label>
                                    <input
                                        id={`${screen}-rows`}
                                        name={`${screen}-rows`}
                                        type="number"
                                        value={layout.rows}
                                        onChange={handleSeatMatrixChange}
                                        placeholder="Number of Rows"
                                    />
                                    <label htmlFor={`${screen}-columns`}>Number of Columns</label>
                                    <input
                                        id={`${screen}-columns`}
                                        name={`${screen}-columns`}
                                        type="number"
                                        value={layout.columns}
                                        onChange={handleSeatMatrixChange}
                                        placeholder="Number of Columns"
                                    />
                                    <label>Screen Capacity</label>
                                    <input
                                        type="number"
                                        value={layout.rows * layout.columns}
                                        readOnly
                                    />
                                </div>
                            ))}
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