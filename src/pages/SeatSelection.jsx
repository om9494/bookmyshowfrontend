import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

// Food emoji mapping
const FOOD_EMOJIS = {
    "Popcorn": "🍿",
    "Samosa": "🥟",
    "French Fries": "🍟",
    "Cold Drink": "🥤",
    "Coca Cola": "🥤",
    "Momos": "🥟",
    "Pizza": "🍕",
    "Nachos": "🌮",
    "Hot Dog": "🌭",
    "Burger": "🍔",
    "Ice Cream": "🍦",
    "Chocolate": "🍫",
    "Coffee": "☕",
    "Tea": "🫖",
    "Water": "💧",
    "Chips": "🥔",
    "Noodles": "🍜",
    "Sandwich": "🥪"
};

const SeatSelection = () => {
    const { state } = useLocation();
    const query = useQuery();
    const navigate = useNavigate();
    const { id: movieId } = useParams();

    // --- MODE DETERMINATION ---
    const isUpdateMode = state?.isUpdateMode || false;
    const originalTicketId = state?.originalTicketId || null;
    const originalFare = state?.originalFare || 0;

    // --- STATE MANAGEMENT ---
    const count = isUpdateMode ? 1 : parseInt(query.get("count"));
    const theaterId = isUpdateMode ? state.theaterId : query.get("theatre");
    const showId = isUpdateMode ? state.newShowId : query.get("showId");
    const time = isUpdateMode ? state.time : query.get("time");

    const [allShowSeats, setAllShowSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [userId, setUserId] = useState(null);
    const [movie, setMovie] = useState("");
    const [theatre, setTheatre] = useState("");
    const [seatRows, setSeatRows] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");
    const [availableFood, setAvailableFood] = useState([]);
    const [selectedFood, setSelectedFood] = useState({});

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!theaterId || !showId || !movieId) return;
            setLoading(true);
            try {
                const token = `Bearer ${localStorage.getItem("token")}`;
                const [
                    theaterSeatsResponse, 
                    seatsPriceResponse, 
                    allSeatsResponse,
                    userResponse,
                    movieResponse,
                    theaterResponse,
                    foodResponse
                ] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_BACKEND_API}/theater-seats/theater/${theaterId}`, { headers: { Authorization: token } }),
                    axios.get(`${import.meta.env.VITE_BACKEND_API}/shows/seat/prices/${showId}`, { headers: { Authorization: token } }),
                    axios.get(`${import.meta.env.VITE_BACKEND_API}/seats/show/${showId}`, { headers: { Authorization: token } }),
                    axios.get(`${import.meta.env.VITE_BACKEND_API}/signup/profile`, { headers: { Authorization: token } }),
                    axios.get(`${import.meta.env.VITE_BACKEND_API}/movies/id/${movieId}`, { headers: { Authorization: token } }),
                    axios.get(`${import.meta.env.VITE_BACKEND_API}/theaters/id/${theaterId}`, { headers: { Authorization: token } }),
                    axios.get(`${import.meta.env.VITE_BACKEND_API}/show-food/show/${showId}`, { headers: { Authorization: token } })
                ]);
                
                setAllShowSeats(allSeatsResponse.data);
                const prices = seatsPriceResponse.data;
                const formattedSeatRows = theaterSeatsResponse.data.map(row => ({
                    label: row.rowLabel, price: prices[row.seatType] || 0, count: row.seatCount, type: row.seatType
                }));
                setSeatRows(formattedSeatRows);
                setUserId(userResponse.data._id);
                setMovie(movieResponse.data.movieName);
                setTheatre(theaterResponse.data.name);
                setAvailableFood(foodResponse.data);

            } catch (error) {
                console.error("Error fetching page data:", error);
                setStatusMessage("Failed to load booking information.");
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, [theaterId, showId, movieId]);
    
    // --- SEAT & FOOD SELECTION ---
    const handleAddFood = (foodId) => setSelectedFood(p => ({ ...p, [foodId]: (p[foodId] || 0) + 1 }));
    const handleRemoveFood = (foodId) => {
        setSelectedFood(p => {
            const newCount = (p[foodId] || 0) - 1;
            if (newCount > 0) return { ...p, [foodId]: newCount };
            const { [foodId]: _, ...rest } = p; return rest;
        });
    };

    // --- TOTAL CALCULATION ---
    const newSeatPrice = selectedSeats.reduce((sum, seatId) => {
        const row = seatRows?.find((r) => r.label === seatId.match(/[A-Z]+/)[0]);
        return sum + (row ? row.price : 0);
    }, 0);
    
    // In update mode, food cannot be changed, so its price is 0.
    const foodPrice = isUpdateMode ? 0 : Object.entries(selectedFood).reduce((total, [foodId, quantity]) => {
        const item = availableFood.find(f => f._id === foodId);
        return total + (item ? item.price * quantity : 0);
    }, 0);
    
    const UPDATE_FEE = 20;

    // --- FIX #3: Corrected amountToPay logic to align with backend capabilities ---
    // In update mode, price is new seat + fee, minus original fare. No food price is included.
    const amountToPay = isUpdateMode ? Math.max(0, newSeatPrice + UPDATE_FEE - originalFare) : newSeatPrice + foodPrice;


    // --- TICKET UPDATE LOGIC ---
    const handleTicketUpdate = async () => {
        if (selectedSeats.length !== 1) {
            setStatusMessage("Please select exactly 1 seat for update.");
            return;
        }

        setIsProcessing(true);
        setStatusMessage("Updating your ticket...");
        
        try {
            const token = localStorage.getItem("token");
            
            // --- FIX #1: The payload now matches the backend TicketUpdateDto.java ---
            const updatePayload = {
                originalTicketId: originalTicketId,
                newShowId: showId,
                newSeatNo: selectedSeats[0], // Key is 'newSeatNo' and value is a single String
                userId: userId
                // Food IDs are removed as the backend does not support updating them.
            };

            console.log("Update payload:", updatePayload);

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_API}/ticket/update`,
                updatePayload,
                { headers: { "Authorization": `Bearer ${token}` } }
            );

            if (response.status === 200) {
                setStatusMessage("Ticket updated successfully! Redirecting...");
                
                const bookingDetails = {
                    movieName: movie,
                    theaterName: theatre,
                    showTime: time,
                    selectedSeats,
                    selectedFood: {}, // Food is not updated
                    availableFood,
                    totalAmount: amountToPay,
                    ticketEntryDto: {
                        showId,
                        userId,
                        requestSeats: selectedSeats,
                        requestedFoodIds: [] // Food is not updated
                    },
                    isUpdateMode: true,
                    originalTicketId: originalTicketId
                };

                setTimeout(() => {
                    navigate('/payment-summary', { state: bookingDetails });
                }, 1500);
            }
        } catch (error) {
            console.error("Error updating ticket:", error);
            console.error("Error response:", error.response?.data); 
            console.error("Error status:", error.response?.status); 
            
            let errorMessage = "Failed to update ticket. Please try again.";
            
            if (error.response?.status === 409) {
                errorMessage = error.response?.data || "Conflict: The ticket cannot be updated. This might be because the selected seat is no longer available.";
            } else if (error.response?.status === 404) {
                errorMessage = "Original ticket not found. Please refresh and try again.";
            } else if (error.response?.status === 400) {
                errorMessage = error.response?.data?.message || "Invalid request. Please check your selection.";
            } else if (error.response?.status === 403) {
                errorMessage = "You don't have permission to update this ticket.";
            } else if (error.response?.data) { // Display backend error message directly
                errorMessage = error.response.data;
            }
            
            setStatusMessage(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };
    
    // --- NAVIGATION TO PAYMENT ---
    const handleProceedToPayment = () => {
        if (selectedSeats.length !== count) {
            setStatusMessage(`Please select exactly ${count} seats.`);
            return;
        }

        const requestedFoodIds = Object.entries(selectedFood).flatMap(([_id, qty]) => Array(qty).fill(_id));
        const ticketEntryDto = { showId, userId, requestSeats: selectedSeats, requestedFoodIds };

        const bookingDetails = {
            movieName: movie,
            theaterName: theatre,
            showTime: time,
            selectedSeats,
            selectedFood,
            availableFood,
            totalAmount: amountToPay,
            ticketEntryDto
        };

        navigate('/payment-summary', { state: bookingDetails });
    };

    const handleProceed = () => {
        if (isUpdateMode) {
            handleTicketUpdate();
        } else {
            handleProceedToPayment();
        }
    };

    // --- HELPER FUNCTIONS ---
    const getFoodEmoji = (foodName) => {
        return FOOD_EMOJIS[foodName] || "🍽️";
    };

    const isBestsellerSeat = (seatNo) => {
        const row = seatNo.match(/[A-Z]+/)[0];
        const seatNum = parseInt(seatNo.match(/\d+/)[0]);
        const rowIndex = seatRows?.findIndex(r => r.label === row) || 0;
        
        if (rowIndex >= 1 && rowIndex <= 3) {
            if (seatNum >= 6 && seatNum <= 14) {
                return true;
            }
        }
        return false;
    };

    // --- SEAT SELECTION LOGIC ---
    const handleSelectSeat = async (row, num) => {
        const seatNo = row + num;
        const token = localStorage.getItem("token");
        
        if (!token || !userId) { 
            setStatusMessage("Please log in to select seats."); 
            return; 
        }
        
        const seatObject = allShowSeats.find(seat => seat.seatNo === seatNo);
        if (!seatObject) { 
            setStatusMessage("An error occurred. Please refresh."); 
            return; 
        }

        if (seatObject.lockedByUserId && seatObject.lockedByUserId !== userId) {
            setStatusMessage("This seat is currently locked by another user. Please try a different seat.");
            return;
        }

        if (!seatObject.isAvailable) {
            setStatusMessage("This seat is already sold. Please select an available seat.");
            return;
        }

        if (selectedSeats.includes(seatNo)) {
            // Unselect seat
            try {
                setIsProcessing(true);
                await axios.post(`${import.meta.env.VITE_BACKEND_API}/seats/unlockSeat`, 
                    { seatId: seatObject._id, userId }, 
                    { headers: { "Authorization": `Bearer ${token}` } }
                );
                setSelectedSeats(selectedSeats.filter((s) => s !== seatNo));
                setStatusMessage("Seat unselected successfully.");
            } catch (error) { 
                setStatusMessage(error.response?.data?.message || `Failed to unlock seat.`); 
            } finally { 
                setIsProcessing(false); 
            }
        } else if (selectedSeats.length < count) {
            // Select seat
            try {
                setIsProcessing(true);
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_API}/seats/lockSeat`, 
                    { seatId: seatObject._id, userId }, 
                    { headers: { "Authorization": `Bearer ${token}` } }
                );
                
                if (response.status === 200) {
                    setSelectedSeats([...selectedSeats, seatNo]);
                    setStatusMessage("Seat selected successfully!");
                    
                    setAllShowSeats(prevSeats => 
                        prevSeats.map(seat => 
                            seat._id === seatObject._id 
                                ? { ...seat, lockedByUserId: userId }
                                : seat
                        )
                    );
                }
            } catch (error) { 
                const errorMessage = error.response?.data?.message || "Seat may be taken by another user.";
                setStatusMessage(errorMessage);
                
                if (error.response?.status === 409) {
                    setAllShowSeats(prevSeats => 
                        prevSeats.map(seat => 
                            seat._id === seatObject._id 
                                ? { ...seat, lockedByUserId: 'other' }
                                : seat
                        )
                    );
                }
            } finally { 
                setIsProcessing(false); 
            }
        } else { 
            setStatusMessage(`You can only select ${count} seat(s).`); 
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 via-blue-100 to-purple-200">
                <div className="relative">
                    <div className="animate-spin rounded-full h-20 w-20 border-4 border-pink-500 border-t-transparent shadow-lg"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-pink-300 animate-ping"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-200 via-blue-100 to-purple-200 flex flex-col font-sans">
            <Navbar />
            <div className="flex-1 max-w-8xl mx-auto w-full py-10 px-4">
                <div className="grid lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/40 relative overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-50/50 to-blue-50/50 opacity-60"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                                <div className="text-center sm:text-left">
                                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">{movie}</h2>
                                    <p className="text-gray-600 text-lg font-medium mt-2 flex items-center justify-center sm:justify-start gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                        {theatre} • {time}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 text-white px-8 py-4 rounded-2xl font-bold shadow-lg text-lg transform hover:scale-105 transition-all duration-300 border-2 border-white/20">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🎫</span>
                                        {isUpdateMode ? "Select 1 New Seat" : `${selectedSeats.length} / ${count} Tickets`}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Seat Grid */}
                            <div className="overflow-x-auto pb-6">
                                {seatRows && seatRows.map((row, rowIndex) => (
                                    <div key={row.label} className="flex items-center mb-8 animate-fade-in" style={{ animationDelay: `${rowIndex * 100}ms` }}>
                                        <span className="w-16 font-black text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm flex-shrink-0 text-center">{row.label}</span>
                                        <div className="flex flex-wrap gap-3 ml-6 flex-1 justify-center">
                                            {Array.from({ length: row.count }, (_, i) => {
                                                const seatNo = row.label + (i + 1);
                                                const seatObject = allShowSeats.find(s => s.seatNo === seatNo);
                                                const isSold = !seatObject?.isAvailable;
                                                const isLockedByOther = seatObject?.lockedByUserId && seatObject.lockedByUserId !== userId;
                                                const isSelected = selectedSeats.includes(seatNo);
                                                const isBestseller = isBestsellerSeat(seatNo);
                                                
                                                let seatClasses = "w-12 h-12 border-3 rounded-xl flex items-center justify-center text-base font-bold transition-all duration-300 shadow-lg relative transform hover:scale-110 active:scale-95";
                                                
                                                if (isSold || isLockedByOther) {
                                                    seatClasses += " bg-gradient-to-br from-gray-400 to-gray-500 text-gray-700 cursor-not-allowed border-gray-400 shadow-inner";
                                                } else if (isSelected) {
                                                    seatClasses += " bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 text-white scale-110 border-emerald-600 z-10 shadow-2xl animate-pulse";
                                                } else if (isBestseller) {
                                                    seatClasses += " bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-black border-amber-600 hover:shadow-xl hover:scale-105";
                                                } else {
                                                    seatClasses += " bg-gradient-to-br from-slate-100 to-gray-200 hover:from-pink-200 hover:to-rose-200 border-gray-300 hover:border-pink-400 hover:shadow-xl";
                                                }
                                                
                                                const isDisabled = isSold || isLockedByOther || isProcessing;
                                                return (
                                                    <button 
                                                        key={seatNo} 
                                                        disabled={isDisabled} 
                                                        onClick={() => handleSelectSeat(row.label, i + 1)} 
                                                        className={seatClasses}
                                                        title={isSold ? "Sold" : isLockedByOther ? "Locked" : isSelected ? "Selected" : isBestseller ? "Bestseller Seat" : "Available"}
                                                    >
                                                        {i + 1}
                                                        {isSelected && <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"><span className="text-xs">✓</span></div>}
                                                        {isBestseller && !isSelected && !isSold && !isLockedByOther && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center"><span className="text-xs">⭐</span></div>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="ml-8 flex flex-col items-end flex-shrink-0 gap-2">
                                            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold shadow-lg border border-white/20">{row.type}</span>
                                            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 text-sm font-semibold shadow border border-pink-200">₹{row.price}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Screen Bar */}
                            <div className="text-center my-12">
                                <div className="relative">
                                    <div className="h-4 bg-gradient-to-r from-pink-400 via-red-400 to-orange-400 w-full max-w-2xl mx-auto rounded-full shadow-2xl relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-red-400 to-orange-400 rounded-full opacity-60 blur-md animate-pulse"></div>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                                    </div>
                                    <p className="absolute -bottom-8 w-full text-gray-800 font-extrabold tracking-widest text-lg drop-shadow-lg">🎬 SCREEN THIS WAY 🎬</p>
                                </div>
                            </div>

                            {/* Status Message */}
                            {statusMessage && <div className={`text-center mb-6 p-4 rounded-2xl font-semibold transition-all duration-300 ${statusMessage.includes('successfully') || statusMessage.includes('selected') ? 'bg-green-100 text-green-800 border-2 border-green-200' : statusMessage.includes('error') || statusMessage.includes('failed') || statusMessage.includes('locked') || statusMessage.includes('sold') || statusMessage.includes('Conflict') || statusMessage.includes('exist') ? 'bg-red-100 text-red-800 border-2 border-red-200' : 'bg-blue-100 text-blue-800 border-2 border-blue-200'}`}><div className="flex flex-col items-center gap-2"><div className="flex items-center gap-2">{statusMessage.includes('successfully') && <span className="text-xl">✅</span>} {(statusMessage.includes('error') || statusMessage.includes('failed')) && <span className="text-xl">❌</span>} {statusMessage.includes('locked') && <span className="text-xl">🔒</span>} {statusMessage.includes('sold') && <span className="text-xl">💺</span>} {(statusMessage.includes('Conflict') || statusMessage.includes('exist')) && <span className="text-xl">⚠️</span>} <span className="font-bold">Status</span></div><div className="text-sm whitespace-pre-line text-left max-w-md">{statusMessage}</div></div></div>}

                            {/* Seat Legend */}
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200 mt-8">
                                <h4 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2"><span className="text-xl">📋</span>Seat Legend</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-slate-100 to-gray-200 border-2 border-gray-300 rounded-lg flex items-center justify-center text-sm font-bold">1</div><span className="text-sm font-medium text-gray-700">Available</span></div><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 border-2 border-emerald-600 rounded-lg flex items-center justify-center text-sm font-bold text-white">1</div><span className="text-sm font-medium text-gray-700">Selected</span></div><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 border-2 border-amber-600 rounded-lg flex items-center justify-center text-sm font-bold text-white relative"><span className="text-black">1</span><span className="absolute -top-1 -right-1 text-xs">⭐</span></div><span className="text-sm font-medium text-gray-700">Bestseller</span></div><div className="flex items-center gap-3"><div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 border-2 border-gray-400 rounded-lg flex items-center justify-center text-sm font-bold text-gray-700">1</div><span className="text-sm font-medium text-gray-700">Sold/Locked</span></div></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Order Summary Column */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/40 sticky top-28 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-50/30 to-blue-50/30"></div>
                            <div className="absolute -top-5 -right-5 w-20 h-20 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
                            
                            <div className="relative z-10">
                                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-8 flex items-center gap-3"><span className="text-3xl">🛒</span>Order Summary</h3>
                                
                                {/* Food Section */}
                                <div className="mb-8">
                                    <h4 className="font-semibold text-xl mb-4 flex items-center gap-3 text-gray-800"><span className="text-2xl">🍿</span>Add Snacks & Beverages</h4>
                                    {/* --- FIX #2: Disable food UI in update mode --- */}
                                    {isUpdateMode ? (
                                        <div className="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 rounded-lg">
                                            <p className="font-bold">Note:</p>
                                            <p className="text-sm">Food items cannot be changed when updating a ticket. This feature is coming soon!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                            {availableFood.map(food => (
                                                <div key={food._id} className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-2xl">{getFoodEmoji(food.name)}</span>
                                                            <div>
                                                                <p className="font-semibold text-gray-800 text-lg">{food.name}</p>
                                                                <p className="text-sm text-gray-600 font-medium">₹{food.price}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <button onClick={() => handleRemoveFood(food._id)} className="w-8 h-8 bg-gradient-to-r from-red-400 to-red-500 text-white rounded-full font-bold transition-all duration-300 hover:from-red-500 hover:to-red-600 hover:scale-110 shadow-lg" disabled={!selectedFood[food._id]}>-</button>
                                                            <span className="w-10 text-center font-bold text-xl text-gray-800 bg-gray-100 rounded-lg py-1">{selectedFood[food._id] || 0}</span>
                                                            <button onClick={() => handleAddFood(food._id)} className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-500 text-white rounded-full font-bold transition-all duration-300 hover:from-green-500 hover:to-green-600 hover:scale-110 shadow-lg">+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <hr className="my-8 border-2 border-gradient-to-r from-pink-200 to-blue-200 rounded-full" />
                                
                                {/* Price Breakdown */}
                                <div className="space-y-3 text-gray-700 font-medium mb-8">
                                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl"><span className="font-semibold">Seats ({selectedSeats.length}):</span> <span className="font-bold text-lg">₹{newSeatPrice}</span></div>
                                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl"><span className="font-semibold">Snacks & Beverages:</span> <span className="font-bold text-lg">₹{foodPrice}</span></div>
                                    <div className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200"><span className="text-xl font-bold text-gray-800">Total Amount:</span> <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">₹{amountToPay}</span></div>
                                </div>
                                
                                {/* Proceed Button */}
                                <button
                                    className={`w-full px-12 py-5 rounded-2xl font-extrabold text-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${selectedSeats.length !== count ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-300 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white hover:from-pink-600 hover:via-red-600 hover:to-orange-600'}`}
                                    disabled={selectedSeats.length !== count}
                                    onClick={handleProceed}
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-2xl">💳</span>
                                        {isUpdateMode ? `Update & Pay ₹${amountToPay}` : `Proceed to Pay ₹${amountToPay}`}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
            
            <style jsx>{` @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } } @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.6s ease-out forwards; } .animate-shimmer { animation: shimmer 2s infinite; } .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(to bottom, #ec4899, #8b5cf6); border-radius: 10px; } .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(to bottom, #db2777, #7c3aed); } `}</style>
        </div>
    );
};

export default SeatSelection;