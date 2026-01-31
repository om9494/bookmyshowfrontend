import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";

const SelectSeatsModal = ({ isOpen, onClose, onSelect, theater, time }) => {
  const [count, setCount] = useState(1);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs relative">
        <button
          className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-lg font-bold mb-4 text-center">Select Number of Seats</h2>
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            className="text-2xl px-3 py-1 border rounded"
            onClick={() => setCount((c) => Math.max(1, c - 1))}
          >
            -
          </button>
          <span className="text-xl font-semibold">{count}</span>
          <button
            className="text-2xl px-3 py-1 border rounded"
            onClick={() => setCount((c) => Math.min(10, c + 1))}
          >
            +
          </button>
        </div>
        <button
          className="w-full bg-red-500 text-white py-2 rounded font-semibold hover:bg-red-600 transition"
          onClick={() => onSelect(count)}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

const BookTickets = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modal, setModal] = useState({ open: false, theater: null, time: null, showId: null });
  const [movieDetails, setMovieDetails] = useState({});
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dates[0]?.date || new Date().toISOString().split("T")[0]); // Default to the first date if available
  const [theaters, setTheaters] = useState([]);
  const [loadingShowtimes, setLoadingShowtimes] = useState(true); // Added loading state
  const [cinemas, setCinemas] = useState([]);

  // Fetch movie details if needed
  useEffect(() => {
    const fetchMovieDetails = async () => {
      // console.log("Fetching movie details for ID:", id);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/movies/id/${id}`);
        // console.log("Response:", response);
        if (response.status !== 200) {
          throw new Error("Network response was not ok");
        }
        const data = response.data;
        setMovieDetails(data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
      }
    };
    fetchMovieDetails();
  }, []);


  // Generate dates for the next week
  useEffect(() => {
    const nextWeekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        day: date.toLocaleString("en-US", { weekday: "short" }).toUpperCase(),
        date: date.getDate().toString().padStart(2, "0"),
        month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      };
    });
    setDates(nextWeekDates.map(d => ({ ...d, date: `${new Date().getFullYear()}-${new Date(Date.parse(`${d.month} ${d.date}, ${new Date().getFullYear()}`)).getMonth() + 1}-${d.date}` })));
  }, []);


  // fetch the theaters
  useEffect(() => {
    const fetchTheaters = async () => {
      const city = localStorage.getItem("city") || "Pune";

      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/theaters/city/${city}`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (response.status !== 200) {
          throw new Error("Network response was not ok");
        }
        const data = response.data;
        // console.log("Theaters data:", data); // Log the theaters data
        setTheaters(data);
        // console.log("Fetched theaters:", theaters);
      } catch (error) {
        console.error("Error fetching theaters:", error);
      }
    };
    fetchTheaters();
  }, []);

  // Fetch showtimes and set it into cinema as per the theater id returned in the response
  useEffect(() => {
    const fetchShowtimes = async () => {
      setLoadingShowtimes(true); // Set loading state to true before fetching
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/shows/theaterAndShowTimingsByMovie`, {
          params: {
            movieId: id,
            city: localStorage.getItem("city") || "Pune",
            date: selectedDate || new Date().toISOString().split("T")[0] // Use the selected date or today's date if not set
          },
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        });
        if (response.status !== 200) {
          throw new Error("Network response was not ok");
        }
        // console.log(response);
        const data = response.data;
        // console.log("Showtimes data with theater_id as key:", data);
        // console.log("Theaters data:", theaters); // Log the theaters data
        const formattedCinemas = [];
        for (const theater of theaters) {
          const showtimesWithShowIds = data[theater.id] || [];
          const showtimes = [];
          for (const showId in showtimesWithShowIds) {
            const showTime = showtimesWithShowIds[showId];
            showtimes.push({ showId, showTime });
          }
          if (showtimes.length > 0) {
            formattedCinemas.push({
              id: theater.id,
              ...theater,
              showtimes,
              info: "Cancellation available"
            });
          }
        }
        setCinemas(formattedCinemas);
        setLoadingShowtimes(false); // Set loading state to false after fetching
      } catch (error) {
        console.error("Error fetching showtimes:", error);
        setCinemas([]);
      }
    };

    if (id && selectedDate) {
      setLoadingShowtimes(true);
      fetchShowtimes();
    }
  }, [id, selectedDate, theaters]);

  const handleDateChange = (day) => setSelectedDate(day.date);


  const handleShowtimeClick = (theater, time, showId) => {
    setModal({ open: true, theater, time, showId });
  };

  const handleSelectSeats = (count) => {
    setModal({ open: false, theater: null, time: null, showId: null });
    navigate(`/movie/${id}/book/seats?theatre=${encodeURIComponent(modal.theater)}&showId=${encodeURIComponent(modal.showId)}&count=${count}&time=${encodeURIComponent(modal.time)}`);
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />
      <div className="w-full px-0 md:px-12 lg:px-24 xl:px-32 2xl:px-64 py-10">
        <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-10">
          <h1 className="text-4xl font-extrabold mb-2 text-left text-red-600 tracking-tight">
            {(movieDetails && movieDetails.movieName) || "Loading..."} <span className="text-gray-400 font-normal text-2xl">({(movieDetails && movieDetails.language) || "Loading..."})</span>
          </h1>
          {/* Movie Genre */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-pink-100 text-pink-700 px-4 py-1 rounded-full text-base font-semibold">
              {movieDetails && movieDetails.genre || "Loading..."}
            </span>
          </div>

          {/* Date selection */}
          <div className="flex gap-3 mb-10 overflow-x-auto pb-2 border-b-2 border-pink-100">
            {dates.map((d, i) => (
              <div
                key={i}
                className={`flex flex-col items-center px-6 py-3 rounded-xl cursor-pointer border-2 font-bold min-w-[80px] transition-all duration-150 shadow-sm select-none ${selectedDate === d.date
                  ? "bg-red-500 text-white border-red-500 scale-105 shadow-lg"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-pink-50 hover:border-pink-300"}`}
                onClick={() => handleDateChange(d)}
              >
                <span className="text-base">{d.day}</span>
                <span className="text-2xl font-extrabold">{d.date.split("-")[2]}</span>
                <span className="text-xs">{d.month}</span>
              </div>
            ))}
          </div>

          {/* Cinema list */}
          <div className="mt-10">
            {loadingShowtimes ? (
              <p className="text-lg text-gray-500">Loading showtimes...</p>
            ) : cinemas.length > 0 ? (
              cinemas.map((cinema, idx) => (
                <div key={idx} className="bg-white rounded-2xl shadow-lg border-2 border-pink-100 p-8 mb-8 flex flex-col gap-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-4">
                      {/* Cinema logo placeholder */}
                      <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center text-pink-500 font-extrabold text-xl border-2 border-pink-200 shadow">
                        {cinema.name?.split(' ')[0]?.[0] || 'C'}
                      </div>
                      <div className="font-bold text-lg text-gray-800">{cinema.name}</div>
                    </div>
                    <div className="text-xs text-green-600 font-semibold flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                      {cinema.info}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2">
                    {cinema.showtimes.map((showtime, i) => (
                      <button
                        key={showtime.showId}
                        id={showtime.showId}
                        className="border-2 border-green-500 text-green-700 px-6 py-3 rounded-lg font-bold text-lg bg-white hover:bg-green-50 hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-400"
                        onClick={() => handleShowtimeClick(cinema.id, showtime.showTime, showtime.showId)}
                      >
                        {showtime.showTime}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-lg text-gray-500">No cinemas available for the selected date.</p>
            )}
          </div>
        </div>
      </div>
      <SelectSeatsModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, theatre: null, time: null, showId: null })}
        onSelect={handleSelectSeats}
        theater={modal.theater}
        time={modal.time}
      />
      <Footer />
    </div>
  );
};

export default BookTickets;