import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, limit, startAfter, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../../firebase';
import { FaTrashAlt, FaTrash, FaChair, FaSearch, FaEdit, FaPlus } from 'react-icons/fa';
import Header from './components/Header';
import Footer from './components/Footer';

const THEATRES_PER_PAGE = 10;

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

const seatTypes = ['Standard', 'Gold', 'Diamond'];

const ManageTheatresPage = () => {
    const [theaters, setTheaters] = useState([]);
    const [editingTheater, setEditingTheater] = useState(null);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastVisible, setLastVisible] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [imageFile, setImageFile] = useState(null);

    const theatresCollection = collection(firestore, "theatres");

    useEffect(() => {
        fetchTheaters();
    }, []);

    useEffect(() => {
        if (editingTheater && editingTheater.district) {
            setCities(keralaCities[editingTheater.district] || []);
        } else {
            setCities([]);
        }
    }, [editingTheater]);

    const fetchTheaters = async (searchTerm = '') => {
        setLoading(true);
        setError(null);
        try {
            let theatersQuery;
            if (searchTerm) {
                theatersQuery = query(
                    theatresCollection,
                    where('theatre-name', '>=', searchTerm),
                    where('theatre-name', '<=', searchTerm + '\uf8ff'),
                    limit(THEATRES_PER_PAGE)
                );
            } else {
                theatersQuery = query(
                    theatresCollection,
                    limit(THEATRES_PER_PAGE)
                );
            }
            const theaterSnapshot = await getDocs(theatersQuery);
            const theaterList = theaterSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTheaters(theaterList);
            setLastVisible(theaterSnapshot.docs[theaterSnapshot.docs.length - 1]);
        } catch (err) {
            setError('Failed to fetch theaters');
            console.error(err);
        }
        setLoading(false);
    };

    const loadMoreTheaters = async () => {
        if (!lastVisible) return;
        setLoading(true);
        try {
            const theatersQuery = query(
                theatresCollection,
                startAfter(lastVisible),
                limit(THEATRES_PER_PAGE)
            );
            const theaterSnapshot = await getDocs(theatersQuery);
            const newTheaters = theaterSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTheaters(prevTheaters => [...prevTheaters, ...newTheaters]);
            setLastVisible(theaterSnapshot.docs[theaterSnapshot.docs.length - 1]);
        } catch (err) {
            setError('Failed to load more theaters');
            console.error(err);
        }
        setLoading(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchTheaters(searchTerm);
    };

    const handleEdit = (theater) => {
        setEditingTheater(theater);
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};
        if (!editingTheater['theatre-name']) errors['theatre-name'] = 'Theatre name is required';
        if (!editingTheater.district) errors.district = 'District is required';
        if (!editingTheater.city) errors.city = 'City is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setError(null);
        try {
            let imageUrl = editingTheater.imageUrl;
            if (imageFile) {
                imageUrl = await uploadImage();
            }

            const theaterData = {
                ...editingTheater,
                imageUrl
            };

            const theaterRef = doc(firestore, 'theatres', editingTheater.id);
            await updateDoc(theaterRef, theaterData);
            setTheaters(theaters.map(theater =>
                theater.id === editingTheater.id ? theaterData : theater
            ));
            setEditingTheater(null);
            setImageFile(null);
        } catch (err) {
            setError('Failed to update theater');
            console.error(err);
        }
        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditingTheater(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleScreenChange = (screen, e) => {
        const { name, value } = e.target;
        setEditingTheater(prev => {
          const updatedLayout = { ...prev['seat-matrix-layout'][screen], [name]: parseInt(value) || 0 };
          const rows = updatedLayout.rows;
          const columns = updatedLayout.columns;
          const matrix = {};
    
          for (let row = 1; row <= rows; row++) {
            matrix[String.fromCharCode(64 + row)] = {
              seats: Array(columns).fill(true),
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
        setEditingTheater(prev => {
          const updatedMatrix = { 
            ...prev['seat-matrix-layout'][screen].matrix,
            [row]: {
              ...prev['seat-matrix-layout'][screen].matrix[row],
              seats: prev['seat-matrix-layout'][screen].matrix[row].seats.map((seat, index) => 
                index === col ? !seat : seat
              )
            }
          };
      
          const capacity = Object.values(updatedMatrix).reduce((sum, row) => 
            sum + row.seats.filter(seat => seat).length, 0
          );
      
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
        setEditingTheater(prev => {
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
        const newScreen = `screen-${Object.keys(editingTheater['seat-matrix-layout']).length + 1}`;
        setEditingTheater(prev => ({
          ...prev,
          'seat-matrix-layout': {
            ...prev['seat-matrix-layout'],
            [newScreen]: { rows: 0, columns: 0, matrix: {}, capacity: 0 }
          }
        }));
    };

    const removeScreen = (screen) => {
        const { [screen]: _, ...rest } = editingTheater['seat-matrix-layout'];
        setEditingTheater(prev => ({
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

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this theater?')) {
            setLoading(true);
            setError(null);
            try {
                await deleteDoc(doc(firestore, 'theatres', id));
                setTheaters(theaters.filter(theater => theater.id !== id));
            } catch (err) {
                setError('Failed to delete theater');
                console.error(err);
            }
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Theatre List</h2>
                        <Link 
                            to="/campaign-admin/theatres/add-theatre"
                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <FaPlus className="inline mr-2" /> Add Theatre
                        </Link>
                    </div>
                    <form onSubmit={handleSearch} className="mb-4">
                        <div className="flex">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search theaters..."
                                className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <FaSearch />
                            </button>
                        </div>
                    </form>
                    {loading && <p className="text-center">Loading...</p>}
                    {error && <p className="text-center text-red-500">{error}</p>}
                    <div className="overflow-x-auto">
                        <table className="w-full table-auto">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Owner</th>
                                    <th className="px-4 py-2 text-left">Contact</th>
                                    <th className="px-4 py-2 text-left">Email</th>
                                    <th className="px-4 py-2 text-left">District</th>
                                    <th className="px-4 py-2 text-left">City</th>
                                    <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {theaters.map(theater => (
                                    <tr key={theater.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-2">{theater['theatre-name']}</td>
                                        <td className="px-4 py-2">{theater.owner}</td>
                                        <td className="px-4 py-2">{theater.phone}</td>
                                        <td className="px-4 py-2">{theater.email}</td>
                                        <td className="px-4 py-2">{theater.district}</td>
                                        <td className="px-4 py-2">{theater.city}</td>
                                        <td className="px-4 py-2">
                                            <button onClick={() => handleEdit(theater)} className="text-blue-600 hover:text-blue-800 mr-2">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDelete(theater.id)} className="text-red-600 hover:text-red-800">
                                                <FaTrashAlt />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {lastVisible && (
                        <div className="mt-4 text-center">
                            <button 
                                onClick={loadMoreTheaters}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={loading}
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </div>

                {editingTheater && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
                        <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Theatre</h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label htmlFor="theatre-name" className="block text-sm font-medium text-gray-700">Theater Name</label>
                                        <input
                                            id="theatre-name"
                                            name="theatre-name"
                                            value={editingTheater['theatre-name']}
                                            onChange={handleChange}
                                            placeholder="Theater Name"
                                            required
                                            className={`mt-1 block w-full border ${formErrors['theatre-name'] ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        />
                                        {formErrors['theatre-name'] && <p className="mt-1 text-sm text-red-500">{formErrors['theatre-name']}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="district" className="block text-sm font-medium text-gray-700">District</label>
                                        <select
                                            id="district"
                                            name="district"
                                            value={editingTheater.district}
                                            onChange={handleChange}
                                            required
                                            className={`mt-1 block w-full border ${formErrors.district ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        >
                                            <option value="">Select a district</option>
                                            {keralaDistricts.map(district => (
                                                <option key={district} value={district}>{district}</option>
                                            ))}
                                        </select>
                                        {formErrors.district && <p className="mt-1 text-sm text-red-500">{formErrors.district}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                        <select
                                            id="city"
                                            name="city"
                                            value={editingTheater.city}
                                            onChange={handleChange}
                                            required
                                            disabled={!editingTheater.district}
                                            className={`mt-1 block w-full border ${formErrors.city ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        >
                                            <option value="">Select a city</option>
                                            {cities.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                        {formErrors.city && <p className="mt-1 text-sm text-red-500">{formErrors.city}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            value={editingTheater.description}
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
                                            value={editingTheater.owner}
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
                                            value={editingTheater.phone}
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
                                            value={editingTheater.email}
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
                                        {Object.entries(editingTheater['seat-matrix-layout']).map(([screen, layout]) => (
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

                                    <div className="flex justify-end space-x-3 mt-6">
                                        <button
                                            type="button"
                                            onClick={() => setEditingTheater(null)}
                                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Update Theatre
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
};

export default ManageTheatresPage;