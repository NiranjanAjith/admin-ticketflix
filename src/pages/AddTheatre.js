import React, { useState } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Dashboard.css';

const AddTheater = () => {
    const [theater, setTheater] = useState({
        'theatre-name': '',
        owner: '',
        'contact-phone': '',
        email: '',
        'seat-capacity': '',
        description: '',
        'seat-matrix': {
            columns: [0, 0],
            rows: [0, 0]
        }
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTheater(prev => ({
            ...prev,
            [name]: name === 'seat-capacity' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!theater['theatre-name'] || !theater.owner || !theater['contact-phone'] || !theater.email || !theater['seat-capacity']) {
            setError('Please fill in all required fields');
            return;
        }

        try {
            const theaterRef = collection(firestore, 'theatres');
            await addDoc(theaterRef, {
                ...theater,
                createdAt: new Date()
            });

            setTheater({
                'theatre-name': '',
                owner: '',
                'contact-phone': '',
                email: '',
                'seat-capacity': '',
                description: '',
                'seat-matrix': {
                    columns: [0, 0],
                    rows: [0, 0]
                }
            });
            setSuccess(true);
        } catch (error) {
            setError('Error adding theater: ' + error.message);
        }
    };

    return (
        <div className="theatre-page">
            <Header />
            <div className="theatre-list-container">
                <h2>Add New Theater</h2>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">Theater added successfully!</p>}
                <form onSubmit={handleSubmit} className="edit-form">
                    <input
                        name="theatre-name"
                        value={theater['theatre-name']}
                        onChange={handleChange}
                        placeholder="Theater Name"
                        required
                    />
                    <input
                        name="owner"
                        value={theater.owner}
                        onChange={handleChange}
                        placeholder="Owner Name"
                        required
                    />
                    <input
                        name="contact-phone"
                        value={theater['contact-phone']}
                        onChange={handleChange}
                        placeholder="Contact Phone"
                        required
                    />
                    <input
                        name="email"
                        type="email"
                        value={theater.email}
                        onChange={handleChange}
                        placeholder="Email"
                        required
                    />
                    <input
                        name="seat-capacity"
                        type="number"
                        value={theater['seat-capacity']}
                        onChange={handleChange}
                        placeholder="Seat Capacity"
                        required
                    />
                    <textarea
                        name="description"
                        value={theater.description}
                        onChange={handleChange}
                        placeholder="Description"
                    />
                    <div className="form-actions">
                        <button type="submit" className="btn-update">Add Theater</button>
                    </div>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default AddTheater;