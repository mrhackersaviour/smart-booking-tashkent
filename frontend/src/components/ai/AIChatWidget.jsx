import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, MapPin, Clock, Star } from 'lucide-react';
import { api } from '../../services/api';

function VenueCard({ venue, onBook }) {
  const priceDisplay = '₽'.repeat(venue.price_range || 2);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mt-2">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-gray-900 text-sm">{venue.name}</h4>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3" /> {venue.district}
          </p>
        </div>
        <div className="flex items-center gap-1 text-amber-500 text-xs">
          <Star className="h-3 w-3 fill-current" />
          {venue.rating?.toFixed(1) || 'N/A'}
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500">{venue.cuisine_type} | {priceDisplay}</span>
        <button
          onClick={() => onBook(venue)}
          className="text-xs bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 transition-colors"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

function Message({ message, onVenueBook }) {
  const isUser = message.role === 'user';

  // Parse venue recommendations from assistant messages
  const parseVenues = (content) => {
    if (!content.venues) return null;
    return content.venues;
  };

  const venues = !isUser && message.venues ? message.venues : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {venues && venues.length > 0 && (
          <div className="mt-2 space-y-2">
            {venues.map((venue, i) => (
              <VenueCard key={venue.id || i} venue={venue} onBook={onVenueBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: "Hi! I'm your Smart Booking assistant. I can help you find the perfect venue in Tashkent. What are you looking for today? A romantic restaurant, a cozy cafe, or maybe a fitness center?",
        },
      ]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await api.sendAIChatMessage(userMessage, conversationId);
      setConversationId(response.conversation_id);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.message,
          venues: response.venues || [],
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVenueBook = (venue) => {
    window.location.href = `/book/${venue.id}`;
  };

  const quickActions = [
    { label: 'Best restaurants', query: 'Show me the best rated restaurants in Tashkent' },
    { label: 'Cafes nearby', query: 'Find cozy cafes in Yunusabad district' },
    { label: 'VIP dining', query: 'I need a premium restaurant with VIP tables for a special occasion' },
    { label: 'Group booking', query: 'I need a venue for a group of 10 people' },
  ];

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-105 flex items-center justify-center z-50"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs text-primary-100">Powered by Claude</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {messages.map((msg, i) => (
              <Message key={i} message={msg} onVenueBook={handleVenueBook} />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick actions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <div className="flex flex-wrap gap-1.5">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(action.query);
                      handleSend();
                    }}
                    disabled={loading}
                    className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about venues..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
