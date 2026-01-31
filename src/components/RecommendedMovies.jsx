import React, { useState, useEffect } from "react";
import MovieCard from "./MovieCard";
import axios from "axios";

const RecommendedMovies = () => {
  const [movies, setMovies] = useState([]);
  const [grouped, setGrouped] = useState({});

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/movies/all`);
        setMovies(response.data);
      } catch (error) {
        console.error("Error fetching recommended movies:", error);
      }
    };
    fetchMovies();
  }, []);

  useEffect(() => {
    // Group movies by genre (category)
    const byGenre = {};
    movies.forEach((movie) => {
      const genre = movie.genre && movie.genre.trim() ? movie.genre : "Other";
      if (!byGenre[genre]) byGenre[genre] = [];
      byGenre[genre].push(movie);
    });
    setGrouped(byGenre);
  }, [movies]);

  return (
    <>
      {/* Decorative background shapes */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-200 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Recommended Movies</h2>
        <a href="#" className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold px-5 py-2 rounded-xl shadow-md hover:from-red-500 hover:to-pink-500 hover:scale-105 transition-all text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-pink-400">See All &gt;</a>
      </div>
      <div className="space-y-12">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center text-gray-500 py-8">No movies found.</div>
        ) : (
          Object.entries(grouped).map(([genre, genreMovies]) => (
            <div key={genre}>
              <h3 className="text-xl md:text-2xl font-bold text-pink-600 mb-4 ml-2">{genre}</h3>
              <div
                className="flex overflow-x-auto gap-6 pb-2 md:grid md:grid-cols-4 lg:grid-cols-6 md:gap-10 md:overflow-visible scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100 scroll-smooth"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {genreMovies.map((movie) => (
                  <div key={movie._id} className="min-w-[160px] md:min-w-0">
                    <MovieCard
                      id={movie._id}
                      title={movie.movieName}
                      poster={movie.imageUrl}
                      genre={movie.genre}
                      rating={movie.rating}
                      year={movie.year}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default RecommendedMovies;
