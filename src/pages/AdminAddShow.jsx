import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useLocation, useNavigate } from "react-router-dom";

const ADMIN_SIDEBAR_LINKS = [
  { label: "Dashboard", icon: "🏠", path: "/admin/dashboard" },
  { label: "Movies", icon: "🎬", path: "/admin/movies" },
  { label: "Add Movie", icon: "➕", path: "/admin/add-movie" },
  { label: "Theaters", icon: "🏢", path: "/admin/theaters" },
  { label: "Add Theater", icon: "➕", path: "/admin/add-theater" },
  { label: "Shows", icon: "🕒", path: "/admin/shows" },
  { label: "Add Show", icon: "➕", path: "/admin/add-show" },
];

const AdminAddShow = () => {
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [form, setForm] = useState({ movieId: "", theaterId: "", date: "", time: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState({ name: "", role: "" });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("username") || "Admin";
    setAdmin({ name, role: role || "ADMIN" });
    if (role !== "ADMIN") {
      navigate("/", { replace: true });
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [moviesRes, theatersRes] = await Promise.all([
          fetch("https://bookmyshow-backend.onrender.com/movies/all", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch("https://bookmyshow-backend.onrender.com//theaters", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        const moviesData = await moviesRes.json();
        const theatersData = await theatersRes.json();
        setMovies(moviesData);
        setTheaters(theatersData);
      } catch (err) {
        setError("Failed to fetch movies or theaters. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear messages when user starts typing again
    setError("");
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // --- START OF FIX: Time validation logic ---
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Check only applies if the selected date is today
    if (form.date === today) {
      const selectedDateTime = new Date(`${form.date}T${form.time}:00`);
      
      // Calculate the minimum allowed time (current time + 3 hours)
      const minAllowedTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);

      if (selectedDateTime < minAllowedTime) {
        setError("Invalid Time: For today's date, the show time must be at least 3 hours from now.");
        return; // Stop the submission
      }
    }
    // --- END OF FIX ---

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const formattedTime = form.time ? `${form.time}:00` : "";
      const payload = {
        movieId: parseInt(form.movieId, 10),
        theaterId: parseInt(form.theaterId, 10),
        date: form.date,
        time: formattedTime
      };
      const res = await fetch("https://bookmyshow-backend.onrender.com/shows/addShow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMessage("Show added successfully!");
        setForm({ movieId: "", theaterId: "", date: "", time: "" });
      } else {
        const errorData = await res.text();
        setError("Error: " + errorData);
      }
    } catch (err) {
      setError("Network error. Please ensure the backend is running and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-blue-200 flex flex-col relative">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-200 opacity-30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-blue-200 opacity-20 rounded-full blur-2xl animate-bounce"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-yellow-100 opacity-20 rounded-full blur-2xl animate-pulse"></div>
      </div>
      <Navbar />
      <div className="flex flex-1 w-full max-w-12xl mx-auto">
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
        <main className="flex-1 flex flex-col items-center justify-center py-12 px-2 md:px-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-pink-600 text-center tracking-tight drop-shadow-lg">Add Show</h2>
          <div className="w-full max-w-8xl mx-auto">
            <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-2xl p-12 border-t-8 border-pink-500 relative overflow-hidden min-h-[480px] flex flex-col justify-center">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-pink-200 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
              {loading ? (
                <div className="text-center py-10 text-xl font-bold text-pink-600 animate-pulse">Loading movies and theaters...</div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 w-full">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Select Movie</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {movies.length > 0 ? (
                          movies.map(movie => (
                            <div
                              key={movie.id}
                              className={`border rounded-xl p-3 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ease-in-out shadow-md bg-white/60 hover:shadow-lg ${form.movieId === String(movie.id) ? 'border-pink-500 bg-pink-50 scale-105' : 'border-gray-200'}`}
                              onClick={() => setForm(f => ({ ...f, movieId: String(movie.id) }))}
                            >
                              <img src={movie.imageUrl} alt={movie.movieName} className="w-16 h-20 object-cover rounded shadow border-2 border-pink-100" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/48x64/E0F2F7/000000?text=No+Image`; }} />
                              <div className="font-semibold text-gray-800 text-center text-sm truncate w-full">{movie.movieName}</div>
                              <div className="text-xs text-gray-500">{movie.genre} | {movie.language}</div>
                            </div>
                          ))
                        ) : (
                          <p className="col-span-full text-center text-gray-500">No movies available. Please add movies first.</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Select Theater</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {theaters.length > 0 ? (
                          theaters.map(theater => (
                            <div
                              key={theater.id}
                              className={`border rounded-xl p-3 flex flex-col gap-1 cursor-pointer transition-all duration-200 ease-in-out shadow-md bg-white/60 hover:shadow-lg ${form.theaterId === String(theater.id) ? 'border-pink-500 bg-pink-50 scale-105' : 'border-gray-200'}`}
                              onClick={() => setForm(f => ({ ...f, theaterId: String(theater.id) }))}
                            >
                              <div className="font-semibold text-gray-800 text-center text-sm truncate w-full">{theater.name}</div>
                              <div className="text-xs text-gray-500">{theater.address}, {theater.city}</div>
                              <div className="text-xs text-gray-400">Screens: {theater.numberOfScreens}</div>
                            </div>
                          ))
                        ) : (
                          <p className="col-span-full text-center text-gray-500">No theaters available. Please add theaters first.</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Date</label>
                      <input
                        type="date"
                        name="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/60"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-bold mb-2">Time</label>
                      <input
                        type="time"
                        name="time"
                        value={form.time}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white/60"
                      />
                    </div>
                  </div>
                  
                  {/* --- START: Styled Message/Error Display --- */}
                  <div className="h-10"> {/* Placeholder to prevent layout shift */}
                    {message && 
                      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-r-lg text-center font-semibold" role="alert">
                        {message}
                      </div>
                    }
                    {error && 
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg text-center font-semibold" role="alert">
                        {error}
                      </div>
                    }
                  </div>
                  {/* --- END: Styled Message/Error Display --- */}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting || !form.movieId || !form.theaterId || !form.date || !form.time}
                      className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold py-3 px-10 rounded-xl shadow-lg hover:from-pink-600 hover:to-red-600 text-lg transition-all duration-300 ease-in-out disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? "Adding Show..." : "Add Show"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminAddShow;
