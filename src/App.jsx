import React, { createContext, useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MovieDetails from "./pages/MovieDetails";
import BookTickets from "./pages/BookTickets";
import SeatSelection from "./pages/SeatSelection";
import BookingSummary from "./pages/BookingSummary";
import Profile from "./pages/Profile";
import AdminSignup from "./pages/AdminSignup";
import AdminAddMovie from "./pages/AdminAddMovie";
import SearchResults from "./components/SearchResults";
import TheaterDetails from "./pages/TheaterDetails";
import AdminMovieList from "./pages/AdminMovieList";
import AdminDashboard from "./pages/AdminDashboard";
import Chatbot from "./components/Chatbot";
import axios from "axios";

export const UserContext = createContext();
export const AdminContext = createContext();
import AdminAddTheater from "./pages/AdminAddTheater";
import AdminTheaterList from "./pages/AdminTheaterList";
import AdminTheaterSeats from "./pages/AdminTheaterSeats";
import AdminAddShow from "./pages/AdminAddShow";
import AdminShowList from "./pages/AdminShowList";
import AssociateShowSeats from "./components/AssociateShowSeats";
import PaymentSummary from "./pages/PaymentSummary"; // 1. IMPORT THE COMPONENT

function App() {

  const ProtectedRoute = ({ element, ...rest }) => {
    return (localStorage.getItem("token")) ? element : <Navigate to="/login" />
  }

  const AdminProtectedRoute = ({ element, ...rest }) => {
    if(localStorage.getItem("role") === "USER"){ // Use strict equality
      alert("You are not an admin!");
      return <Navigate to="/" />
    }
    return (localStorage.getItem("role") === "ADMIN") ? element : <Navigate to="/login" />
  }

  const ReloginProtectedRoute = ({ element, ...rest }) => {
    return (localStorage.getItem("token")) ? <Navigate to="/" /> : element
  }

  useEffect(() => {
    const abortController = new AbortController();
    const token = localStorage.getItem("token");
    if (token) {
      const checkSession = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/signup/profile`, {
            headers: {
              "Authorization": "Bearer " + token,
            },
            signal: abortController.signal,
          });
          localStorage.setItem("username", response.data.username);
          localStorage.setItem("role", response.data.roles[0]);
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        } catch (err) {
          if (axios.isCancel(err)) {
            console.log("Session check request canceled.");
            return;
          }
          localStorage.removeItem("token");
          localStorage.removeItem("username");
          localStorage.removeItem("role");
          delete axios.defaults.headers.common["Authorization"];
          alert("Session expired. Please login again.");
          window.location.href = "/login";
        }
      };
      checkSession();
    }

    return () => {
      abortController.abort();
    };
  }, []);


  return (
    <UserContext.Provider value={[null, null]}>
      <AdminContext.Provider value={[null, null]} >
        <Router>
          <Chatbot/>
          <Routes>

            <Route path="/" element={<Home />} />
            <Route path="/login" element={<ReloginProtectedRoute element = {<Login />} />} />
            <Route path="/signup" element={<ReloginProtectedRoute element = {<Signup />} />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/movie/:id/book" element={<ProtectedRoute element = {<BookTickets />} />} />
            <Route path="/movie/:id/book/seats" element={<ProtectedRoute element = {<SeatSelection />} />} />
            
            {/* 2. ADD THE ROUTE FOR THE PAYMENT SUMMARY PAGE */}
            <Route path="/payment-summary" element={<ProtectedRoute element = {<PaymentSummary />} />} />
            
            <Route path="/booking-summary" element={<ProtectedRoute element = {<BookingSummary />} />} />
            <Route path="/profile" element={<ProtectedRoute element = {<Profile />}/>} />
            <Route path="/admin/signup" element = {<AdminSignup />} />
            <Route path="/admin/add-movie" element={<AdminProtectedRoute element = {<AdminAddMovie />}/>} />
            <Route path="/admin/movies" element={<AdminProtectedRoute element = {<AdminMovieList />} />} />
            <Route path="/admin/dashboard" element={<AdminProtectedRoute element = {<AdminDashboard />} />} />
            <Route path="/admin/add-theater" element={<AdminProtectedRoute element = {<AdminAddTheater/>} />} />
            <Route path="/admin/theaters" element={<AdminProtectedRoute element = {<AdminTheaterList/>} />} />
            <Route path="/admin/theaters/:theaterId/seats" element={<AdminProtectedRoute element = {<AdminTheaterSeats/>} />} />
            <Route path="/admin/add-show" element={<AdminProtectedRoute element = {<AdminAddShow/>} />} />
            <Route path="/admin/shows" element={<AdminProtectedRoute element = {<AdminShowList/>} />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/theater/:theaterId" element={<TheaterDetails />} />
            <Route path="/admin/show-list" element={<AdminProtectedRoute element = {<AdminShowList/>} />} />
            <Route path="/admin/associate-seats/:showId" element={<AdminProtectedRoute element = {<AssociateShowSeats/>} />} />
          </Routes>
        </Router>
      </AdminContext.Provider>
    </UserContext.Provider>
  );
}

export default App;