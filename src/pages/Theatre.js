import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, limit, startAfter, where } from 'firebase/firestore';
import { firestore } from '../firebase';
import { FaEdit, FaTrashAlt, FaChair, FaSearch } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';

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

const Theatre = () => {
    const [theaters, setTheaters] = useState([]);
    const [editingTheater, setEditingTheater] = useState(null);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastVisible, setLastVisible] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formErrors, setFormErrors] = useState({});

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
                    collection(firestore, 'theatres'),
                    where('theatre-name', '>=', searchTerm),
                    where('theatre-name', '<=', searchTerm + '\uf8ff'),
                    limit(THEATRES_PER_PAGE)
                );
            } else {
                theatersQuery = query(
                    collection(firestore, 'theatres'),
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
                collection(firestore, 'theatres'),
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
        if (!editingTheater.owner) errors.owner = 'Owner name is required';
        if (!editingTheater.phone) errors.phone = 'Phone number is required';
        if (!editingTheater.email) errors.email = 'Email is required';
        if (!editingTheater.district) errors.district = 'District is required';
        if (!editingTheater.city) errors.city = 'City is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setError(null);
        try {
            const theaterRef = doc(firestore, 'theatres', editingTheater.id);
            await updateDoc(theaterRef, editingTheater);
            setTheaters(theaters.map(theater =>
                theater.id === editingTheater.id ? editingTheater : theater
            ));
            setEditingTheater(null);
        } catch (err) {
            setError('Failed to update theater');
            console.error(err);
        }
        setLoading(false);
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

    const renderSeatLayout = (screen, layout) => {
        const rows = layout.rows;
        const columns = layout.columns;
        const seatMatrix = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < columns; j++) {
                row.push(
                    <div key={`${i}-${j}`} className="inline-block m-1">
                        <FaChair className="text-blue-500" />
                    </div>
                );
            }
            seatMatrix.push(
                <div key={i} className="flex justify-center">
                    {row}
                </div>
            );
        }
        return (
            <div className="mt-4 p-4 border rounded-md">
                <h6 className="font-medium text-gray-800 mb-2">{screen} Layout</h6>
                {seatMatrix}
            </div>
        );
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Theatre List</h2>
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
                                            {/* <button onClick={() => handleEdit(theater)} className="text-blue-600 hover:text-blue-800 mr-2">
                                                <FaEdit />
                                            </button> */}
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
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div>
                                        <label htmlFor="theatre-name" className="block text-sm font-medium text-gray-700">Theatre Name</label>
                                        <input
                                            id="theatre-name"
                                            name="theatre-name"
                                            value={editingTheater['theatre-name']}
                                            onChange={handleEditChange}
                                            placeholder="Theatre Name"
                                            className={`mt-1 block w-full border ${formErrors['theatre-name'] ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        />
                                        {formErrors['theatre-name'] && <p className="mt-1 text-sm text-red-500">{formErrors['theatre-name']}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="owner" className="block text-sm font-medium text-gray-700">Owner Name</label>
                                        <input
                                            id="owner"
                                            name="owner"
                                            value={editingTheater.owner}
                                            onChange={handleEditChange}
                                            placeholder="Owner Name"
                                            className={`mt-1 block w-full border ${formErrors.owner ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                        />
                                        {formErrors.owner && <p className="mt-1 text-sm text-red-500">{formErrors.owner}</p>}
                                    </div>
                                    <div>
    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Contact Phone</label>
    <input
        id="phone"
        name="phone"
        value={editingTheater.phone}
        onChange={handleEditChange}
        placeholder="Contact Phone"
        className={`mt-1 block w-full border ${formErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
    />
    {formErrors.phone && <p className="mt-1 text-sm text-red-500">{formErrors.phone}</p>}
</div>
<div>
    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
    <input
        id="email"
        name="email"
        type="email"
        value={editingTheater.email}
        onChange={handleEditChange}
        placeholder="Email"
        className={`mt-1 block w-full border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
    />
    {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
</div>
<div>
    <label htmlFor="district" className="block text-sm font-medium text-gray-700">District</label>
    <select
        id="district"
        name="district"
        value={editingTheater.district}
        onChange={handleEditChange}
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
        onChange={handleEditChange}
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
        onChange={handleEditChange}
        placeholder="Description"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
</div>
<div>
    <h4 className="font-medium text-gray-900 mb-2">Seat Matrix Layout</h4>
    {editingTheater['seat-matrix-layout'] && Object.entries(editingTheater['seat-matrix-layout']).map(([screen, layout]) => (
        <div key={screen} className="mb-4 p-4 border rounded-md">
            <h5 className="font-medium text-gray-800 mb-2">{screen}</h5>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor={`${screen}-rows`} className="block text-sm font-medium text-gray-700">Number of Rows</label>
                    <input
                        id={`${screen}-rows`}
                        name={`${screen}-rows`}
                        type="number"
                        value={layout.rows}
                        onChange={handleSeatMatrixChange}
                        placeholder="Number of Rows"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label htmlFor={`${screen}-columns`} className="block text-sm font-medium text-gray-700">Number of Columns</label>
                    <input
                        id={`${screen}-columns`}
                        name={`${screen}-columns`}
                        type="number"
                        value={layout.columns}
                        onChange={handleSeatMatrixChange}
                        placeholder="Number of Columns"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Screen Capacity</label>
                <input
                    type="number"
                    value={layout.rows * layout.columns}
                    readOnly
                    className="mt-1 block w-full bg-gray-100 border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-700 sm:text-sm"
                />
            </div>
            {renderSeatLayout(screen, layout)}
        </div>
    ))}
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

export default Theatre;