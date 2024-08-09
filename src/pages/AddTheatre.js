// src/pages/AddTheater.js
import React, { useState } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import Header from '../components/Header';

const AddTheater = () => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [capacity, setCapacity] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!name || !location || !capacity) {
            setError('Please fill in all fields');
            return;
        }

        try {
            const theaterRef = collection(firestore, 'theaters');
            await addDoc(theaterRef, {
                name,
                location,
                capacity: Number(capacity),
                createdAt: new Date()
            });

            // Clear the form
            setName('');
            setLocation('');
            setCapacity('');
            setSuccess(true);
        } catch (error) {
            setError('Error adding theater: ' + error.message);
        }
    };

    return (
        <div>
            <Header />
            <div className="form-container">
                <h2>Add New Theater</h2>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">Theater added successfully!</p>}
                <form onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="name">Theater Name:</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="location">Location:</label>
                        <input
                            type="text"
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-field">
                        <label htmlFor="capacity">Capacity:</label>
                        <input
                            type="number"
                            id="capacity"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="button">Add Theater</button>
                </form>
            </div>
        </div>
    );
};

export default AddTheater;