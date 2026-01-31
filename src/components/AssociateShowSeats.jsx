// File: src/pages/AssociateShowSeats.jsx

import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const ADMIN_SIDEBAR_LINKS = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Movies", icon: "🎬", path: "/admin/movies" },
  { label: "Add Movie", icon: "➕", path: "/admin/add-movie" },
  { label: "Theaters", icon: "🏢", path: "/admin/theaters" },
  { label: "Add Theater", icon: "➕", path: "/admin/add-theater" },
  { label: "Shows", icon: "🕒", path: "/admin/shows" },
  { label: "Add Show", icon: "➕", path: "/admin/add-show" },
];

const AssociateShowSeats = () => {
  const { showId } = useParams(); 
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState({ name: "", role: "" });

  const [seatPrices, setSeatPrices] = useState({
    priceOfPremiumSeat: "",
    priceOfClassicPlusSeat: "",
    priceOfClassicSeat: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!showId) {
      setError("Show ID is missing. Please select a show from the list.");
    }
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("username") || "Admin";
    setAdmin({ name, role: role || "ADMIN" });
  }, [showId]);

  const handlePriceChange = (e) => {
    setSeatPrices({ ...seatPrices, [e.target.name]: parseInt(e.target.value) || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    if (!seatPrices.priceOfPremiumSeat || !seatPrices.priceOfClassicPlusSeat || !seatPrices.priceOfClassicSeat) {
      setError("Please enter a price for all seat types.");
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const payload = {
        showId: parseInt(showId),
        ...seatPrices,
      };
      const res = await fetch("https://bookmyshow-backend-p05y.onrender.com/theaters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const resultText = await res.text();
        setMessage(resultText);
        setTimeout(() => navigate("/admin/show-list"), 2000);
      } else {
        const errorText = await res.text();
        setError("Error: " + errorText);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-blue-200 flex flex-col relative overflow-x-hidden">
      {/* Animated/floating background shapes */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-200 opacity-30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-200 opacity-20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-yellow-100 opacity-20 rounded-full blur-2xl animate-pulse"></div>
      </div>
      <Navbar />
      <div className="flex flex-1 w-full max-w-8xl mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 min-h-full py-10 px-4 bg-white/70 backdrop-blur-md border-r border-gray-200 shadow-2xl rounded-tr-3xl rounded-br-3xl mt-8 mb-8 mr-6">
          <div className="flex flex-col items-center mb-10">
            <span className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white text-2xl font-extrabold border-2 border-pink-200 shadow-lg mb-2">
              {admin.name[0]}
            </span>
            <div className="font-bold text-lg text-gray-800">{admin.name}</div>
            <div className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded mt-1 font-bold uppercase inline-block">{admin.role}</div>
          </div>
          <nav className="flex flex-col gap-2 w-full">
            {ADMIN_SIDEBAR_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all text-gray-700 hover:bg-pink-100 hover:text-pink-600 ${location.pathname === link.path ? 'bg-pink-500/20 text-pink-600 font-bold shadow' : ''}`}
              >
                <span className="text-lg">{link.icon}</span> {link.label}
              </button>
            ))}
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center py-12 px-2 md:px-10">
          <div className="w-full max-w-3xl mx-auto">
            <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-2xl p-12 border-t-8 border-green-500 relative overflow-hidden min-h-[420px] flex flex-col justify-center">
              {/* Decorative shapes */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-pink-200 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
              <h2 className="text-3xl font-extrabold mb-4 text-green-600 text-center tracking-tight">
                Set Seat Prices for Show {showId}
              </h2>
              <p className="text-center text-gray-500 mb-8">
                Enter the price for each seat type for this show.
              </p>
              {message && <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center mb-4">{message}</div>}
              {error && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center mb-4">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Premium Seat Price</label>
                    <input
                      type="number"
                      name="priceOfPremiumSeat"
                      value={seatPrices.priceOfPremiumSeat}
                      onChange={handlePriceChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/60"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Classic Plus Seat Price</label>
                    <input
                      type="number"
                      name="priceOfClassicPlusSeat"
                      value={seatPrices.priceOfClassicPlusSeat}
                      onChange={handlePriceChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/60"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Classic Seat Price</label>
                    <input
                      type="number"
                      name="priceOfClassicSeat"
                      value={seatPrices.priceOfClassicSeat}
                      onChange={handlePriceChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white/60"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-8">
                  <button
                    type="button"
                    onClick={() => navigate("/admin/show-list")}
                    className="bg-gray-300 text-gray-800 px-6 py-3 rounded-xl hover:bg-gray-400 transition-colors font-semibold"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors font-semibold"
                    disabled={loading}
                  >
                    {loading ? "Associating..." : "Associate Seats"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AssociateShowSeats;