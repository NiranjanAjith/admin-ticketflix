import React, { useState, useEffect, useContext } from "react";
import { firestore, storage } from "../../firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, getBytes, listAll } from "firebase/storage";
import { AuthContext } from "../../context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";

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
  const [filterDate, setFilterDate] = useState(new Date());
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
            generated_date: data.generated_date ? data.generated_date.toDate() : null,
            qrCodeUrl: data.imageUrl ?? ""
          };
        });

        console.log("Coupon details:", couponDetails);

        // Group coupons by generated date
        const grouped = couponDetails.reduce((acc, coupon) => {
          const date = coupon.generated_date.toDateString();
          if (!acc[date]) {
            acc[date] = [];
          }
          acc[date].push(coupon);
          return acc;
        }, {});

        setGroupedCoupons(grouped);

        // List contents of 'coupons' folder in storage
        const listRef = ref(storage, 'coupons');
        listAll(listRef)
          .then((res) => {
            console.log("Files in 'coupons' folder:");
            res.items.forEach((itemRef) => {
              console.log("Found file:", itemRef.fullPath);
            });
          }).catch((error) => {
            console.log("Error listing files:", error);
          });

      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Error fetching data: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const fetchImage = async (url) => {
    try {
      console.log("Attempting to fetch image from URL:", url);
      
      // Extract the path from the URL
      const path = url.split('movie-campaign.appspot.com/o/')[1].split('?')[0];
      const decodedPath = decodeURIComponent(path);
      console.log("Decoded path:", decodedPath);
      
      // Create a reference to the file
      const imageRef = ref(storage, decodedPath);
      console.log("Image reference created:", imageRef);
      console.log("Full path:", imageRef.fullPath);
      
      // Get the bytes directly from Firebase Storage
      const bytes = await getBytes(imageRef);
      console.log("Image bytes obtained");
      
      // Convert bytes to base64
      const base64 = btoa(String.fromCharCode.apply(null, new Uint8Array(bytes)));
      return `data:image/png;base64,${base64}`;
    } catch (error) {
      console.error(`Error fetching image from ${url}:`, error);
      if (error.code === 'storage/object-not-found') {
        console.log("The specified object does not exist in Firebase Storage.");
      }
      return null;
    }
  };

  const generatePDF = async (date, couponsForDate) => {
    if (couponsForDate.length === 0) {
      alert("No coupons found for the selected date.");
      return;
    }
    const pdf = new jsPDF();
    const imagesPerPage = 4;
    const imageWidth = 90;
    const imageHeight = 90;
    const margin = 15;
    for (let i = 0; i < couponsForDate.length; i++) {
      if (i > 0 && i % imagesPerPage === 0) {
        pdf.addPage();
      }
      const coupon = couponsForDate[i];
      try {
        console.log("Full coupon object:", coupon);
        console.log(`Processing coupon: ${coupon.coupon_code}`);
        console.log(`QR Code URL: ${coupon.qrCodeUrl}`);
        if (!coupon.qrCodeUrl) {
          throw new Error("QR Code URL is missing");
        }
        const imgData = await fetchImage(coupon.qrCodeUrl);
       
        if (imgData) {
          const xPosition = margin + (i % 2) * (imageWidth + margin);
          const yPosition = margin + Math.floor((i % imagesPerPage) / 2) * (imageHeight + margin);
          pdf.addImage(imgData, 'PNG', xPosition, yPosition, imageWidth, imageHeight);
          console.log(`Image added to PDF for coupon: ${coupon.coupon_code}`);
        } else {
          throw new Error("Failed to fetch image data");
        }
      } catch (error) {
        console.error(`Error processing coupon ${coupon.coupon_code}:`, error);
        const xPosition = margin + (i % 2) * (imageWidth + margin);
        const yPosition = margin + Math.floor((i % imagesPerPage) / 2) * (imageHeight + margin);
        pdf.setFontSize(10);
        pdf.text(`Error loading image for: ${coupon.coupon_code}`, xPosition, yPosition + imageHeight / 2);
      }
    }

    // Generate PDF blob
    const pdfBlob = pdf.output('blob');
    
    // Create a download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(pdfBlob);
    link.download = `coupons_${date.replace(/\s/g, '_')}.pdf`;
    link.click();

    // Clean up
    URL.revokeObjectURL(link.href);

    console.log(`PDF generated for date: ${date}`);
  };

  const renderCouponList = () => {
    const filteredGroupedCoupons = Object.entries(groupedCoupons)
      .filter(([date]) => new Date(date) >= filterDate)
      .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA));

    return (
      <section className="mb-8">
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
              <ul className="space-y-2">
                {couponsForDate.map((coupon) => (
                  <li key={coupon.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-gray-800">{coupon.coupon_code}</span>
                    <div>
                      <span className={`mr-4 ${coupon.is_sold ? 'text-green-600' : 'text-yellow-600'}`}>
                        {coupon.is_sold ? 'Sold' : 'Unsold'}
                      </span>
                    </div>
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
        <div className="text-2xl font-semibold text-yellow-600">{error}</div>
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

          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Generated Coupons</h3>
            <div className="mb-4">
              <DatePicker
                selected={filterDate}
                onChange={date => setFilterDate(date)}
                className="form-input rounded-md shadow-sm"
                placeholderText="Filter from date"
              />
            </div>
            {renderCouponList()}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExecutiveDashboard;