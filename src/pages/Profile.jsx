import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import UpdateTicketModal from '../components/UpdateTicketModal';

// Helper to get food emojis
const getFoodEmoji = (foodName) => {
    const EMOJIS = {
        "Popcorn": "🍿", "Samosa": "🥟", "French Fries": "🍟", "Cold Drink": "�",
        "Coca Cola": "🥤", "Momos": "🥟", "Pizza": "🍕", "Nachos": "🌮",
        "Hot Dog": "🌭", "Burger": "🍔", "Ice Cream": "🍦", "Chocolate": "🍫",
        "Coffee": "☕", "Tea": "🫖", "Water": "💧", "Chips": "🥔",
        "Noodles": "🍜", "Sandwich": "🥪"
    };
    const key = Object.keys(EMOJIS).find(k => foodName.toLowerCase().includes(k.toLowerCase()));
    return key ? EMOJIS[key] : "🍽️";
};

// This is the modal component for viewing and downloading a ticket.
const ViewTicketModel = ({ isOpen, onClose, ticket, userdata }) => {
    if (!isOpen) return null;

    const [downloadText, setDownloadText] = useState("Download Ticket");

    const foodDetailsForQR = ticket.purchasedFoods && ticket.purchasedFoods.length > 0 
        ? `\nFood Items: ${ticket.purchasedFoods.map(f => f.name).join(', ')}` 
        : '';
        
    const qrticketData = `
Ticket ID: ${ticket._id}, 
Movie: ${ticket.movie.movieName}, 
Theater: ${ticket.theater.name}, 
Date: ${new Date(ticket.date).toLocaleDateString()}, 
Time: ${ticket.time}, 
Seat Number: ${ticket.seatNo}, 
Fare: ₹${ticket.fare}, 
User Name: ${userdata?.name}, 
User Email: ${userdata?.email}, 
User Phone Number: ${userdata?.phoneNumber}, 
User Gender: ${userdata?.gender}, 
User Age: ${userdata?.age} ${foodDetailsForQR} \n\n
© 2025 BookMyShow - Booked At:${new Date(ticket.bookedAt).toLocaleDateString()}`;

    const handleDownload = () => {
        setDownloadText("Downloading...");
        // --- FIX: Target the hidden, simplified element for PDF generation ---
        const ticketElement = document.getElementById('ticket-for-pdf'); 
        if (ticketElement) {
            html2canvas(ticketElement, { scale: 4, useCORS: true })
                .then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'px',
                        format: [canvas.width, canvas.height]
                    });
                    pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
                    pdf.save(`ticket-${ticket._id}.pdf`);
                });
        }
        setTimeout(() => setDownloadText("Download Ticket"), 3000);
    };

    // This is a simplified version of the ticket for reliable PDF generation
    const TicketForPDF = () => (
        <div id="ticket-for-pdf" className="absolute -left-[9999px] top-0 p-6 w-[480px] bg-white">
             <div className="flex justify-between items-start mb-4">
                <img src={ticket.movie.imageUrl} alt="Movie Poster" className="h-48 w-32 object-cover rounded-lg" crossOrigin="anonymous" />
                <div className="text-right ml-2">
                    <p className="text-2xl font-bold text-gray-800">{ticket.movie.movieName}</p>
                    <p className="text-md text-gray-600">{ticket.theater.name}</p>
                    <p className="text-sm font-semibold text-gray-500 mt-2">Date: {new Date(ticket.date).toLocaleDateString()}</p>
                    <p className="text-sm font-semibold text-gray-500">Time: {ticket.time.slice(0, 5)}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-100 p-4 rounded-xl">
                <div><span className="text-sm font-medium text-gray-500">Name:</span> <span className="text-sm font-semibold text-gray-800">{userdata?.name}</span></div>
                <div><span className="text-sm font-medium text-gray-500">Seat:</span> <span className="font-bold text-lg text-pink-600">{ticket.seatNo}</span></div>
                <div><span className="text-sm font-medium text-gray-500">Ticket ID:</span> <span className="text-sm font-semibold text-gray-800">{ticket._id}</span></div>
                <div><span className="text-sm font-medium text-gray-500">Total Fare:</span> <span className="text-lg font-bold text-green-700">₹{ticket.fare}</span></div>
            </div>
            {ticket.purchasedFoods && ticket.purchasedFoods.length > 0 && (
                <div className="bg-gray-100 p-4 rounded-xl mb-4">
                    <h4 className="font-bold text-md text-gray-800 mb-3">Snacks Ordered:</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {ticket.purchasedFoods.map(food => (
                            <div key={food._id} className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-gray-700">{food.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className='flex flex-row items-center justify-center gap-4 mt-4'>
                <div className="flex p-1 rounded-lg border-4 border-pink-500">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrticketData)}`} alt="QR Code" className="w-30 h-30 rounded-md" />
                </div>
                <div className="bg-green-100 border border-green-400 rounded-lg px-4 py-4 w-fit text-center">
                    <div className="text-md font-semibold text-green-700 mb-2">Enjoy your show!</div>
                    <div className="text-sm text-green-600">Show this ticket at the theatre entrance.</div>
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">© 2025 BookMyShow - Booked At: {new Date(ticket.bookedAt).toLocaleDateString()}</p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-10 cursor-default p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg relative border-4 border-pink-400">
                <button onClick={onClose} className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-gray-700 z-20">&times;</button>
                <div className="flex flex-col items-center">
                    <h2 className="text-3xl font-extrabold mb-6 text-center bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Your Ticket</h2>
                    
                    {/* This is the visible, styled ticket */}
                    <div className="border-2 border-dashed border-gray-400 rounded-2xl p-6 w-full mb-6 bg-gradient-to-br from-gray-50 to-blue-50 relative shadow-inner">
                        <div className="absolute inset-0" style={{ backgroundImage: `url(${ticket.movie.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.3 }}></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <img src={ticket.movie.imageUrl} alt="Movie Poster" className="h-48 w-32 object-cover rounded-lg shadow-lg border-2 border-white" crossOrigin="anonymous" />
                            <div className="text-right ml-2">
                                <p className="text-2xl font-bold text-gray-800">{ticket.movie.movieName}</p>
                                <p className="text-md text-gray-600">{ticket.theater.name}</p>
                                <p className="text-sm font-semibold text-gray-700 mt-2">Date: {new Date(ticket.date).toLocaleDateString()}</p>
                                <p className="text-sm font-semibold text-gray-700">Time: {ticket.time.slice(0, 5)}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4 bg-white/80 p-4 rounded-xl shadow-sm relative z-10">
                            <div><span className="text-sm font-medium text-gray-700">Name:</span> <span className="text-sm font-semibold text-gray-800">{userdata?.name}</span></div>
                            <div><span className="text-sm font-medium text-gray-700">Seat:</span> <span className="font-bold text-lg text-pink-600">{ticket.seatNo}</span></div>
                            <div><span className="text-sm font-medium text-gray-700">Ticket ID:</span> <span className="text-sm font-semibold text-gray-800">{ticket._id}</span></div>
                            <div><span className="text-sm font-medium text-gray-700">Total Fare:</span> <span className="text-lg font-bold text-green-700">₹{ticket.fare}</span></div>
                        </div>

                        {ticket.purchasedFoods && ticket.purchasedFoods.length > 0 && (
                            <div className="bg-white/60 p-4 rounded-xl shadow-sm mb-4 relative z-10">
                                <h4 className="font-bold text-md text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="text-xl">🍿</span> Snacks Ordered:
                                </h4>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                    {ticket.purchasedFoods.map(food => (
                                        <div key={food._id} className="flex items-center gap-2 text-sm">
                                            <span>{getFoodEmoji(food.name)}</span>
                                            <span className="font-medium text-gray-700">{food.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className='flex flex-row items-center justify-center gap-4 mt-4 relative z-10'>
                            <div className="flex bg-white p-1 rounded-lg shadow-md w-fit h-fit border-4 border-pink-500">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(qrticketData)}`} alt="QR Code" className="w-30 h-30 rounded-md" />
                            </div>
                            <div className="bg-green-100 border border-green-400 rounded-lg px-4 py-4 w-fit text-center">
                                <div className="text-md font-semibold text-green-700 mb-2">Enjoy your show!</div>
                                <div className="text-sm text-green-600">Show this ticket at the theatre entrance.</div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-4 text-center relative z-10">© 2025 BookMyShow - Booked At: {new Date(ticket.bookedAt).toLocaleDateString()}</p>
                    </div>
                    {/* This hidden component is used for the PDF download */}
                    <TicketForPDF />
                    <button onClick={handleDownload} className="w-full bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition text-lg py-3">{downloadText}</button>
                </div>
            </div>
        </div>
    );
};

// Main Profile Component
export default function Profile() {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [bookedTickets, setBookedTickets] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketToUpdate, setTicketToUpdate] = useState(null);
    const [showTerms, setShowTerms] = useState(false);
    const [pendingUpdateTicket, setPendingUpdateTicket] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/signup/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                setUserData(response.data);
            } catch (error) {
                console.error("Error fetching user data:", error);
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    alert("Session expired. Please log in again.");
                    localStorage.clear();
                    navigate('/login');
                } else {
                    setError('Error fetching user data.');
                }
            }
        };
        fetchUserData();
    }, [navigate]);

    useEffect(() => {
        const fetchBookedTickets = async () => {
            if (!userData) return;
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/ticket/user/${userData._id}/active`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` },
                });
                setBookedTickets(response.data.reverse());
            } catch (error) {
                console.error("Error fetching booked tickets:", error);
            }
        };
        fetchBookedTickets();
    }, [userData]);

    if (!userData && !bookedTickets) {
        return (
            <div className="bg-gradient-to-br from-pink-100 to-blue-100 min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-pink-500 border-t-transparent"></div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center px-4 md:px-16 py-12">
                <div className="w-full max-w-5xl">
                    <div className="flex items-center gap-8 mb-12 border-b-4 border-pink-200 pb-8">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-pink-500 flex items-center justify-center text-white text-5xl md:text-6xl font-extrabold shadow-lg border-4 border-white">
                            {userData?.name ? userData.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-red-600 mb-2">{userData?.name}</h1>
                            <p className="text-md md:text-lg text-gray-600">Welcome to your BookMyShow profile!</p>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                    
                    <div className="mb-8 p-6 rounded-xl shadow-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-pink-50 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold text-blue-700 mb-2">Your Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                                <div><span className="font-semibold">Name:</span> {userData?.name}</div>
                                <div><span className="font-semibold">Email:</span> {userData?.email}</div>
                                <div><span className="font-semibold">Phone:</span> {userData?.phoneNumber}</div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col gap-2 text-sm text-gray-500 bg-white rounded-lg p-4 border border-blue-100">
                            <span className="font-semibold text-blue-600">Note:</span>
                            <span>Keep your contact details up to date for a smooth booking experience.</span>
                        </div>
                    </div>

                    {bookedTickets && (
                        <div className="mt-8">
                            <h2 className="text-2xl font-extrabold mb-8 text-red-600 flex items-center gap-2">
                                <span className="text-3xl">🎟️</span> Your Active Tickets
                            </h2>
                            {bookedTickets.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {bookedTickets.map((ticket) => (
                                        <div key={ticket._id} className="bg-white p-6 rounded-2xl shadow-xl border-2 border-pink-200 flex flex-col justify-between hover:shadow-2xl transition-all">
                                            <div>
                                                <p className="text-xl font-bold text-red-600">{ticket.movie.movieName}</p>
                                                <p className="text-base text-gray-600 mt-1">{ticket.theater.name}</p>
                                                <hr className="my-3" />
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                                                    <span>Show Date:</span> <span>{new Date(ticket.date).toLocaleDateString()}</span>
                                                    <span>Show Time:</span> <span>{ticket.time.slice(0, 5)}</span>
                                                    <span>Seat:</span> <span className="font-bold">{ticket.seatNo}</span>
                                                    <span>Total Fare:</span> <span className="font-bold">₹{ticket.fare}</span>
                                                </div>
                                                
                                                {ticket.purchasedFoods && ticket.purchasedFoods.length > 0 && (
                                                    <>
                                                        <hr className="my-3" />
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Snacks Ordered:</h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {ticket.purchasedFoods.map(food => (
                                                                    <span key={food._id} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                                                                        {getFoodEmoji(food.name)} {food.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex gap-3 mt-4">
                                                <button onClick={() => setSelectedTicket(ticket)} className="flex-1 text-sm bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-lg shadow font-bold hover:scale-105 transition-all">View Ticket</button>
                                                <button onClick={() => { setPendingUpdateTicket(ticket); setShowTerms(true); }} className="flex-1 text-sm bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 text-white px-4 py-2 rounded-xl shadow-lg font-extrabold border-2 border-yellow-300 hover:scale-110 hover:shadow-2xl transition-all">Update Ticket</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-600">No active tickets found.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="w-full max-w-4xl mx-auto mt-16 mb-8 px-4">
                <div className="bg-gradient-to-r from-yellow-100 via-pink-100 to-blue-100 border-2 border-yellow-300 rounded-2xl shadow-xl p-6 flex flex-col items-center">
                    <h3 className="text-lg md:text-xl font-extrabold text-yellow-700 mb-2 flex items-center gap-2">
                        <span className="text-2xl">⚠️</span> Ticket Update Terms & Conditions
                    </h3>
                    <ul className="text-xs md:text-sm text-gray-700 list-disc pl-6 text-left w-full max-w-2xl space-y-2">
                        <li><span className="font-bold text-pink-700">Time Limit:</span> Tickets can be updated only up to <span className="font-bold">3 hours before showtime</span>.</li>
                        <li><span className="font-bold text-pink-700">Charges:</span> A <span className="font-bold">₹40 update fee</span> applies. If the new ticket is costlier, you must pay the fare difference.</li>
                        <li><span className="font-bold text-pink-700">Allowed Changes:</span> You can update the show timing or seat for the <span className="font-bold">same movie and theatre only</span>.</li>
                        <li><span className="font-bold text-pink-700">Seat & Limitations:</span> Updates are subject to seat availability and allowed only <span className="font-bold">once per ticket</span>.</li>
                    </ul>
                </div>
            </div>

            {selectedTicket && (
                <ViewTicketModel isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} ticket={selectedTicket} userdata={userData} />
            )}
            
            {ticketToUpdate && (
                <UpdateTicketModal isOpen={!!ticketToUpdate} onClose={() => setTicketToUpdate(null)} ticket={ticketToUpdate} userData={userData} />
            )}

            {showTerms && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 cursor-default">
                    <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-lg relative border-2 border-blue-400">
                        <button onClick={() => setShowTerms(false)} className="absolute top-2 right-4 text-3xl text-gray-400 hover:text-gray-700">&times;</button>
                        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Update Booking - Terms & Conditions</h2>
                        <ul className="list-disc pl-6 text-gray-700 mb-6 text-sm">
                            <li>Updates are allowed only up to 3 hours before the showtime.</li>
                            <li>Seat changes are subject to availability.</li>
                            <li>Once updated, previous booking details cannot be restored.</li>
                            <li>Any fare difference must be paid at the time of update.</li>
                            <li>Updated tickets are non-refundable and non-transferable.</li>
                        </ul>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => { setShowTerms(false); setTicketToUpdate(pendingUpdateTicket); }} className="w-full bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition text-lg">I Accept & Continue</button>
                            <button onClick={() => { setShowTerms(false); setPendingUpdateTicket(null); }} className="w-full bg-gray-200 text-gray-700 rounded font-semibold hover:bg-gray-300 transition text-lg mt-2">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
