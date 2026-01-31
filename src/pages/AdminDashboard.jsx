import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
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

const AdminDashboard = () => {
  const [admin, setAdmin] = useState({ name: "", role: "" });
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostShowsMovie, setMostShowsMovie] = useState(null);
  const [mostShowsMovieCollection, setMostShowsMovieCollection] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const name = localStorage.getItem("username") || "Admin";
    const role = localStorage.getItem("role") || "ADMIN";
    setAdmin({ name, role });
    const fetchAll = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const [moviesRes, theatersRes, showsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_BACKEND_API}/movies/all`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_BACKEND_API}/theaters`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_BACKEND_API}/shows/getAllShows`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setMovies(moviesRes.data);
        setTheaters(theatersRes.data);
        setShows(showsRes.data);
        // Fetch movie with most shows
        try {
          const mostShowsRes = await axios.get(`${import.meta.env.VITE_BACKEND_API}/shows/movieHavingMostShows`, { headers: { Authorization: `Bearer ${token}` } });
          const movieName = mostShowsRes.data;
          setMostShowsMovie(movieName);
          // Find movieId by name
          const foundMovie = moviesRes.data.find(m => m.movieName === movieName);
          if (foundMovie) {
            // Fetch total collection for this movie
            try {
              const collectionRes = await axios.get(`${import.meta.env.VITE_BACKEND_API}/shows/totalCollection/${foundMovie._id}`, { headers: { Authorization: `Bearer ${token}` } });
              setMostShowsMovieCollection(collectionRes.data);
            } catch (e) {
              setMostShowsMovieCollection(null);
            }
          } else {
            setMostShowsMovieCollection(null);
          }
        } catch (e) {
          setMostShowsMovie(null);
          setMostShowsMovieCollection(null);
        }
      } catch (err) {
        // fallback: empty
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Recent activity: last 5 movies, theaters, shows
  const recentMovies = movies.slice(-2).reverse();
  const recentTheaters = theaters.slice(-2).reverse();
  const recentShows = shows.slice(-2).reverse();

  // Static revenue and stats (placeholder)
  const totalRevenue = 32640;
  const totalSales = 145;
  const totalCustomers = 1244;
  const revenueIncrease = 8;
  const salesIncrease = 12;
  const customersDecrease = 12;

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
        <main className="flex-1 py-12 px-2 md:px-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-red-600 text-center tracking-tight drop-shadow-lg">Admin Dashboard</h2>
          {loading ? (
            <div className="text-center text-xl text-gray-400 py-20">Loading dashboard...</div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                <div className="rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl p-8 border-t-4 border-blue-500 flex flex-col gap-2">
                  <div className="text-gray-500 font-semibold">Movies</div>
                  <div className="text-3xl font-extrabold text-blue-600">{movies.length}</div>
                  <div className="text-xs text-green-600 font-bold">+{salesIncrease}% increase</div>
                </div>
                <div className="rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl p-8 border-t-4 border-green-500 flex flex-col gap-2">
                  <div className="text-gray-500 font-semibold">Theaters</div>
                  <div className="text-3xl font-extrabold text-green-600">{theaters.length}</div>
                  <div className="text-xs text-green-600 font-bold">+{revenueIncrease}% increase</div>
                </div>
                <div className="rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl p-8 border-t-4 border-pink-500 flex flex-col gap-2">
                  <div className="text-gray-500 font-semibold">Shows</div>
                  <div className="text-3xl font-extrabold text-pink-600">{shows.length}</div>
                  <div className="text-xs text-green-600 font-bold">+{salesIncrease}% increase</div>
                </div>
                <div className="rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl p-8 border-t-4 border-yellow-500 flex flex-col gap-2">
                  <div className="text-gray-500 font-semibold">Revenue (Static)</div>
                  <div className="text-3xl font-extrabold text-yellow-600">₹{totalRevenue.toLocaleString()}</div>
                  <div className="text-xs text-green-600 font-bold">+{revenueIncrease}% increase</div>
                </div>
              </div>
              {/* Admin Details & Recent Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl p-8 border-l-4 border-blue-500 flex flex-col gap-2">
                  <div className="text-lg font-bold text-gray-700 mb-2">Admin Details</div>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white text-2xl font-extrabold border-2 border-pink-200 shadow-lg">
                      {admin.name[0]}
                    </span>
                    <div>
                      <div className="font-bold text-xl text-gray-800">{admin.name}</div>
                      <div className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded mt-1 font-bold uppercase inline-block">{admin.role}</div>
                      <div className="text-xs text-gray-500 mt-1">Email: admin@email.com</div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/80 backdrop-blur-md shadow-2xl p-8 border-l-4 border-green-500">
                  <div className="text-lg font-bold text-gray-700 mb-2">Recent Activity</div>
                  <ul className="text-sm text-gray-700 space-y-2">
                    {recentMovies.map(m => (
                      <li key={m._id} className="flex items-center gap-2"><span className="text-blue-500">🎬</span> Added movie <span className="font-bold">{m.movieName}</span></li>
                    ))}
                    {recentTheaters.map(t => (
                      <li key={t._id} className="flex items-center gap-2"><span className="text-green-500">🏢</span> Added theater <span className="font-bold">{t.name}</span></li>
                    ))}
                    {recentShows.map(s => (
                      <li key={s._id} className="flex items-center gap-2"><span className="text-pink-500">🕒</span> Added show <span className="font-bold">{s.date} {s.time}</span></li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* Static Graph and Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl p-8 border-l-4 border-purple-500 flex flex-col items-center">
                  <div className="text-lg font-bold text-gray-700 mb-4">Reports</div>
                  {/* Static SVG Line Chart */}
                  <svg viewBox="0 0 300 100" className="w-full h-32">
                    <polyline fill="none" stroke="#6366f1" strokeWidth="3" points="0,80 40,60 80,65 120,20 160,40 200,10 240,30 280,20" />
                    <polyline fill="none" stroke="#22c55e" strokeWidth="3" points="0,90 40,80 80,70 120,60 160,50 200,40 240,30 280,20" />
                    <polyline fill="none" stroke="#f43f5e" strokeWidth="3" points="0,95 40,90 80,85 120,80 160,75 200,70 240,65 280,60" />
                  </svg>
                  {/* Additional SVG Bar Chart */}
                  <svg viewBox="0 0 300 100" className="w-full h-32 mt-4">
                    <rect x="10" y="60" width="30" height="30" fill="#fbbf24" />
                    <rect x="50" y="40" width="30" height="50" fill="#f472b6" />
                    <rect x="90" y="20" width="30" height="70" fill="#60a5fa" />
                    <rect x="130" y="50" width="30" height="40" fill="#34d399" />
                    <rect x="170" y="30" width="30" height="60" fill="#a78bfa" />
                    <rect x="210" y="70" width="30" height="20" fill="#f87171" />
                  </svg>
                  <div className="flex gap-4 mt-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500 rounded-full inline-block"></span> Sales</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span> Revenue</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-pink-500 rounded-full inline-block"></span> Customers</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl p-8 border-l-4 border-yellow-500 flex flex-col items-center justify-center">
                  <div className="text-lg font-bold text-gray-700 mb-4">Summary</div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center justify-between w-full text-gray-700 font-semibold"><span>Total Sales</span><span>{totalSales}</span></div>
                    <div className="flex items-center justify-between w-full text-gray-700 font-semibold"><span>Total Customers</span><span>{totalCustomers}</span></div>
                    <div className="flex items-center justify-between w-full text-gray-700 font-semibold"><span>Total Revenue</span><span>₹{totalRevenue.toLocaleString()}</span></div>
                    {/* Dynamic: Movie with most shows */}
                    <div className="flex items-center justify-between w-full text-gray-700 font-semibold">
                      <span>Movie with Most Shows</span>
                      <span>{mostShowsMovie ? mostShowsMovie : "-"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard; 