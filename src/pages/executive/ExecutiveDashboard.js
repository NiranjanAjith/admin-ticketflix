import React, { useState, useEffect, useContext, useRef } from "react";
import { firestore } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';
import { Link } from "react-router-dom";
import { Receipt, User } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const ExecutiveDashboard = () => {
  const [groupedCoupons, setGroupedCoupons] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [couponAnalysis, setCouponAnalysis] = useState({
    coupon_count: 0,
    sold_coupons: 0,
    unsold_coupons: 0
  });
  const [prebookedUsers, setPrebookedUsers] = useState([]);
  const [filterDate, setFilterDate] = useState(new Date());
  const { user } = useContext(AuthContext);
  const couponRefs = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user || !user.email) {
          console.log("No user logged in");
          setError("No user logged in");
          setLoading(false);
          return;
        }

        console.log("Fetching data for user:", user.uid);

        const executiveDocRef = doc(firestore, "executives", user.email);
        const executiveDocSnap = await getDoc(executiveDocRef);
        if (!executiveDocSnap.exists()) {
          console.log("No executive document found for user:", user.email);
          setError("No executive data found");
          setLoading(false);
          return;
        }

        const executiveData = executiveDocSnap.data();
        console.log("Executive data:", executiveData);

        // Ensure that access is allowed for the executive
        if (!executiveData.allow_executive_access) {
          setError("You do not have access to view this data.");
          setLoading(false);
          return;
        }

        setCouponAnalysis({
          coupon_count: executiveData.coupon_count || 0,
          sold_coupons: executiveData.sold_coupons || 0,
          unsold_coupons: executiveData.unsold_coupons || 0
        });

        if (!executiveData.executiveCode) {
          console.log("No executiveCode found for user:", user.uid);
          setError("No executive code found");
          setLoading(false);
          return;
        }

        // Fetching pre-booked users for the executive
        const prebookingsRef = collection(firestore, "prebook");
        const prebookingsQuery = query(prebookingsRef, where("executiveCode", "==", executiveData.executiveCode));
        const prebookingsSnapshot = await getDocs(prebookingsQuery);

        const prebookedUsersList = prebookingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPrebookedUsers(prebookedUsersList);

        // Fetching coupons
        const couponsRef = collection(firestore, "coupons");
        const q = query(couponsRef, where("executiveCode", "==", executiveData.executiveCode));
        const querySnapshot = await getDocs(q);

        const couponDetails = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            generated_date: data.generated_date ? data.generated_date.toDate() : null,
            imageUrl: data.imageUrl ?? data.qrCodeUrl ?? ""
          };
        });

        const grouped = couponDetails.reduce((acc, coupon) => {
          const date = coupon.generated_date.toDateString();
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(coupon);
          return acc;
        }, {});

        setGroupedCoupons(grouped);

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const generatePDF = async (date, coupons) => {
    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const spacing = 5;
    const ticketWidth = pageWidth - 2 * margin;
    const ticketHeight = 75;
    const ticketsPerPage = Math.floor((pageHeight - 2 * margin) / (ticketHeight + spacing));
  
    const unsoldCoupons = coupons.filter(coupon => !coupon.sale_date);
  
    for (let i = 0; i < unsoldCoupons.length; i++) {
      if (i > 0 && i % ticketsPerPage === 0) {
        pdf.addPage();
      }
  
      const coupon = unsoldCoupons[i];
      const element = couponRefs.current[coupon.id];
  
      if (element) {
        const canvas = await html2canvas(element.querySelector('img'), {
          logging: false,
          useCORS: true,
          scale: 2
        });
  
        const imgData = canvas.toDataURL('image/png');
        const startY = margin + (i % ticketsPerPage) * (ticketHeight + spacing);
  
        pdf.addImage(imgData, 'PNG', margin, startY, ticketWidth, ticketHeight);
      }
    }
  
    const pdfBlob = pdf.output('blob');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = `coupons_${date.replace(/\s/g, '_')}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
  
    console.log(`PDF generated for date: ${date}`);
  };

  const renderCouponList = () => {
    const filteredGroupedCoupons = Object.entries(groupedCoupons)
      .filter(([date]) => {
        const couponDate = new Date(date);
        const filterDateStart = new Date(filterDate);
        filterDateStart.setHours(0, 0, 0, 0);
        return couponDate >= filterDateStart;
      })
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));
  
    return (
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <Receipt className="mr-2" />
          Generated Coupons
        </h2>
        
        <section className="mb-8">
            <DatePicker
              selected={filterDate}
              onChange={(date) => setFilterDate(date)}
              className="border rounded-md px-4 py-2"
              dateFormat="yyyy/MM/dd"
              maxDate={new Date()}
            />
          </section>
        {filteredGroupedCoupons.length > 0 ? (
          filteredGroupedCoupons.map(([date, couponsForDate]) => (
            <div key={date} className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-lg font-semibold">{date}</h4>
                <button
                  onClick={() => generatePDF(date, couponsForDate)}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
                >
                  Download PDF
                </button>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {couponsForDate.map((coupon) => (
                  <li key={coupon.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                    <Link 
                      to={`/executive/share-coupon/${encodeURIComponent(coupon.id)}`} 
                      className="block"
                    >
                      <div ref={el => couponRefs.current[coupon.id] = el} className="p-4">
                        <img 
                          src={coupon.imageUrl} 
                          alt={`Coupon ${coupon.coupon_code}`} 
                          className="w-full h-48 object-cover rounded" 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/path/to/fallback/image.png'; // Replace with your fallback image
                          }}
                        />
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-lg font-semibold text-gray-800">{coupon.coupon_code}</span>
                          {coupon.sale_date ? (
                            <span className="px-2 py-1 rounded text-sm bg-green-100 text-green-800">
                              Sold
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                              Unsold
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-gray-600">No coupons available for the selected date range.</p>
        )}
      </section>
    );
  };

  const renderPrebookedUsers = () => {
    return (
      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <User className="mr-2" />
          Pre-booked Users
        </h2>
        {prebookedUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prebookedUsers.map((user) => (
              <div key={user.id} className="bg-gray-50 rounded-md p-4 hover:shadow-lg transition-shadow duration-300">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">{user.name}</h3>
                <div className="text-sm text-gray-600">
                  <p><span className="font-medium">Email:</span> {user.email || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {user.phone}</p>
                  <p><span className="font-medium">Class:</span> {user.class}</p>
                  <p><span className="font-medium">Seats:</span> {user.numberOfSeats}</p>
                  <p><span className="font-medium">Amount:</span> ${user.amount.toFixed(2)}</p>
                  <p><span className="font-medium">Booked:</span> {new Date(user.timestamp.seconds * 1000).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No pre-booked users available.</p>
          </div>
        )}
      </section>
    );
  };

  const pieChartData = [
    { name: 'Sold Coupons', value: couponAnalysis.sold_coupons },
    { name: 'Unsold Coupons', value: couponAnalysis.unsold_coupons },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
           <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Executive Dashboard</h2>

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Coupon Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-100 p-4 rounded-lg">
                <p className="text-lg font-semibold">Total Coupons</p>
                <p className="text-3xl font-bold">{couponAnalysis.coupon_count}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg">
                <p className="text-lg font-semibold">Sold Coupons</p>
                <p className="text-3xl font-bold">{couponAnalysis.sold_coupons}</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-lg">
                <p className="text-lg font-semibold">Unsold Coupons</p>
                <p className="text-3xl font-bold">{couponAnalysis.unsold_coupons}</p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Pre-booked Users Section */}
          {renderPrebookedUsers()}


          {renderCouponList()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExecutiveDashboard;
