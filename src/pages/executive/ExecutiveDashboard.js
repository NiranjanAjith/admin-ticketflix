import React, { useState, useEffect, useContext } from "react";
import { firestore, storage } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, getMetadata } from "firebase/storage";
import { AuthContext } from "../../context/AuthContext";
import Header from "./components/Header";
import Footer from "./components/Footer";

const ExecutiveDashboard = () => {
  const [couponPDFs, setCouponPDFs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user) {
          const executivesRef = collection(firestore, "executives");
          const q = query(executivesRef, where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const executiveData = querySnapshot.docs[0].data();
            const allPDFs = executiveData.couponPDFs || [];
            
            // Check each PDF in Storage
            const existingPDFs = await Promise.all(
              allPDFs.map(async (pdf) => {
                try {
                  const fileRef = ref(storage, `coupon_pdfs/${pdf.fileName}`);
                  await getMetadata(fileRef);
                  return pdf; // File exists, keep it
                } catch (error) {
                  console.warn(`PDF not found in storage: ${pdf.fileName}`);
                  return null; // File doesn't exist, filter it out
                }
              })
            );

            // Filter out null values (PDFs that don't exist in storage)
            setCouponPDFs(existingPDFs.filter(pdf => pdf !== null));
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        // Optionally, set an error state here to display to the user
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-2xl font-semibold text-gray-800">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Executive Dashboard</h2>
          <section>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Generated Coupon PDFs</h3>
            {couponPDFs.length > 0 ? (
              <ul className="space-y-2">
                {couponPDFs.map((pdf, index) => (
                  <li key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-gray-800">{pdf.fileName}</span>
                    <a
                      href={pdf.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Download PDF
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No coupon PDFs available.</p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExecutiveDashboard;