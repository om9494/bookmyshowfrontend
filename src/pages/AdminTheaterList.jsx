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

const AdminTheaterList = () => {
  const [theaters, setTheaters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", address: "", city: "", numberOfScreens: "" });
  const [admin, setAdmin] = useState({ name: "", role: "" });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const name = localStorage.getItem("username") || "Admin";
    setAdmin({ name, role: role || "ADMIN" });
    if (role !== "ADMIN") {
      navigate("/", { replace: true });
    } else {
      fetchTheaters();
    }
    // eslint-disable-next-line
  }, []);

  const fetchTheaters = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/theaters", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch theaters");
      const data = await res.json();
      setTheaters(data);
      setFiltered(data);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!search) {
      setFiltered(theaters);
    } else {
      setFiltered(
        theaters.filter(
          t => t.name.toLowerCase().includes(search.toLowerCase()) || t.city.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, theaters]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this theater?")) return;
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/theaters/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete theater");
      setSuccess("Theater deleted successfully.");
      setTheaters(theaters.filter(t => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (theater) => {
    setEditId(theater.id);
    setEditForm({
      name: theater.name,
      address: theater.address,
      city: theater.city,
      numberOfScreens: theater.numberOfScreens
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (id) => {
    setError("");
    setSuccess("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/theaters/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name,
          address: editForm.address,
          city: editForm.city,
          numberOfScreens: parseInt(editForm.numberOfScreens, 10)
        })
      });
      if (!res.ok) throw new Error("Failed to update theater");
      setSuccess("Theater updated successfully.");
      setEditId(null);
      fetchTheaters();
    } catch (err) {
      setError(err.message);
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
      <Navbar />
      <div className="flex flex-1 w-full max-w-8xl mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-60 min-h-full py-10 px-4 bg-white/70 backdrop-blur-md border-r border-gray-200 shadow-2xl rounded-tr-3xl rounded-br-3xl mt-8 mb-8 mr-6">
          <div className="flex flex-col items-center mb-10">
            <span className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white text-2xl font-extrabold border-2 border-pink-200 shadow-lg mb-2">
              {admin.name ? admin.name[0] : "A"}
            </span>
            <div className="font-bold text-lg text-gray-800">{admin.name || "Admin"}</div>
            <div className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded mt-1 font-bold uppercase inline-block">{admin.role || "ADMIN"}</div>
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
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-red-600 text-center tracking-tight drop-shadow-lg">Theater List</h2>
          <div className="rounded-3xl bg-white/80 backdrop-blur-md shadow-2xl p-10 border-l-8 border-purple-500 mb-10 relative overflow-hidden min-h-[60vh] flex flex-col">
            {/* Decorative shapes */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-pink-200 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <input
                type="text"
                placeholder="Search by name or city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 w-full sm:w-80 bg-white/60"
              />
              <button
                onClick={() => navigate("/admin/add-theater")}
                className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-2 px-6 rounded-xl shadow hover:from-pink-600 hover:to-red-600 text-lg transition"
              >
                Add Theater
              </button>
            </div>
            {loading ? (
              <div className="text-center py-10 text-xl font-bold text-pink-600 animate-pulse">Loading theaters...</div>
            ) : error ? (
              <div className="text-center py-4 text-lg font-semibold text-red-600">{error}</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mt-6 flex-1">
                {filtered.length === 0 ? (
                  <div className="col-span-full text-center py-6 text-gray-500">No theaters found.</div>
                ) : filtered.map(theater => (
                  <div key={theater.id} className="relative rounded-3xl bg-white/90 backdrop-blur-md shadow-2xl p-6 flex flex-col items-center group hover:scale-105 transition-all duration-300 border-t-4 border-purple-400 min-h-[260px] w-full">
                    {editId === theater.id ? (
                      <form onSubmit={() => handleUpdate(theater.id)} className="w-full flex flex-col gap-3">
                        <input type="text" name="name" value={editForm.name} onChange={handleEditChange} className="border px-3 py-2 rounded-xl w-full bg-white/60" />
                        <input type="text" name="address" value={editForm.address} onChange={handleEditChange} className="border px-3 py-2 rounded-xl w-full bg-white/60" />
                        <input type="text" name="city" value={editForm.city} onChange={handleEditChange} className="border px-3 py-2 rounded-xl w-full bg-white/60" />
                        <input type="number" name="numberOfScreens" value={editForm.numberOfScreens} onChange={handleEditChange} min="1" className="border px-3 py-2 rounded-xl w-full bg-white/60" />
                        <div className="flex gap-2 mt-2 justify-center">
                          <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-green-600">Save</button>
                          <button type="button" onClick={() => setEditId(null)} className="bg-gray-400 text-white px-4 py-2 rounded-xl font-semibold shadow hover:bg-gray-500">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="font-extrabold text-lg text-gray-800 mb-1 text-center truncate w-full">{theater.name}</div>
                        <div className="text-sm text-gray-600 mb-1 text-center">{theater.address}</div>
                        <div className="flex flex-wrap gap-2 justify-center mb-2">
                          <span className="bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full text-xs font-semibold">{theater.city}</span>
                          <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-semibold">Screens: {theater.numberOfScreens}</span>
                        </div>
                        <div className="flex gap-3 mt-4 w-full justify-center">
                          <button onClick={() => startEdit(theater)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-semibold shadow text-sm transition-all">Edit</button>
                          <button onClick={() => handleDelete(theater.id)} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold shadow text-sm transition-all">Delete</button>
                          <button onClick={() => navigate(`/admin/theaters/${theater.id}/seats`)} className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold shadow text-sm transition-all">Manage Seats</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            {success && <div className="text-center mt-4 text-lg font-semibold text-green-600">{success}</div>}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default AdminTheaterList; 