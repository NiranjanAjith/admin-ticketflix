import React, { useState, useEffect, useContext } from "react";
import { firestore } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { AuthContext } from "../../context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

const ExecutiveDashboard = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [couponAnalysis, setCouponAnalysis] = useState({
    coupon_count: 0,
    sold_coupons: 0,
    unsold_coupons: 0
  });
  const [filterDate, setFilterDate] = useState(null);
  const { user } = useContext(AuthContext);

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

        setCouponAnalysis({
          coupon_count: executiveData.coupon_count || 0,
          sold_coupons: executiveData.sold_coupons || 0,
          unsold_coupons: executiveData.unsold_coupons || 0
        });

        const couponPDFs = executiveData.couponPDFs || [];
        console.log("Coupon PDFs:", couponPDFs);

        if (!executiveData.executiveCode) {
          console.log("No executiveCode found for user:", user.uid);
          setError("No executive code found");
          setLoading(false);
          return;
        }

        const couponsRef = collection(firestore, "coupons");
        const q = query(couponsRef, where("executiveCode", "==", executiveData.executiveCode));
        const querySnapshot = await getDocs(q);

        console.log("Coupons query result size:", querySnapshot.size);

        const couponDetails = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            generated_date: data.generated_date ? data.generated_date.toDate() : null
          };
        });

        console.log("Coupon details:", couponDetails);

        const combinedCoupons = couponPDFs.map(pdf => {
          const fileNameParts = pdf.fileName.split('_');
          const executiveCode = fileNameParts[1];
          const timestamp = parseInt(fileNameParts[2].split('.')[0]);
          const generatedDate = new Date(timestamp);

          const details = couponDetails.find(detail => detail.executiveCode === executiveCode && detail.generated_date?.getTime() === generatedDate.getTime());
          
          return {
            ...pdf,
            ...details,
            executiveCode,
            generatedDate: details?.generated_date || generatedDate
          };
        });

        console.log("Combined coupons:", combinedCoupons);

        setCoupons(combinedCoupons);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const currentCoupons = coupons.filter(coupon => coupon.generatedDate >= currentDate);
  const pastCoupons = coupons.filter(coupon => coupon.generatedDate < currentDate);

  const filteredPastCoupons = filterDate
    ? pastCoupons.filter(coupon => coupon.generatedDate.toDateString() === filterDate.toDateString())
    : pastCoupons;

  const renderCouponList = (coupons, title) => (
    <section className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
      {coupons.length > 0 ? (
        <ul className="space-y-2">
          {coupons.map((coupon) => (
            <li key={coupon.fileName} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <span className="text-gray-800">{coupon.fileName}</span>
              <div>
                <span className={`mr-4 ${coupon.is_sold ? 'text-green-600' : 'text-red-600'}`}>
                  {coupon.is_sold ? 'Sold' : 'Unsold'}
                </span>
                <span className="text-gray-600 mr-4">{coupon.generatedDate.toLocaleDateString()}</span>
                <a
                  href={coupon.downloadURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Download PDF
                </a>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No {title.toLowerCase()} available.</p>
      )}
    </section>
  );

  const pieChartData = [
    { name: 'Sold Coupons', value: couponAnalysis.sold_coupons },
    { name: 'Unsold Coupons', value: couponAnalysis.unsold_coupons },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-800">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-red-600">{error}</div>
      </div>
    );
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
              <div className="bg-red-100 p-4 rounded-lg">
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
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

          {renderCouponList(currentCoupons, "Currently Generated Coupons")}

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Past Generated Coupons</h3>
            <div className="mb-4">
              <DatePicker
                selected={filterDate}
                onChange={date => setFilterDate(date)}
                className="form-input rounded-md shadow-sm"
                placeholderText="Filter by date"
              />
            </div>
            {renderCouponList(filteredPastCoupons, "Past Coupons")}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExecutiveDashboard;