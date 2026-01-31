import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChatDatePicker from './ChatDatePicker';
import ChatTheaterSelector from './ChatTheaterSelector';
import ChatShowtimeSelector from './ChatShowtimeSelector';
import ChatSeatCountSelector from './ChatSeatCountSelector';
import ChatSeatSelector from './ChatSeatSelector';
import ChatBookingSummary from './ChatBookingSummary';
import { GoogleGenAI } from '@google/genai';

const getGeminiApiKey = () => import.meta.env.VITE_GEMINI_API_KEY;

// LLM call with fallback
async function callGeminiLLM({ history, model = 'gemini-2.5-flash', fallbackModel = 'gemini-1.5-flash', config = {} }) {
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  const contents = history;
  try {
    console.log('[LLM] Calling Gemini API with model:', model);
    console.log('[LLM] Config:', config);
    console.log('[LLM] Contents:', contents);
    const response = await ai.models.generateContent({ model, config, contents });
    console.log('[LLM] Response:', response);
    // Extract the text from the first candidate
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No text found in Gemini response');
    return text;
  } catch (err) {
    console.error('[LLM] Error:', err);
    try {
      const response = await ai.models.generateContent({ model: fallbackModel, config, contents });
      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No text found in Gemini fallback response');
      return text;
    } catch (err2) {
      throw new Error('Both Gemini LLM calls failed.', err2);
    }
  }
}

const initialMessage = {
  role: 'assistant',
  content: 'Hello! I am MovieGPT, your AI-powered assistant. How can I help you with movies, tickets, or anything else today?',
  id: 'initial',
};

// Helper to format MySQL data as a table
function formatTableData(data) {
  if (!Array.isArray(data) || data.length === 0) return 'No data found.';
  const keys = Object.keys(data[0]);
  // Table header
  let table = '<table class="chatbot-table"><thead><tr>' + keys.map(k => `<th>${k}</th>`).join('') + '</tr></thead><tbody>';
  // Table rows
  for (const row of data) {
    table += '<tr>' + keys.map(k => `<td>${row[k]}</td>`).join('') + '</tr>';
  }
  table += '</tbody></table>';
  return table;
}

// Helper to generate a unique ID for messages
function uniqueId() {
  return `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

// Add ChatTicketSummary inline (simple version)
function ChatTicketSummary({ summary, onViewTickets }) {
  if (!summary) return null;
  return (
    <div className="chatbot-booking-summary">
      <div className="chatbot-booking-summary-title">Your Ticket</div>
      <div className="chatbot-booking-summary-details">
        <div><strong>Movie:</strong> {summary.movie}</div>
        <div><strong>Theater:</strong> {summary.theater}</div>
        <div><strong>Time:</strong> {summary.time}</div>
        <div><strong>Seats:</strong> {summary.seats.join(', ')}</div>
        <div><strong>Total Paid:</strong> ₹{summary.amount}</div>
      </div>
      <button className="chatbot-booking-confirm-btn" onClick={onViewTickets}>View All My Tickets</button>
    </div>
  );
}

// Add ChatPaymentSummary component
function ChatPaymentSummary({ summary, onPay, isPaying, error }) {
  if (!summary) return null;
  return (
    <div className="chatbot-booking-summary">
      <div className="chatbot-booking-summary-title">Payment Summary</div>
      <div className="chatbot-booking-summary-details">
        <div><strong>Movie:</strong> {summary.movie}</div>
        <div><strong>Theater:</strong> {summary.theater}</div>
        <div><strong>Time:</strong> {summary.time}</div>
        <div><strong>Seats:</strong> {summary.seats.join(', ')}</div>
        <div><strong>Total:</strong> ₹{summary.amount}</div>
      </div>
      {error && <div style={{ color: '#e11d48', marginBottom: 8 }}>{error}</div>}
      <button className="chatbot-booking-confirm-btn" onClick={onPay} disabled={isPaying}>
        {isPaying ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}

const Chatbot = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false); // NEW: maximized/fullscreen state
  const [showTicket, setShowTicket] = useState(false); // <-- Fix: define showTicket state here
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chatMessages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { }
    return [initialMessage];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Agentic booking state
  const [bookingStep, setBookingStep] = useState('idle');
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieSearchResults, setMovieSearchResults] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTheaters, setAvailableTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [availableShowtimes, setAvailableShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [seatCount, setSeatCount] = useState(1);
  const [seatRows, setSeatRows] = useState([]);
  const [soldSeats, setSoldSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingSummary, setBookingSummary] = useState(null);
  const [bookingError, setBookingError] = useState(null);
  // User ID state (fix invalid hook call)
  const [userId, setUserId] = useState(null);
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_API}/signup/profile`, {
          headers: {
            "Authorization": "Bearer " + localStorage.getItem("token"),
          }
        });
        setUserId(response.data.id);
      } catch (err) {
        setUserId(null);
      }
    };
    fetchUserId();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    } catch { }
  }, [messages]);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  // Helper: Reset booking state
  const resetBooking = () => {
    setBookingStep('idle');
    setSelectedMovie(null);
    setMovieSearchResults([]);
    setAvailableDates([]);
    setSelectedDate(null);
    setAvailableTheaters([]);
    setSelectedTheater(null);
    setAvailableShowtimes([]);
    setSelectedShowtime(null);
    setSeatCount(1);
    setSeatRows([]);
    setSoldSeats([]);
    setSelectedSeats([]);
    setBookingSummary(null);
    setBookingError(null);
  };

  // --- AGENTIC FLOW ---
  const handleAgenticFlow = async (userInput) => {
    try {
      if (bookingStep === 'idle') {
        console.log('[AgenticFlow] Searching for movies:', userInput);
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Searching for movies...', id: uniqueId() }]);
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API}/movies/search?name=${encodeURIComponent(userInput)}`);
        setMovieSearchResults(res.data);
        console.log('[AgenticFlow] Movie search results:', res.data);
        if (res.data.length === 0) {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'No movies found. Try another name or genre.', id: uniqueId() }]);
          return;
        }
        setMessages((prev) => [...prev, { role: 'assistant', content: 'Select a movie:', id: uniqueId() }]);
        setBookingStep('selectMovie');
        return;
      }
      if (bookingStep === 'selectMovie') {
        const movie = typeof userInput === 'object' ? userInput : movieSearchResults.find(m => m.id === userInput || m.movieName === userInput);
        console.log('[AgenticFlow] Selected movie:', movie);
        if (!movie) {
          setMessages((prev) => [...prev, { role: 'assistant', content: 'Invalid movie selection.', id: uniqueId() }]);
          return;
        }
        setSelectedMovie(movie);
        const today = new Date();
        const dates = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          return d.toISOString().split('T')[0];
        });
        setAvailableDates(dates);
        setBookingStep('date');
        setMessages((prev) => [...prev, { role: 'assistant', content: `Which date would you like to watch ${movie.movieName}?`, id: uniqueId() }]);
        return;
      }
      if (bookingStep === 'date') {
        setSelectedDate(userInput);
        const city = localStorage.getItem('city') || 'Pune';
        console.log('[AgenticFlow] Fetching theaters for city:', city);
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API}/theaters/city/${city}`);
        setAvailableTheaters(res.data);
        console.log('[AgenticFlow] Theaters:', res.data);
        setBookingStep('theater');
        setMessages((prev) => [...prev, { role: 'assistant', content: `Select a theater for ${selectedMovie.movieName} on ${userInput}.`, id: uniqueId() }]);
        return;
      }
      if (bookingStep === 'theater') {
        setSelectedTheater(userInput);
        console.log('[AgenticFlow] Fetching showtimes for movie:', selectedMovie.id, 'theater:', userInput.id || userInput, 'date:', selectedDate);
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_API}/shows/theaterAndShowTimingsByMovie`, {
          params: {
            movieId: selectedMovie.id,
            city: localStorage.getItem('city') || 'Pune',
            date: selectedDate
          }
        });
        const showtimes = Object.entries(res.data[userInput.id || userInput] || {}).map(([showId, showTime]) => ({ showId, showTime }));
        setAvailableShowtimes(showtimes);
        console.log('[AgenticFlow] Showtimes:', showtimes);
        setBookingStep('showtime');
        setMessages((prev) => [...prev, { role: 'assistant', content: `Select a showtime.`, id: uniqueId() }]);
        return;
      }
      if (bookingStep === 'showtime') {
        setSelectedShowtime(userInput);
        setBookingStep('seatCount');
        setMessages((prev) => [...prev, { role: 'assistant', content: `How many seats would you like to book?`, id: uniqueId() }]);
        return;
      }
      if (bookingStep === 'seatCount') {
        setSeatCount(userInput);
        console.log('[Agentic Flow] Seat count:', userInput);
        const theaterId = selectedTheater.id || selectedTheater;
        const showId = selectedShowtime.showId || selectedShowtime;
        console.log('[AgenticFlow] Fetching seat map for theater:', theaterId, 'show:', showId);
        const seatRes = await axios.get(`${import.meta.env.VITE_BACKEND_API}/theater-seats/theater/${theaterId}`);
        const priceRes = await axios.get(`${import.meta.env.VITE_BACKEND_API}/shows/seat/prices/${showId}`);
        const bookedRes = await axios.get(`${import.meta.env.VITE_BACKEND_API}/seats/show/${showId}/booked`);
        const formatShowSeatRows = seatRes.data.map(row => ({
          label: row.rowLabel,
          price: priceRes.data[row.seatType],
          count: row.seatCount,
          type: row.seatType
        }));
        setSeatRows(formatShowSeatRows);
        setSoldSeats(bookedRes.data.map(seat => seat.seatNo));
        console.log('[AgenticFlow] Seat rows:', formatShowSeatRows, 'Sold seats:', bookedRes.data.map(seat => seat.seatNo));
        setBookingStep('seats');
        setMessages((prev) => [...prev, { role: 'assistant', content: `Select your seats.`, id: uniqueId() }]);
        return;
      }
      if (bookingStep === 'seats') {
        setSelectedSeats(userInput);
        let total = 0;
        userInput.forEach(seatId => {
          const row = seatRows.find(r => r.label === seatId[0]);
          if (row) total += row.price;
        });
        setBookingSummary({
          movie: selectedMovie.movieName,
          theater: selectedTheater.name,
          time: selectedShowtime.showTime,
          seats: userInput,
          amount: total,
        });
        setBookingStep('payment'); // <-- Go to payment step
        setMessages((prev) => [...prev, { role: 'assistant', content: `Please review your booking and proceed to payment.`, id: uniqueId() }]);
        return;
      }
      if (bookingStep === 'payment') {
        await handlePayment();
        return;
      }
      if (bookingStep === 'confirm') {
        const showId = selectedShowtime.showId;
        try {
          await axios.post(`${import.meta.env.VITE_BACKEND_API}/ticket/book`, {
            showId,
            userId,
            requestSeats: selectedSeats
          }, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          setBookingStep('completed');
          setShowTicket(true); // Show the ticket summary
          setMessages((prev) => [...prev, { role: 'assistant', content: `Booking successful! Here is your ticket.`, id: uniqueId() }]);
        } catch (err) {
          console.error('[AgenticFlow] Booking error:', err);
          setMessages((prev) => [...prev, { role: 'assistant', content: `Booking failed: ${err.message}`, id: uniqueId() }]);
        }
        return;
      }
    } catch (err) {
      setBookingError('Something went wrong in the booking flow.');
      console.error('[AgenticFlow] Error:', err);
      setMessages((prev) => [...prev, { role: 'assistant', content: `Sorry, something went wrong in the booking process: ${err.message}`, id: uniqueId() }]);
    }
  };

  // --- LLM COMMAND SYSTEM ---
  const handleLLMCommand = async (command, args) => {
    switch (command) {
      case 'search_movie':
        setBookingStep('idle');
        await handleAgenticFlow(args.query);
        break;
      case 'view_movie':
        if (args && args.input) navigate(`/movie/${args.input}`);
        break;
      case 'book_ticket':
        if (args && args.input) {
          setBookingStep('idle');
          await handleAgenticFlow(args.input);
        }
        break;
      case 'go_home':
        navigate('/');
        break;
      case 'go_profile':
        navigate('/profile');
        break;
      case 'go_login':
        navigate('/login');
        break;
      case 'go_signup':
        navigate('/signup');
        break;
      case 'go_admin_dashboard':
        navigate('/admin/dashboard');
        break;
      case 'go_admin_movies':
        navigate('/admin/movies');
        break;
      case 'go_admin_theaters':
        navigate('/admin/theaters');
        break;
      case 'go_admin_shows':
        navigate('/admin/shows');
        break;
      case 'go_booking_summary':
        navigate('/booking-summary');
        break;
      case 'logout':
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/');
        window.location.reload();
        break;
      case 'show_profile_tickets':
        navigate('/profile'); // Profile page shows tickets
        break;
      case 'show_profile_details':
        navigate('/profile');
        break;
      case 'do_nothing':
      case 'cancel':
      default:
        break;
    }
  };

  // --- MAIN SEND HANDLER ---
  const handleSend = async (queryText) => {
    let textToSend = '';
    if (typeof queryText === 'string') textToSend = queryText.trim();
    else if (typeof input === 'string') textToSend = input.trim();
    else textToSend = '';
    if (!textToSend) return;
    setInput('');
    setIsLoading(true);
    const newUserMessage = { role: 'user', content: textToSend, id: uniqueId() };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    try {
      // 1. If in agentic flow, handle step
      if (bookingStep !== 'idle' && bookingStep !== 'completed') {
        if (['cancel', 'back'].includes(textToSend.toLowerCase())) {
          resetBooking();
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: 'Ticket Booking cancelled. You can start a new request anytime.', id: uniqueId() },
          ]);
          setIsLoading(false);
          return;
        }
        await handleAgenticFlow(queryText);
        setIsLoading(false);
        return;
      }
      // 2. Otherwise, use LLM to interpret intent and respond
      const systemPrompt = `You are MovieGPT, an advanced AI assistant for a movie ticket booking website. You can:
- Answer questions about movies, theaters, and bookings.
- Guide users through booking tickets step by step.
- Execute commands for navigation and booking (see below).
- Fetch live data from the database (see below).

COMMAND SYSTEM:
Respond in this JSON format ONLY (no markdown):
{
  "response": "Your conversational reply to the user.",
  "command": { "name": "<command_name>", "args": { ... } }
}

COMMANDS:
- search_movie: { query }
- view_movie: { input: <'id' of the movie> }
- book_ticket: { input }
- go_home: {}
- go_profile: {}
- go_login: {}
- go_signup: {}
- go_admin_dashboard: {}
- go_admin_movies: {}
- go_admin_theaters: {}
- go_admin_shows: {}
- go_booking_summary: {}
- logout: {}
- show_profile_tickets: {}
- show_profile_details: {}
- do_nothing: {}
- cancel: {}

DATABASE ACCESS:
If the user asks for data (e.g., available movies, showtimes, etc.), you can request a MySQL SELECT query. Reply with the query in the response field, and I will fetch the data and show it to the user.

Here is the MySQL database structure you MUST use for all queries:

Database: bookmyshow
Tables:

Table 1: movies
Columns:
id int AI PK 
duration int 
genre enum('ACTION','ANIMATION','COMEDY','DRAMA','HISTORICAL','ROMANTIC','SOCIAL','SPORTS','THRILLER','WAR') 
image_url varchar(255) 
language enum('ENGLISH','HINDI','KANNADA','MARATHI','PUNJAB','TAMIL','TELUGU') 
movie_name varchar(255) 
rating double 
release_date date

Table 2: theaters
Columns:
id int AI PK 
address varchar(255) 
city varchar(255) 
name varchar(255) 
number_of_screens int

Table 3: theater_seats
Columns:
id int AI PK 
row_label varchar(255) 
seat_count int 
seat_type enum('CLASSIC','CLASSICPLUS','PREMIUM') 
theater_id int -- Foreign Key reference to id in theaters table

Table 4: shows
Columns:
show_id int AI PK 
date date 
time time(6) 
movie_id int -- Foreign Key reference to id in movies table
theatre_id int -- Foreign Key reference to id in theaters table

Table 5: show_seats
Columns:
id int AI PK 
is_available bit(1) 
is_food_contains bit(1) 
price int 
seat_no varchar(255) 
seat_type enum('CLASSIC','CLASSICPLUS','PREMIUM') 
show_id int -- Foreign Key reference to show_id in shows table

Note: While fetching data from mysql, only use the above mentioned tables, if user asks for any other data, like How many users are using the website, or any user's ticket data then just respond as: "Due to Security Violations, I can't provide the requested data.".
And also while fetching data, fetch appropriate columns only, like for e.g.: while fetching all movies from movies table: No need to fetch the image url as it is no needed while responding to user.
`;

      // The Gemini API expects roles to alternate: user, model, user, model, ...
      // We'll prepend a system prompt as the first user message, and a canned model response.
      // Then we'll add the rest of the conversation.
      const conversationHistory = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Understood. I am MovieGPT. I will follow all instructions and provide responses in the requested JSON format. How can I help you?" }] },
        // `slice(1)` to skip the initial "Hello! I am MovieGPT..." message
        ...updatedMessages.slice(1).map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          // Strip HTML tags from content before sending to LLM
          parts: [{ text: String(msg.content).replace(/<[^>]*>?/gm, '') }],
        }))
      ];

      console.log('[LLM] Sending history:', conversationHistory);
      let llmResponse = await callGeminiLLM({ history: conversationHistory });
      console.log('[LLM] Raw response:', llmResponse);
      let parsed;
      try {
        parsed = JSON.parse(llmResponse);
      } catch (err) {
        console.error('[LLM] JSON parse error:', err, 'Raw response:', llmResponse);
        parsed = { response: llmResponse, command: { name: 'do_nothing', args: {} } };
      }
      if (parsed.response && parsed.response.toLowerCase().includes('select')) {
        try {
          const sql = parsed.response.match(/select[\s\S]*?;/i)?.[0] || parsed.response;
          console.log('[DB] Running SQL:', sql);
          const dbRes = await axios.get(import.meta.env.VITE_BACKEND_API + '/mysql/query', { params: { query: sql } });
          let formatted;
          try {
            formatted = formatTableData(dbRes.data);
          } catch (e) {
            formatted = JSON.stringify(dbRes.data);
          }
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Here is what you want:<br/>${formatted}`, id: uniqueId() },
          ]);
        } catch (err) {
          console.error('[DB] SQL error:', err);
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: `Sorry, I could not fetch the data from the database: ${err.message}`, id: uniqueId() },
          ]);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: parsed.response, id: uniqueId() },
        ]);
      }
      if (parsed.command) {
        console.log('[LLM] Executing command:', parsed.command);
        await handleLLMCommand(parsed.command.name, parsed.command.args);
      }
    } catch (err) {
      console.error('[Chatbot] Error in handleSend:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, there was an error processing your request: ${err.message}`, id: uniqueId() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Payment handler
  const handlePayment = async () => {
    setIsPaying(true);
    setPaymentError('');
    try {
      // 1. Create Razorpay order
      const orderResponse = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/payment/create-order`,
        { amount: bookingSummary.amount },
        { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
      );
      const orderData = orderResponse.data;
      console.log('[Payment] Order data:', orderData);
      // 2. Open Razorpay
      const options = {
        key: 'rzp_test_4DotYCe9Ux9uOT', // <-- Replace with your Razorpay key
        amount: orderData.amount,
        currency: 'INR',
        name: 'BookMyShow Clone',
        description: `Tickets for ${bookingSummary.movie}`,
        order_id: orderData.id,
        handler: async function (response) {
          // 3. Verify payment and book ticket
          setIsPaying(true);
          setPaymentError('');
          try {
            const verificationPayload = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              ticketEntryDto: {
                showId: selectedShowtime.showId,
                userId,
                requestSeats: selectedSeats,
              },
            };
            try {
              const verificationResponse = await axios.post(`${import.meta.env.VITE_BACKEND_API}/api/payment/verify-payment`,
                verificationPayload,
                { headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` } }
              );
              const resultMessage = verificationResponse.data;
              if (verificationResponse.status === 200) {
                setBookingStep('completed');
                setShowTicket(true);
                setMessages((prev) => [...prev, { role: 'assistant', content: `Booking successful! Here is your ticket.`, id: uniqueId() }]);
    } else {
                setPaymentError(resultMessage);
                setIsPaying(false);
              }
            } catch (err) {
              console.error("Payment verification failed:", err);
              setPaymentError("Payment verification failed. Please contact support.");
              setIsPaying(false);
            }
          } catch (verificationError) {
            console.error("Payment verification failed:", verificationError);
            setPaymentError("Payment verification failed. Please contact support.");
            setIsPaying(false);
          }
          finally {
            setIsPaying(false);
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test.user@example.com',
        },
        theme: { color: '#e11d48' },
      };
      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      paymentObject.on('payment.failed', function (response) {
        setPaymentError(`Payment Failed: ${response.error.description}`);
        setIsPaying(false);
      });
    } catch (err) {
      setPaymentError('Could not initiate payment. Please try again.');
      setIsPaying(false);
    }
    finally {
      setIsPaying(false);
    }
  };


  const handleChatToggle = () => {
    (localStorage.getItem("token")) ? setIsOpen((o) => !o) : navigate('/login');
  }

  // --- UI RENDERING ---
  return (
    <div className={`chatbot-container${isMaximized ? ' chatbot-maximized' : ''}`}>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h2>MovieGPT Assistant</h2>
            <div className="header-buttons">
              <button style={{ fontSize: '28px' }} onClick={() => { setMessages([initialMessage]); resetBooking(); }} className="new-chat-btn" title="New Chat">+</button>
              <button onClick={() => setIsOpen(false)} className="close-btn" title="Close Chat">&times;</button>
              <button onClick={() => setIsMaximized(m => !m)} className="maximize-btn" title={isMaximized ? 'Restore' : 'Maximize'}>
                {isMaximized ? '🗗' : '🗖'}
              </button>

            </div>
          </div>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.role === 'assistant'
                  ? <span dangerouslySetInnerHTML={{ __html: msg.content }} />
                  : <span>{msg.content}</span>
                }
              </div>
            ))}
            {/* Agentic booking UI steps and Cancel button */}
            {(bookingStep !== 'idle' && bookingStep !== 'completed') && (
              <div>
                {bookingStep === 'selectMovie' && movieSearchResults.length > 0 && (
                  <div className="chatbot-ui-wrapper">
                    {movieSearchResults.map((movie) => (
                      <button key={movie.id} className="chatbot-movie-btn" onClick={() => handleAgenticFlow(movie)}>
                        {movie.movieName} ({movie.language}, {movie.genre})
                  </button>
                    ))}
                  </div>
                )}
                {bookingStep === 'date' && (
                  <div className="chatbot-ui-wrapper"><ChatDatePicker dates={availableDates} onSelect={handleAgenticFlow} selectedDate={selectedDate} /></div>
                )}
                {bookingStep === 'theater' && (
                  <div className="chatbot-ui-wrapper"><ChatTheaterSelector theaters={availableTheaters} onSelect={handleAgenticFlow} selectedTheater={selectedTheater} /></div>
                )}
                {bookingStep === 'showtime' && (
                  <div className="chatbot-ui-wrapper"><ChatShowtimeSelector showtimes={availableShowtimes} onSelect={handleAgenticFlow} selectedShowtime={selectedShowtime} /></div>
                )}
                {bookingStep === 'seatCount' && (
                  <div className="chatbot-ui-wrapper"><ChatSeatCountSelector onSelect={handleAgenticFlow} selectedCount={seatCount} /></div>
                )}
                {bookingStep === 'seats' && (
                  <div className="chatbot-ui-wrapper">
                    <ChatSeatSelector
                      seatRows={seatRows}
                      soldSeats={soldSeats}
                      selectedSeats={selectedSeats}
                      onSelect={setSelectedSeats}
                      seatCount={seatCount}
                      onProceed={handleAgenticFlow}
                    />
                  </div>
                )}
                {bookingStep === 'payment' && bookingSummary && (
                  <div className="chatbot-ui-wrapper">
                    <ChatPaymentSummary
                      summary={bookingSummary}
                      onPay={handlePayment}
                      isPaying={isPaying}
                      error={paymentError}
                    />
                  </div>
                )}
                {bookingStep === 'confirm' && bookingSummary && (
                  <div className="chatbot-ui-wrapper"><ChatBookingSummary {...bookingSummary} onConfirm={() => handleAgenticFlow('confirm')} /></div>
                )}
                {/* Cancel button */}
                <div className="chatbot-ui-wrapper">
                  <button className="chatbot-cancel-btn" onClick={() => {
                    resetBooking();
                    setMessages((prev) => [
                      ...prev,
                      { role: 'assistant', content: 'Ticket Booking has been cancelled. You can start a new request anytime.', id: uniqueId() },
                    ]);
                  }}>Cancel</button>
                </div>
              </div>
            )}
            {/* Ticket summary after booking */}
            {bookingStep === 'completed' && bookingSummary && (
              <div className="chatbot-ui-wrapper">
                <ChatTicketSummary summary={bookingSummary} onViewTickets={() => navigate('/profile')} />
              </div>
            )}
            {isLoading && <div key="loading" className="message bot">...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isLoading ? 'Loading...' : 'Ask me anything...'}
              disabled={isLoading}
            />
            <button style={{ display: 'flex', fontSize: '24px', position: 'relative', right: '6px' }} onClick={handleSend} disabled={isLoading || !input.trim()}>➤</button>
          </div>
        </div>
      )}
      <button onClick={() => handleChatToggle()} className="chat-toggle-btn">
        {isOpen ? '✖' : '💬'}
      </button>
    </div>
  );
};

export default Chatbot;