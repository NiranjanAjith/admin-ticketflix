import React, { useState, useEffect } from 'react';
import { firestore, storage } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './styles/Dashboard.css';
import { FaPlus, FaTrash, FaChair } from 'react-icons/fa';

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

const seatTypes = ['standard', 'elite', 'premium'];

const AddTheatrePage = () => {
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
        matrix[String.fromCharCode(64 + row)] = {
          seats: Array(columns).fill(true),  // true: available, false: not in theater
          type: 'standard'
        };
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

  const toggleSeat = (screen, row, col) => {
    setTheater(prev => {
      // Clone the entire matrix to ensure immutability
      const updatedMatrix = { 
        ...prev['seat-matrix-layout'][screen].matrix,
        [row]: {
          ...prev['seat-matrix-layout'][screen].matrix[row],
          seats: prev['seat-matrix-layout'][screen].matrix[row].seats.map((seat, index) => 
            index === col ? !seat : seat
          )
        }
      };
  
      // Calculate new capacity based on the updated matrix
      const capacity = Object.values(updatedMatrix).reduce((sum, row) => 
        sum + row.seats.filter(seat => seat).length, 0
      );
  
      // Return the updated state
      return {
        ...prev,
        'seat-matrix-layout': {
          ...prev['seat-matrix-layout'],
          [screen]: {
            ...prev['seat-matrix-layout'][screen],
            matrix: updatedMatrix,
            capacity
          }
        }
      };
    });
  };
  

  const changeRowType = (screen, row, type) => {
    setTheater(prev => {
      const updatedMatrix = { ...prev['seat-matrix-layout'][screen].matrix };
      updatedMatrix[row].type = type;
      
      return {
        ...prev,
        'seat-matrix-layout': {
          ...prev['seat-matrix-layout'],
          [screen]: {
            ...prev['seat-matrix-layout'][screen],
            matrix: updatedMatrix,
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
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Theater</h2>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">Theater added successfully!</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="theatre-name" className="block text-sm font-medium text-gray-700">Theater Name</label>
              <input
                id="theatre-name"
                name="theatre-name"
                value={theater['theatre-name']}
                onChange={handleChange}
                placeholder="Theater Name"
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700">District</label>
              <select
                id="district"
                name="district"
                value={theater.district}
                onChange={handleChange}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a district</option>
                {keralaDistricts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
              <select
                id="city"
                name="city"
                value={theater.city}
                onChange={handleChange}
                required
                disabled={!theater.district}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">Select a city</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                name="description"
                value={theater.description}
                onChange={handleChange}
                placeholder="Description"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="owner" className="block text-sm font-medium text-gray-700">Owner Name</label>
              <input
                id="owner"
                name="owner"
                value={theater.owner}
                onChange={handleChange}
                placeholder="Owner Name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                id="phone"
                name="phone"
                value={theater.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                value={theater.email}
                onChange={handleChange}
                placeholder="Email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="theatre-image" className="block text-sm font-medium text-gray-700">Theater Image</label>
              <input
                id="theatre-image"
                type="file"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
              />
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Screen Management</h3>
              {Object.entries(theater['seat-matrix-layout']).map(([screen, layout]) => (
                <div key={screen} className="mb-6 p-4 border rounded-md">
                  <h4 className="text-md font-medium text-gray-800 mb-2">{screen}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor={`${screen}-rows`} className="block text-sm font-medium text-gray-700">Rows</label>
                      <input
                        id={`${screen}-rows`}
                        name="rows"
                        type="number"
                        value={layout.rows}
                        onChange={(e) => handleScreenChange(screen, e)}
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${screen}-columns`} className="block text-sm font-medium text-gray-700">Columns</label>
                      <input
                        id={`${screen}-columns`}
                        name="columns"
                        type="number"
                        value={layout.columns}
                        onChange={(e) => handleScreenChange(screen, e)}
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${screen}-capacity`} className="block text-sm font-medium text-gray-700">Capacity</label>
                      <input
                        id={`${screen}-capacity`}
                        name="capacity"
                        type="number"
                        value={layout.capacity}
                        readOnly
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-4 border rounded-md">
  <h5 className="text-md font-medium text-gray-800 mb-2">Seat Layout</h5>
  <div className="flex flex-col items-center">
    {Object.entries(layout.matrix).map(([row, rowData]) => (
      <div key={row} className="flex mb-2 items-center">
        <span className="mr-2 w-6 text-center">{row}</span>
        <select
          value={rowData.type}
          onChange={(e) => changeRowType(screen, row, e.target.value)}
          className="mr-2 text-sm border-gray-300 rounded-md"
        >
          {seatTypes.map(type => (
            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          ))}
        </select>
        {rowData.seats.map((seat, col) => (
          <button
            key={col}
            type="button"
            onClick={() => toggleSeat(screen, row, col)}
            className={`w-6 h-6 mx-1 rounded-sm focus:outline-none ${
              seat ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'
            }`}
          >
            <FaChair className={`w-full h-full ${seat ? 'text-white' : 'text-gray-500'}`} />
          </button>
        ))}
      </div>
    ))}
  </div>
</div>
<div className="mt-4">
  <p className="text-sm text-gray-600">
    Seat Colors: 
    <span className="ml-2 px-2 py-1 bg-green-500 text-white rounded">Available</span>
    <span className="ml-2 px-2 py-1 bg-gray-300 text-gray-700 rounded">Not in theater</span>
  </p>
</div>
<button 
  type="button" 
  onClick={() => removeScreen(screen)}
  className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
>
  <FaTrash className="mr-2" /> Remove Screen
</button>
</div>
))}
<button 
type="button" 
onClick={addScreen}
className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
>
<FaPlus className="mr-2" /> Add Screen
</button>
</div>

<div>
<button 
type="submit"
className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
Add Theater
</button>
</div>
</form>
</div>
</main>
<Footer />
</div>
);
};

export default AddTheatrePage;