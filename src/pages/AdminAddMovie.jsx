import React, { useState, useEffect } from "react";
import axios from "axios";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useLocation, useNavigate } from "react-router-dom";

const initialState = {
  movieName: "",
  duration: "",
  rating: "",
  releaseDate: "",
  genre: "",
  language: "",
  imageUrl: "",
};
const genres = [
  "DRAMA",
  "THRILLER",
  "ACTION",
  "ROMANTIC",
  "COMEDY",
  "HISTORICAL",
  "ANIMATION",
  "SPORTS",
  "SOCIAL",
  "WAR"
];
const languages = [
  "ENGLISH", "HINDI", "MARATHI", "TAMIL", "TELUGU", "KANNADA", "BENGALI", "PUNJABI"
];

const ADMIN_SIDEBAR_LINKS = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Movies", icon: "🎬", path: "/admin/movies" },
  { label: "Add Movie", icon: "➕", path: "/admin/add-movie" },
  { label: "Theaters", icon: "🏢", path: "/admin/theaters" },
  { label: "Add Theater", icon: "➕", path: "/admin/add-theater" },
  { label: "Shows", icon: "🕒", path: "/admin/shows" },
  { label: "Add Show", icon: "➕", path: "/admin/add-show" },
];

const AdminAddMovie = () => {
  const [form, setForm] = useState(initialState);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState({ name: "", role: "" });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get admin details from localStorage
    const name = localStorage.getItem("username") || "Admin";
    const role = localStorage.getItem("role") || "ADMIN";
    setAdmin({ name, role });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_API}/movies/add`,
        {
          ...form,
          duration: Number(form.duration),
          rating: Number(form.rating),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setMessage("Movie added successfully!");
      setForm(initialState);
    } catch (err) {
      console.error('Add movie error:', err);
      // Handle error response properly
      if (err.response?.data) {
        // If data is an object with error property, extract it
        if (typeof err.response.data === 'object' && err.response.data.error) {
          setError(err.response.data.error);
        } else if (typeof err.response.data === 'string') {
          setError(err.response.data);
        } else {
          setError('Failed to add movie');
        }
      } else {
        setError(err.message || 'Failed to add movie');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-blue-200 flex flex-col relative">
      {/* Animated/floating background shapes */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-200 opacity-30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-200 opacity-20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-yellow-100 opacity-20 rounded-full blur-2xl animate-pulse"></div>
      </div>
      <Navbar/>
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
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-red-600 text-center tracking-tight drop-shadow-lg">Add New Movie</h2>
          <div className="w-full max-w-2xl mx-auto">
            <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-2xl p-10 border-t-8 border-red-500 relative overflow-hidden">
              {/* Decorative shapes */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-pink-200 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
              {/* Admin Info */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white text-3xl font-bold border-4 border-pink-200 shadow-lg">
                  {admin.name[0]}
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-800">{admin.name}</div>
                  <div className="text-sm font-medium uppercase tracking-wider bg-pink-100 text-pink-600 px-3 py-1 rounded mt-1 inline-block shadow">{admin.role}</div>
                </div>
              </div>
              {message && <div className="text-green-600 mb-2 text-center font-semibold">{message}</div>}
              {error && <div className="text-red-600 mb-2 text-center font-semibold">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Movie Name</label>
                  <input type="text" name="movieName" value={form.movieName} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-400 bg-white/60" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold mb-1 text-gray-700">Duration (minutes)</label>
                    <input type="number" name="duration" value={form.duration} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-400 bg-white/60" />
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold mb-1 text-gray-700">Rating</label>
                    <input type="number" step="0.1" name="rating" value={form.rating} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-400 bg-white/60" />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Release Date</label>
                  <input type="date" name="releaseDate" value={form.releaseDate} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-400 bg-white/60" />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block font-semibold mb-1 text-gray-700">Genre</label>
                    <select name="genre" value={form.genre} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-400 bg-white/60">
                      <option value="">Select Genre</option>
                      {genres.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block font-semibold mb-1 text-gray-700">Language</label>
                    <select name="language" value={form.language} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-400 bg-white/60">
                      <option value="">Select Language</option>
                      {languages.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Image URL</label>
                  <input type="text" name="imageUrl" value={form.imageUrl} onChange={handleChange} required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-400 bg-white/60" />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-3 rounded-xl shadow hover:from-pink-500 hover:to-red-500 transition">Add Movie</button>
              </form>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminAddMovie; 