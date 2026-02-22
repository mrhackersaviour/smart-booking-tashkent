import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, MessageSquarePlus, Ticket, Bookmark, Compass, Settings,
  HelpCircle, LogOut, Bot, Paperclip, Send, Bell, Star, MapPin,
  Wifi, VolumeX, ArrowRight,
} from 'lucide-react';
import { Card, Avatar, Badge } from '../components/ui';
import { api } from '../services/api';

/**
 * AIAssistant — full-page Concierge AI chat experience.
 *
 * Reference: design-reference/ai_assistant_chat/
 *
 * Layout:
 *  - Left rail (w-72): brand mark, "New Chat" active item, History list,
 *    Upgrade Membership gradient CTA, Support / Sign Out.
 *  - Top bar: AI Assistant title + ONLINE pulse badge + section nav + avatar.
 *  - Conversation: alternating user (right, primary-container bubble) and
 *    assistant (left, glass card bubble + Bot avatar). Assistant messages may
 *    embed a rich VenueRecommendationCard.
 *  - Footer composer: suggestion chips + input box (attach + textarea + send).
 *
 * Business logic preserved from AIChatWidget:
 *  - api.sendAIChatMessage(text, conversationId) → { conversation_id, message, venues }
 *  - Conversation id persists across turns.
 *  - Venue Book Now navigates to /venues/:id/book.
 *
 * Placeholders (no backend endpoint yet):
 *  - History list (Dinner in Soho, etc.) is static — TODO wire api.getAIConversations().
 *  - Attach button is decorative — no upload endpoint.
 */

const HISTORY = [
  { id: 1, icon: Ticket, title: 'Dinner in Soho', when: '2h ago' },
  { id: 2, icon: Bookmark, title: 'Cafe with WiFi', when: 'Yesterday' },
  { id: 3, icon: Compass, title: 'Gym memberships', when: 'Last week' },
];

const SUGGESTIONS = [
  'Find a restaurant nearby',
  'Show my upcoming bookings',
  'Best rated cafes',
];

export default function AIAssistant({ user, onLogout }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'user',
      content: "I'm looking for a quiet place to work this afternoon in Tashkent. Somewhere with great coffee and strong WiFi.",
      time: '14:20 PM',
    },
    {
      role: 'assistant',
      content: "I've analyzed 15 venues in Tashkent with high WiFi reliability scores. Based on your preference for a quiet atmosphere, I highly recommend this spot:",
      venue: {
        id: 'demo',
        name: 'The Glasshouse Cafe',
        district: 'Yunusabad, Tashkent',
        rating: 4.8,
        price_range: 2,
        image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=900&q=80',
        amenities: [
          { icon: Wifi, label: 'Strong WiFi' },
          { icon: VolumeX, label: 'Quiet' },
        ],
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const scrollerRef = useRef(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, loading]);

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value || loading) return;
    setInput('');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: value, time: nowLabel() },
    ]);
    setLoading(true);
    try {
      const resp = await api.sendAIChatMessage(value, conversationId);
      setConversationId(resp.conversation_id);
      const venue = resp.venues?.[0];
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: resp.message,
          venue: venue
            ? {
                id: venue.id,
                name: venue.name,
                district: venue.district,
                rating: venue.rating,
                price_range: venue.price_range,
                image: venue.image_url,
                amenities: [],
              }
            : null,
        },
      ]);
    } catch {
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
      send();
    }
  };

  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -mt-8 bg-surface min-h-screen flex">
      {/* ============================================================
          LEFT RAIL
          ============================================================ */}
      <aside className="hidden md:flex w-72 shrink-0 flex-col bg-surface-container-low h-[calc(100vh-4rem)] sticky top-16 overflow-hidden">
        {/* Brand */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shadow-ambient">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tightest text-on-surface">
              Concierge AI
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-primary">
              Premium Tier
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 mt-2 space-y-1 overflow-y-auto hide-scrollbar">
          <RailItem icon={MessageSquarePlus} label="New Chat" active />

          <div className="pt-6 pb-2 px-4">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
              History
            </span>
          </div>
          {HISTORY.map((h) => (
            <RailHistoryItem key={h.id} {...h} />
          ))}

          <div className="pt-4">
            <RailItem icon={Settings} label="Settings" />
          </div>
        </nav>

        {/* Footer CTAs */}
        <div className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => navigate('/subscriptions')}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-ambient hover:opacity-95 transition-all active:scale-[0.98]"
          >
            Upgrade Membership
          </button>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => navigate('/help')}
              className="flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg text-sm transition-colors"
            >
              <HelpCircle className="h-4 w-4" /> Support
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-2 text-error hover:bg-error/10 rounded-lg text-sm transition-colors"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================================
          MAIN COLUMN
          ============================================================ */}
      <div className="flex-1 flex flex-col min-w-0 h-[calc(100vh-4rem)] sticky top-16">
        {/* Top bar */}
        <header className="h-16 px-6 md:px-10 bg-surface-container-lowest/70 backdrop-blur-glass flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-black uppercase tracking-tightest text-on-surface">
                AI Assistant
              </h2>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                Online
              </span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-7 text-sm font-semibold">
              <span className="text-primary border-b-2 border-primary pb-1">Concierge</span>
              <button type="button" onClick={() => navigate('/dashboard')} className="text-on-surface-variant hover:text-primary transition-colors">
                Portfolio
              </button>
              <button type="button" onClick={() => navigate('/my-bookings')} className="text-on-surface-variant hover:text-primary transition-colors">
                History
              </button>
            </nav>
            <button type="button" className="text-on-surface-variant hover:text-primary transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <Avatar size="sm" name={user?.full_name || 'Guest'} src={user?.avatar_url} />
          </div>
        </header>

        {/* Conversation scroller */}
        <section
          ref={scrollerRef}
          className="flex-1 overflow-y-auto px-4 md:px-10 py-10 space-y-8 bg-surface-container-low"
        >
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} onBook={(v) => navigate(`/venues/${v.id}/book`)} />
          ))}
          {loading && <TypingBubble />}
        </section>

        {/* Composer */}
        <footer className="p-6 md:p-8 bg-surface-container-low shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 mb-5 overflow-x-auto pb-2 hide-scrollbar">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  disabled={loading}
                  className="whitespace-nowrap px-4 py-2 bg-surface-container-lowest rounded-full text-xs font-semibold text-on-surface-variant hover:text-primary hover:ring-1 hover:ring-primary/30 transition-all shadow-ambient disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 blur-xl group-focus-within:bg-primary/10 transition-all rounded-2xl pointer-events-none" />
              <div className="relative flex items-center bg-surface-container-lowest rounded-2xl p-2 shadow-ambient">
                <button
                  type="button"
                  className="p-3 text-on-surface-variant hover:text-primary transition-colors"
                  aria-label="Attach"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about venues..."
                  disabled={loading}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-on-surface-variant/50 py-3 px-2"
                />
                <button
                  type="button"
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="w-12 h-12 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl flex items-center justify-center shadow-ambient hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  aria-label="Send"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>

            <p className="text-center mt-4 text-[10px] text-on-surface-variant/50 uppercase tracking-widest font-medium">
              Powered by Kinetic Curator Engine v2.4
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   Sub-components
   ============================================================ */

function nowLabel() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function RailItem({ icon: Icon, label, active }) {
  return (
    <button
      type="button"
      className={[
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all',
        active
          ? 'bg-primary-fixed/60 text-primary'
          : 'text-on-surface-variant hover:bg-surface-container',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

function RailHistoryItem({ icon: Icon, title, when }) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors text-left"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate">{title}</span>
        <span className="text-[10px] opacity-60">{when}</span>
      </div>
    </button>
  );
}

function ChatBubble({ message, onBook }) {
  const isUser = message.role === 'user';
  if (isUser) {
    return (
      <div className="flex justify-end w-full max-w-4xl mx-auto">
        <div className="flex flex-col items-end gap-2 max-w-[80%]">
          <div className="bg-gradient-to-r from-primary to-primary-container text-white px-6 py-4 rounded-2xl rounded-tr-md shadow-ambient">
            <p className="text-[15px] leading-relaxed">{message.content}</p>
          </div>
          {message.time && (
            <span className="text-[10px] text-on-surface-variant font-medium">{message.time}</span>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start w-full max-w-4xl mx-auto gap-4">
      <div className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-ambient flex items-center justify-center shrink-0">
        <Bot className="h-5 w-5 text-primary" />
      </div>
      <div className="flex flex-col gap-4 max-w-[85%]">
        <div className="bg-surface-container-lowest text-on-surface px-6 py-4 rounded-2xl rounded-tl-md shadow-ambient">
          <p className="text-[15px] leading-relaxed">{message.content}</p>
        </div>
        {message.venue && <VenueRecommendationCard venue={message.venue} onBook={onBook} />}
      </div>
    </div>
  );
}

function VenueRecommendationCard({ venue, onBook }) {
  return (
    <Card padding="none" className="rounded-2xl overflow-hidden group hover:shadow-ambient transition-all">
      {venue.image && (
        <div className="h-48 w-full overflow-hidden relative bg-surface-container-high">
          <img
            src={venue.image}
            alt={venue.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          {venue.rating && (
            <div className="absolute top-4 right-4 bg-surface-container-lowest/85 backdrop-blur-glass px-3 py-1 rounded-full flex items-center gap-1 shadow-ambient">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-current" />
              <span className="text-xs font-bold">{venue.rating}</span>
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold tracking-tightest text-on-surface truncate">
              {venue.name}
            </h3>
            <p className="text-sm text-on-surface-variant flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5" /> {venue.district}
            </p>
          </div>
          {venue.price_range && (
            <Badge variant="primary">
              {'$'.repeat(venue.price_range)}
            </Badge>
          )}
        </div>
        {venue.amenities?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {venue.amenities.map((a, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-xs font-medium text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-lg"
              >
                <a.icon className="h-3.5 w-3.5" /> {a.label}
              </span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => onBook(venue)}
          className="mt-6 w-full py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all"
        >
          Book Now <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start w-full max-w-4xl mx-auto gap-4">
      <div className="w-10 h-10 rounded-full bg-surface-container-lowest shadow-ambient flex items-center justify-center shrink-0">
        <Bot className="h-5 w-5 text-primary" />
      </div>
      <div className="bg-surface-container-lowest px-6 py-4 rounded-2xl rounded-tl-md shadow-ambient flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 animate-bounce" />
        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 animate-bounce" style={{ animationDelay: '0.15s' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40 animate-bounce" style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  );
}
