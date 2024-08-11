import React, { useState, useEffect } from 'react';
import { firestore } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Function to generate executive code
const generateExecutiveCode = (name, phoneNumber) => {
    // Extract initials from the name
    const nameParts = name.split(' ');
    const initials = nameParts.map(part => part.charAt(0).toUpperCase()).join('');

    // Extract a part of the phone number (last 4 digits)
    const phonePart = phoneNumber.slice(-4);

    // Combine initials with phone part to generate the executive code
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
        // Generate executive code whenever name or phoneNumber changes
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
        <div>
            <Header />
            <div className="add-executive-container">
                <h2>Add New Executive</h2>
                {message.content && (
                    <div className={`message ${message.type}-message`}>
                        {message.content}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="executiveCode">Executive Code:</label>
                        <input
                            type="text"
                            id="executiveCode"
                            name="executiveCode"
                            value={executive.executiveCode}
                            readOnly
                        />
                    </div>
                    <div>
                        <label htmlFor="name">Name:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={executive.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={executive.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="position">Position:</label>
                        <input
                            type="text"
                            id="position"
                            name="position"
                            value={executive.position}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="department">Department:</label>
                        <input
                            type="text"
                            id="department"
                            name="department"
                            value={executive.department}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="hireDate">Hire Date:</label>
                        <input
                            type="date"
                            id="hireDate"
                            name="hireDate"
                            value={executive.hireDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="phoneNumber">Phone Number:</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={executive.phoneNumber}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit">Add Executive</button>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default AddExecutive;
