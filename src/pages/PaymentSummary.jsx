import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PaymentSummary = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [bookingDetails] = useState(location.state || {});
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // --- FIX #1: Destructure isUpdateMode from the state ---
    const {
        movieName = 'N/A', theaterName = 'N/A', showTime = 'N/A',
        selectedSeats = [], selectedFood = {}, availableFood = [],
        totalAmount = 0, ticketEntryDto = {}, isUpdateMode = false
    } = bookingDetails;

    useEffect(() => {
        if (!location.state || (!isUpdateMode && (!totalAmount || selectedSeats.length === 0))) {
             navigate('/');
        }
    }, [location.state, navigate, totalAmount, selectedSeats, isUpdateMode]);

    const handlePayment = async () => {
        setIsLoading(true);
        setStatusMessage('Initiating payment...');
        try {
            const orderResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/payment/create-order`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${localStorage.getItem("token")}` 
                },
                body: JSON.stringify({ amount: totalAmount }),
            });
            if (!orderResponse.ok) throw new Error('Failed to create payment order.');
            const orderData = await orderResponse.json();

            const options = {
                key: 'rzp_test_4DotYCe9Ux9uOT', // Your Razorpay Key ID
                amount: orderData.amount,
                currency: 'INR',
                name: 'BookMyShow Clone',
                description: `Payment for ${movieName}`,
                order_id: orderData.id,
                // --- FIX #2: The handler now contains the core logic fix ---
                handler: async function (response) {
                    
                    if (isUpdateMode) {
                        // THIS IS THE LOGIC FOR A TICKET UPDATE
                        // The ticket is already updated. The payment is complete. We are done.
                        setStatusMessage('Ticket Updated Successfully!');
                        alert('Your ticket has been successfully updated!');
                        navigate('/profile'); // Redirect to profile to see the updated ticket
                    
                    } else {
                        // THIS IS THE ORIGINAL LOGIC FOR A NEW BOOKING
                        // It verifies the payment and creates the ticket.
                        setStatusMessage('Verifying payment...');
                        try {
                            const verificationPayload = {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                ticketEntryDto: ticketEntryDto,
                            };
    
                            const verificationResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/payment/verify-payment`, {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                                },
                                body: JSON.stringify(verificationPayload),
                            });
                            
                            if (verificationResponse.ok) {
                                const foodDetails = Object.entries(selectedFood).map(([id, qty]) => {
                                    const foodItem = availableFood.find(f => f.id === parseInt(id));
                                    return `${foodItem.name} (x${qty})`;
                                }).join(', ');
    
                                const queryParams = new URLSearchParams({
                                    movie: movieName,
                                    theatre: theaterName,
                                    time: showTime,
                                    seats: selectedSeats.join(','),
                                    amount: totalAmount,
                                    food: foodDetails,
                                    movieId: ticketEntryDto.showId 
                                }).toString();
                                
                                navigate(`/booking-summary?${queryParams}`);
                            } else {
                                const resultMessage = await verificationResponse.text();
                                setStatusMessage(`Payment verification failed: ${resultMessage}`);
                            }
                        } catch (verificationError) {
                            setStatusMessage(`An error occurred during verification: ${verificationError.message}`);
                        }
                    }
                },
                prefill: { name: 'Test User', email: 'test.user@example.com' },
                theme: { color: '#F94263' },
            };
            
            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
            paymentObject.on('payment.failed', function (response) {
                setStatusMessage(`Payment Failed: ${response.error.description}`);
            });
        } catch (error) {
            setStatusMessage(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedFoodItems = Object.entries(selectedFood);
    // Note: The price calculation here is just for display. The final amount comes from the previous page.
    const seatPrice = selectedSeats.reduce((acc, seat) => acc + (bookingDetails.seatPrices?.[seat] || 250), 0); // A more robust way to calculate if prices were passed
    const foodPrice = Object.entries(selectedFood).reduce((total, [id, qty]) => {
        const food = availableFood.find(f => f.id === parseInt(id));
        return total + (food ? food.price * qty : 0);
    }, 0);


    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-blue-50 to-purple-100 flex flex-col">
            <Navbar />
            <main className="flex-grow flex items-center justify-center p-4 py-12">
                <div className="w-full max-w-2xl">
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-50/50 to-blue-50/50"></div>
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10 p-8">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-4xl">💳</span>
                                </div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">Confirm Your Booking</h1>
                                <p className="text-gray-600">Review your booking details before payment</p>
                            </div>

                            <div className="space-y-6 mb-8">
                                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">🎬</span>
                                        <h2 className="font-bold text-gray-800 text-lg">Movie Details</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Movie</p>
                                            <p className="font-semibold text-gray-800">{movieName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Theater</p>
                                            <p className="font-semibold text-gray-800">{theaterName}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Show Time</p>
                                            <p className="font-semibold text-gray-800">{showTime}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 font-medium">Seats</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {selectedSeats.map((seat, index) => (
                                                    <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                        {seat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            {selectedFoodItems.length > 0 && !isUpdateMode && (
                                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-2xl">🍿</span>
                                            <h2 className="font-bold text-gray-800 text-lg">Snacks & Beverages</h2>
                                        </div>
                                        <div className="space-y-3">
                                        {selectedFoodItems.map(([id, qty]) => {
                                            const food = availableFood.find(f => f.id === parseInt(id));
                                            return (
                                                <div key={id} className="flex justify-between items-center bg-white/60 p-3 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg">🍽️</span>
                                                        <div>
                                                            <p className="font-medium text-gray-800">{food?.name}</p>
                                                            <p className="text-sm text-gray-600">₹{food?.price} × {qty}</p>
                                                        </div>
                                                    </div>
                                                    <span className="font-bold text-gray-800">₹{food?.price * qty}</span>
                                                </div>
                                            );
                                        })}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-2xl">💰</span>
                                        <h2 className="font-bold text-gray-800 text-lg">Price Breakdown</h2>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Subtotal:</span>
                                            <span className="font-semibold text-gray-800">₹{totalAmount}</span>
                                        </div>
                                        <hr className="border-emerald-200" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">₹{totalAmount}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {statusMessage && (
                                <div className={`p-4 rounded-2xl mb-6 text-center font-medium ${statusMessage.includes('Success') || statusMessage.includes('Verifying') ? 'bg-green-100 text-green-800 border border-green-200' : statusMessage.includes('Failed') || statusMessage.includes('Error') ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                                    <div className="flex items-center justify-center gap-2">
                                        {statusMessage.includes('Success') && <span>✅</span>}
                                        {statusMessage.includes('Failed') && <span>❌</span>}
                                        {statusMessage.includes('Error') && <span>⚠️</span>}
                                        {statusMessage.includes('Initiating') && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-800"></div>}
                                        {statusMessage.includes('Verifying') && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-800"></div>}
                                        {statusMessage}
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={handlePayment} 
                                disabled={isLoading || statusMessage.includes('Success')} 
                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${!isLoading && !statusMessage.includes('Success') ? 'bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white hover:from-pink-600 hover:via-red-600 hover:to-orange-600' : 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-300 cursor-not-allowed'}`}
                            >
                                <div className="flex items-center justify-center gap-3">
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-2xl">💳</span>
                                            <span>Pay ₹{totalAmount}</span>
                                        </>
                                    )}
                                </div>
                            </button>

                            <div className="mt-6 text-center">
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                    <span>🔒</span>
                                    <span>Secure payment powered by Razorpay</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PaymentSummary;