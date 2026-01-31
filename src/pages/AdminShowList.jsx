import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios"; // Using axios for easier requests

const ADMIN_SIDEBAR_LINKS = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Movies", icon: "🎬", path: "/admin/movies" },
  { label: "Add Movie", icon: "➕", path: "/admin/add-movie" },
  { label: "Theaters", icon: "🏢", path: "/admin/theaters" },
  { label: "Add Theater", icon: "➕", path: "/admin/add-theater" },
  { label: "Shows", icon: "🕒", path: "/admin/shows" },
  { label: "Add Show", icon: "➕", path: "/admin/add-show" },
];

// Predefined food options with emojis and suggested prices
const FOOD_OPTIONS = [
  { name: "Popcorn", emoji: "🍿", suggestedPrice: 120, category: "Snacks" },
  { name: "Samosa", emoji: "🥟", suggestedPrice: 80, category: "Snacks" },
  { name: "French Fries", emoji: "🍟", suggestedPrice: 150, category: "Snacks" },
  { name: "Cold Drink", emoji: "🥤", suggestedPrice: 100, category: "Beverages" },
  { name: "Coca Cola", emoji: "🥤", suggestedPrice: 120, category: "Beverages" },
  { name: "Momos", emoji: "🥟", suggestedPrice: 180, category: "Snacks" },
  { name: "Pizza Slice", emoji: "🍕", suggestedPrice: 200, category: "Snacks" },
  { name: "Nachos", emoji: "🌮", suggestedPrice: 160, category: "Snacks" },
  { name: "Hot Dog", emoji: "🌭", suggestedPrice: 140, category: "Snacks" },
  { name: "Burger", emoji: "🍔", suggestedPrice: 180, category: "Snacks" },
  { name: "Ice Cream", emoji: "🍦", suggestedPrice: 100, category: "Desserts" },
  { name: "Chocolate", emoji: "🍫", suggestedPrice: 80, category: "Desserts" },
  { name: "Coffee", emoji: "☕", suggestedPrice: 120, category: "Beverages" },
  { name: "Tea", emoji: "🫖", suggestedPrice: 80, category: "Beverages" },
  { name: "Water Bottle", emoji: "💧", suggestedPrice: 40, category: "Beverages" },
  { name: "Chips", emoji: "🥔", suggestedPrice: 60, category: "Snacks" },
  { name: "Noodles", emoji: "🍜", suggestedPrice: 160, category: "Snacks" },
  { name: "Sandwich", emoji: "🥪", suggestedPrice: 140, category: "Snacks" },
];

const AdminShowList = () => {
  // --- Existing State ---
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ movieId: "", theaterId: "", date: "", time: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [admin, setAdmin] = useState({ name: "", role: "" });
  const location = useLocation();
  const navigate = useNavigate();

  const [showSeatPriceModal, setShowSeatPriceModal] = useState(false);
  const [seatPricesForm, setSeatPricesForm] = useState({
    showId: null,
    priceOfPremiumSeat: "",
    priceOfClassicPlusSeat: "",
    priceOfClassicSeat: "",
  });

  // --- New State for Food Management ---
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [currentShowForFood, setCurrentShowForFood] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [foodForm, setFoodForm] = useState({ name: "", price: "" });
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Get unique categories
  const categories = ["All", ...new Set(FOOD_OPTIONS.map(food => food.category))];

  // Filter food options based on category and search
  const filteredFoodOptions = FOOD_OPTIONS.filter(food => {
    const matchesCategory = selectedCategory === "All" || food.category === selectedCategory;
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  useEffect(() => {
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("username") || "Admin";
    setAdmin({ name, role: role || "ADMIN" });
    if (role !== "ADMIN") {
      navigate("/", { replace: true });
      return;
    }
    fetchAll();
  }, [navigate]);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const [showsRes, moviesRes, theatersRes] = await Promise.all([
        fetch("http://localhost:8080/shows/getAllShows", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8080/movies/all", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("http://localhost:8080/theaters", { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const showsData = await showsRes.json();
      const moviesData = await moviesRes.json();
      const theatersData = await theatersRes.json();
      setShows(showsData);
      setMovies(moviesData);
      setTheaters(theatersData);
    } catch (err) {
      setError("Failed to fetch shows, movies, or theaters.");
    } finally {
      setLoading(false);
    }
  };

  const getMovie = (id) => movies.find(m => m.id === id) || {};
  const getTheater = (id) => theaters.find(t => t.id === id) || {};

  // --- Existing Handlers (No Changes) ---
  const handleEdit = (show) => {
    setEditId(show.showId);
    setEditForm({
      movieId: show.movie?.id ? String(show.movie.id) : "",
      theaterId: show.theatre?.id ? String(show.theatre.id) : "",
      date: show.date || "",
      time: show.time ? show.time.slice(0, 5) : ""
    });
    setMessage("");
    setError("");
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      const formattedTime = editForm.time ? `${editForm.time}:00` : "";
      const payload = {
        movieId: parseInt(editForm.movieId, 10),
        theaterId: parseInt(editForm.theaterId, 10),
        date: editForm.date,
        time: formattedTime
      };
      const res = await fetch(`http://localhost:8080/shows/updateShow/${editId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMessage("Show updated successfully!");
        setEditId(null);
        fetchAll();
      } else {
        const errorData = await res.text();
        setError("Error: " + errorData);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (showId) => {
    if (!window.confirm("Are you sure you want to delete this show?")) return;
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/shows/deleteShow/${showId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("Show deleted successfully!");
        fetchAll();
      } else {
        const errorData = await res.text();
        setError("Error: " + errorData);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssociateClick = (showId) => {
    setSeatPricesForm({ ...seatPricesForm, showId });
    setShowSeatPriceModal(true);
    setMessage("");
    setError("");
  };

  const handleSeatPriceChange = (e) => {
    setSeatPricesForm({ ...seatPricesForm, [e.target.name]: parseInt(e.target.value) || "" });
  };

  const handleAssociateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/shows/associateShowSeats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(seatPricesForm),
      });

      if (res.ok) {
        const resultText = await res.text();
        setMessage(resultText);
        setShowSeatPriceModal(false);
        setSeatPricesForm({
          showId: null,
          priceOfPremiumSeat: "",
          priceOfClassicPlusSeat: "",
          priceOfClassicSeat: "",
        });
        fetchAll();
      } else {
        const errorText = await res.text();
        setError("Error: " + errorText);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- Enhanced Handlers for Food Management ---
  const handleAssociateFoodClick = async (show) => {
    setCurrentShowForFood(show);
    setShowFoodModal(true);
    setEditingFoodId(null);
    setFoodForm({ name: "", price: "" });
    setSelectedCategory("All");
    setSearchTerm("");
    setMessage("");
    setError("");
    try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:8080/show-food/show/${show.showId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setFoodItems(res.data);
    } catch (err) {
        setError("Failed to fetch food items for this show.");
        setFoodItems([]);
    }
  };

  const handleFoodFormChange = (e) => {
      setFoodForm({ ...foodForm, [e.target.name]: e.target.value });
  };

  const handleFoodSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setMessage("");
      setError("");
      const token = localStorage.getItem("token");
      const url = editingFoodId 
          ? `http://localhost:8080/show-food/update/${editingFoodId}` 
          : `http://localhost:8080/show-food/add`;
      const method = editingFoodId ? 'put' : 'post';

      try {
          await axios[method](url, 
              { ...foodForm, showId: currentShowForFood.showId, price: parseInt(foodForm.price) },
              { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
          );
          setMessage(`Food item ${editingFoodId ? 'updated' : 'added'} successfully!`);
          handleAssociateFoodClick(currentShowForFood); // Refresh food list
      } catch (err) {
          setError("Failed to submit food item.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleEditFood = (food) => {
      setEditingFoodId(food.id);
      setFoodForm({ name: food.name, price: food.price });
  };

  const handleDeleteFood = async (foodId) => {
      if (!window.confirm("Are you sure? This action cannot be undone.")) return;
      setSubmitting(true);
      setMessage("");
      setError("");
      const token = localStorage.getItem("token");
      try {
          await axios.delete(`http://localhost:8080/show-food/delete/${foodId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setMessage("Food item deleted successfully.");
          handleAssociateFoodClick(currentShowForFood); // Refresh list
      } catch (err) {
          setError("Failed to delete food item.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleQuickAddFood = (foodOption) => {
    setFoodForm({ name: foodOption.name, price: foodOption.suggestedPrice });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-blue-200 flex flex-col relative">
      <Navbar />
      <div className="flex flex-1 w-full max-w-8xl mx-auto">
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
        <main className="flex-1 py-12 px-2 md:px-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-pink-600 text-center tracking-tight drop-shadow-lg">Show List</h2>
          <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-2xl p-10 border-l-8 border-pink-500 mb-10 relative overflow-hidden min-h-[60vh] flex flex-col">
            {loading ? (
              <div className="text-center py-10 text-xl font-bold text-pink-600 animate-pulse">Loading shows...</div>
            ) : error ? (
              <div className="text-center text-lg text-red-600 font-semibold mb-4">{error}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-6 flex-1">
                {shows.length === 0 ? (
                  <div className="col-span-full text-center py-6 text-gray-500">No shows found.</div>
                ) : shows.map(show => {
                  const movie = show.movie || getMovie(show.movie?.id);
                  const theater = show.theatre || getTheater(show.theatre?.id);
                  return (
                    <div key={show.showId} className="relative rounded-3xl bg-white/90 backdrop-blur-md shadow-2xl p-6 flex flex-col items-center group hover:scale-105 transition-all duration-300 border-t-4 border-pink-400 min-h-[260px] w-full">
                      {editId === show.showId ? (
                        <form onSubmit={handleEditSubmit} className="w-full flex flex-col gap-3">
                          <select name="movieId" value={editForm.movieId} onChange={handleEditChange} required className="border px-3 py-2 rounded-xl w-full bg-white/60">
                            <option value="">Select Movie</option>
                            {movies.map(m => <option key={m.id} value={m.id}>{m.movieName}</option>)}
                          </select>
                          <select name="theaterId" value={editForm.theaterId} onChange={handleEditChange} required className="border px-3 py-2 rounded-xl w-full bg-white/60">
                            <option value="">Select Theater</option>
                            {theaters.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <input type="date" name="date" value={editForm.date} onChange={handleEditChange} required className="border px-3 py-2 rounded-xl w-full bg-white/60" />
                          <input type="time" name="time" value={editForm.time} onChange={handleEditChange} required className="border px-3 py-2 rounded-xl w-full bg-white/60" />
                          <div className="flex gap-2 mt-2 justify-center">
                            <button type="submit" disabled={submitting} className="bg-green-500 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-green-600">Save</button>
                            <button type="button" onClick={() => setEditId(null)} className="bg-gray-400 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-gray-500">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <img src={movie.imageUrl} alt={movie.movieName} className="w-16 h-20 object-cover rounded shadow border-2 border-pink-100 mb-2" onError={e => { e.target.onerror = null; e.target.src = `https://placehold.co/48x64/E0F2F7/000000?text=No+Image`; }} />
                          <div className="font-extrabold text-lg text-gray-800 mb-1 text-center truncate w-full">{movie.movieName}</div>
                          <div className="text-sm text-gray-600 mb-1 text-center">{theater.name}</div>
                          <div className="flex flex-wrap gap-2 justify-center mb-2">
                            <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full text-xs font-semibold">{show.date}</span>
                            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">{show.time ? show.time.slice(0, 5) : ""}</span>
                          </div>
                          {/* --- UPDATED BUTTONS SECTION --- */}
                          <div className="flex flex-wrap gap-2 mt-4 w-full justify-center">
                              <button title="Edit" onClick={() => handleEdit(show)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1.2 rounded-xl font-bold shadow-lg border-2 border-yellow-300 hover:scale-110 transition-all">Edit</button>
                              <button title="Delete" onClick={() => handleDelete(show.showId)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.2 rounded-xl font-bold shadow-lg border-2 border-red-300 hover:scale-110 transition-all">Delete</button>
                              <button title="Associate Seats" onClick={() => handleAssociateClick(show.showId)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.2 rounded-xl font-bold shadow-lg border-2 border-green-300 hover:scale-110 transition-all" disabled={submitting}>Seats</button>
                              <button title="Associate Food" onClick={() => handleAssociateFoodClick(show)} className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.2 rounded-xl font-bold shadow-lg border-2 border-purple-300 hover:scale-110 transition-all" disabled={submitting}>Food</button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {message && <div className="text-center mt-4 text-lg font-semibold text-green-600">{message}</div>}
            {error && <div className="text-center mt-4 text-lg font-semibold text-red-600">{error}</div>}
          </div>

          {showSeatPriceModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">Set Seat Prices</h3>
                <form onSubmit={handleAssociateSubmit}>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="priceOfPremiumSeat">
                      Premium Seat Price
                    </label>
                    <input type="number" id="priceOfPremiumSeat" name="priceOfPremiumSeat" value={seatPricesForm.priceOfPremiumSeat} onChange={handleSeatPriceChange} required className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="priceOfClassicPlusSeat">
                      Classic Plus Seat Price
                    </label>
                    <input type="number" id="priceOfClassicPlusSeat" name="priceOfClassicPlusSeat" value={seatPricesForm.priceOfClassicPlusSeat} onChange={handleSeatPriceChange} required className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="priceOfClassicSeat">
                      Classic Seat Price
                    </label>
                    <input type="number" id="priceOfClassicSeat" name="priceOfClassicSeat" value={seatPricesForm.priceOfClassicSeat} onChange={handleSeatPriceChange} required className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button type="button" onClick={() => setShowSeatPriceModal(false)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors" disabled={submitting}>Cancel</button>
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors" disabled={submitting}>
                      {submitting ? "Associating..." : "Associate Seats"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* --- ENHANCED FOOD MANAGEMENT MODAL --- */}
          {showFoodModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🍿</span>
                        </div>
                        <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Manage Food Menu</h3>
                        <p className="text-gray-600">Add delicious snacks and beverages for your show</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Left Side - Add/Edit Form */}
                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                            <h4 className="font-bold text-xl mb-6 text-gray-800 flex items-center gap-3">
                                <span className="text-2xl">✏️</span>
                                {editingFoodId ? 'Edit Food Item' : 'Add New Food'}
                            </h4>
                            <form onSubmit={handleFoodSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">Food Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        placeholder="Enter food name..." 
                                        value={foodForm.name} 
                                        onChange={handleFoodFormChange} 
                                        required 
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-medium mb-2">Price (₹)</label>
                                    <input 
                                        type="number" 
                                        name="price" 
                                        placeholder="Enter price..." 
                                        value={foodForm.price} 
                                        onChange={handleFoodFormChange} 
                                        required 
                                        className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80" 
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        type="submit" 
                                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105" 
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Saving...' : editingFoodId ? 'Update Item' : 'Add Item'}
                                    </button>
                                    {editingFoodId && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setEditingFoodId(null); setFoodForm({ name: "", price: "" }); }} 
                                            className="bg-gray-400 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-500 transition-all duration-300"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* Right Side - Current Menu */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                            <h4 className="font-bold text-xl mb-6 text-gray-800 flex items-center gap-3">
                                <span className="text-2xl">📋</span>
                                Current Menu
                            </h4>
                            <div className="max-h-64 overflow-y-auto space-y-3">
                                {foodItems.length > 0 ? foodItems.map(food => (
                                    <div key={food.id} className="flex justify-between items-center p-4 bg-white/80 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">🍽️</span>
                                            <div>
                                                <p className="font-semibold text-gray-800">{food.name}</p>
                                                <p className="text-sm text-gray-600">₹{food.price}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleEditFood(food)} 
                                                className="bg-yellow-400 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-yellow-500 transition-all duration-300 transform hover:scale-105"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteFood(food.id)} 
                                                className="bg-red-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 transform hover:scale-105"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <span className="text-4xl mb-4 block">🍽️</span>
                                        <p>No food items have been added yet.</p>
                                        <p className="text-sm">Use the form on the left to add items!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Add Section */}
                    <div className="mt-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                        <h4 className="font-bold text-xl mb-6 text-gray-800 flex items-center gap-3">
                            <span className="text-2xl">⚡</span>
                            Quick Add Popular Items
                        </h4>
                        
                        {/* Category Filter */}
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2 mb-4">
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 ${
                                            selectedCategory === category
                                                ? 'bg-purple-500 text-white shadow-lg'
                                                : 'bg-white/80 text-gray-700 hover:bg-purple-100'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Search */}
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Search food items..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/80"
                                />
                            </div>
                        </div>

                        {/* Food Options Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredFoodOptions.map((foodOption, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleQuickAddFood(foodOption)}
                                    className="bg-white/80 p-4 rounded-xl border border-yellow-200 hover:border-purple-300 transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
                                >
                                    <div className="text-center">
                                        <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform duration-300">
                                            {foodOption.emoji}
                                        </span>
                                        <p className="font-semibold text-gray-800 text-sm mb-1">{foodOption.name}</p>
                                        <p className="text-xs text-gray-600">₹{foodOption.suggestedPrice}</p>
                                        <div className="mt-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                            {foodOption.category}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end mt-8">
                        <button 
                            onClick={() => setShowFoodModal(false)} 
                            className="bg-gray-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                        >
                            Close Menu
                        </button>
                    </div>
                </div>
            </div>
          )}

        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminShowList;