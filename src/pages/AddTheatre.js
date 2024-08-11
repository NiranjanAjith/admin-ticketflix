import React, { useState, useEffect } from 'react';
import { firestore, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Dashboard.css';

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

const AddTheater = () => {
  const [theater, setTheater] = useState({
    'theatre-name': '',
    description: '',
    owner: '',
    phone: '',
    email: '',
    district: '',
    city: '',
    'seat-matrix-layout': {
      'screen-1': { rows: 0, columns: 0, matrix: {}, capacity: 0 }
    },
    imageUrl: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [cities, setCities] = useState([]);

  useEffect(() => {
    if (theater.district) {
      setCities(keralaCities[theater.district] || []);
    } else {
      setCities([]);
    }
  }, [theater.district]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTheater(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScreenChange = (screen, e) => {
    const { name, value } = e.target;
    setTheater(prev => {
      const updatedLayout = { ...prev['seat-matrix-layout'][screen], [name]: parseInt(value) || 0 };
      const rows = updatedLayout.rows;
      const columns = updatedLayout.columns;
      const matrix = {};

      for (let row = 1; row <= rows; row++) {
        matrix[String.fromCharCode(64 + row)] = Array(columns).fill(0);
      }

      return {
        ...prev,
        'seat-matrix-layout': {
          ...prev['seat-matrix-layout'],
          [screen]: {
            ...updatedLayout,
            matrix,
            capacity: rows * columns
          }
        }
      };
    });
  };

  const addScreen = () => {
    const newScreen = `screen-${Object.keys(theater['seat-matrix-layout']).length + 1}`;
    setTheater(prev => ({
      ...prev,
      'seat-matrix-layout': {
        ...prev['seat-matrix-layout'],
        [newScreen]: { rows: 0, columns: 0, matrix: {}, capacity: 0 }
      }
    }));
  };

  const removeScreen = (screen) => {
    const { [screen]: _, ...rest } = theater['seat-matrix-layout'];
    setTheater(prev => ({
      ...prev,
      'seat-matrix-layout': rest
    }));
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async () => {
    if (!imageFile) return null;

    const storageRef = ref(storage, `theatre/${Date.now()}_${imageFile.name}`);
    await uploadBytes(storageRef, imageFile);
    return getDownloadURL(storageRef);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!theater['theatre-name'] || !theater.district || !theater.city) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const theaterRef = collection(firestore, 'theatres');
      await addDoc(theaterRef, {
        ...theater,
        imageUrl: imageUrl
      });

      setTheater({
        'theatre-name': '',
        description: '',
        owner: '',
        phone: '',
        email: '',
        district: '',
        city: '',
        'seat-matrix-layout': {
          'screen-1': { rows: 0, columns: 0, matrix: {}, capacity: 0 }
        },
        imageUrl: ''
      });
      setImageFile(null);
      setCities([]);
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
          <label htmlFor="theatre-name">Theater Name</label>
          <input
            id="theatre-name"
            name="theatre-name"
            value={theater['theatre-name']}
            onChange={handleChange}
            placeholder="Theater Name"
            required
          />

          <label htmlFor="district">District</label>
          <select
            id="district"
            name="district"
            value={theater.district}
            onChange={handleChange}
            required
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
            value={theater.city}
            onChange={handleChange}
            required
            disabled={!theater.district}
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
            value={theater.description}
            onChange={handleChange}
            placeholder="Description"
          />

          <label htmlFor="owner">Owner Name</label>
          <input
            id="owner"
            name="owner"
            value={theater.owner}
            onChange={handleChange}
            placeholder="Owner Name"
          />

          <label htmlFor="phone">Phone</label>
          <input
            id="phone"
            name="phone"
            value={theater.phone}
            onChange={handleChange}
            placeholder="Phone"
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            value={theater.email}
            onChange={handleChange}
            placeholder="Email"
          />

          <label htmlFor="theatre-image">Theater Image</label>
          <input
            id="theatre-image"
            type="file"
            onChange={handleImageChange}
          />

                    <h3>Screen Management</h3>
                    {Object.entries(theater['seat-matrix-layout']).map(([screen, layout]) => (
                        <div key={screen} className="screen-section">
                            <h4>{screen}</h4>
                            <label htmlFor={`${screen}-rows`}>Rows</label>
                            <input
                                id={`${screen}-rows`}
                                name="rows"
                                type="number"
                                value={layout.rows}
                                onChange={(e) => handleScreenChange(screen, e)}
                                min="0"
                            />

                            <label htmlFor={`${screen}-columns`}>Columns</label>
                            <input
                                id={`${screen}-columns`}
                                name="columns"
                                type="number"
                                value={layout.columns}
                                onChange={(e) => handleScreenChange(screen, e)}
                                min="0"
                            />

                            <label htmlFor={`${screen}-capacity`}>Capacity</label>
                            <input
                                id={`${screen}-capacity`}
                                name="capacity"
                                type="number"
                                value={layout.capacity}
                                onChange={(e) => handleScreenChange(screen, e)}
                                min="0"
                            />

                            <button type="button" onClick={() => removeScreen(screen)}>Remove Screen</button>
                        </div>
                    ))}

                    <button type="button" onClick={addScreen}>Add Screen</button>

                    <button type="submit">Add Theater</button>
                </form>
            </div>
            <Footer />
        </div>
    );
};

export default AddTheater;
