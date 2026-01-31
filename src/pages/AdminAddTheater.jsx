import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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

const AdminAddTheater = () => {
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    numberOfScreens: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [admin, setAdmin] = useState({ name: "", role: "" });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("username") || "Admin";
    setAdmin({ name, role: role || "ADMIN" });
    if (role !== "ADMIN") {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Authentication token not found. Please log in again.");
      setLoading(false);
      navigate("/login", { replace: true });
      return;
    }
    try {
      const response = await fetch("https://bookmyshow-backend.onrender.com/theaters", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          city: form.city,
          numberOfScreens: parseInt(form.numberOfScreens, 10)
        })
      });
      if (response.ok) {
        setMessage("Theater added successfully!");
        setForm({ name: "", address: "", city: "", numberOfScreens: "" });
      } else {
        const data = await response.text();
        setMessage("Error: " + data);
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-blue-200 flex flex-col relative">
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
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-red-600 text-center tracking-tight drop-shadow-lg">Add Theater</h2>
          <div className="w-full max-w-2xl mx-auto">
            <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-2xl p-10 border-t-8 border-purple-500 relative overflow-hidden min-h-[420px] flex flex-col justify-center">
              {/* Decorative shapes */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-pink-200 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Name</label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/60" />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Address</label>
                  <input type="text" name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/60" />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">City</label>
                  <input type="text" name="city" value={form.city} onChange={handleChange} required className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/60" />
                </div>
                <div>
                  <label className="block text-gray-700 font-bold mb-2">Number of Screens</label>
                  <input type="number" name="numberOfScreens" value={form.numberOfScreens} onChange={handleChange} required min="1" className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white/60" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow hover:from-pink-600 hover:to-purple-600 text-lg transition disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? "Adding..." : "Add Theater"}
                </button>
                {message && <div className="text-center mt-4 text-lg font-semibold text-pink-600">{message}</div>}
              </form>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminAddTheater; 