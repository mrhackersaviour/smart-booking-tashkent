import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, MapPin, Calendar, CreditCard, Star, Crown, Bell, MessageCircle, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'How do I create an account?',
    answer:
      'Click the "Sign Up" button in the top-right corner of the page. Fill in your full name, email address, and choose a password. Once submitted, you\'ll be logged in automatically and can start booking venues right away.',
  },
  {
    question: 'How do I book a venue?',
    answer:
      'Browse available venues from the "Venues" page. Click on a venue to see details, available time slots, and pricing. Select your preferred date and time, then click "Book Now". You\'ll be taken to the checkout page to confirm your booking.',
  },
  {
    question: 'How can I cancel or modify a booking?',
    answer:
      'Go to "My Bookings" from the navigation menu. Find the booking you want to change, and click "Cancel" to cancel it. Please note that cancellation policies may vary by venue. To modify a booking, cancel the existing one and create a new booking with your preferred details.',
  },
  {
    question: 'What are Loyalty Points and how do they work?',
    answer:
      'You earn loyalty points every time you complete a booking. Points accumulate in your account and can be viewed on the "Rewards" page. As you earn more points, you unlock higher tiers (Bronze, Silver, Gold) with better benefits like discounts and priority booking.',
  },
  {
    question: 'What are Subscription Plans?',
    answer:
      'Subscription Plans offer recurring benefits for frequent users. Visit the "Plans" page to see available options. Plans may include discounted rates, priority access to popular venues, and bonus loyalty points. Choose the plan that best fits your booking frequency.',
  },
  {
    question: 'How do payments work?',
    answer:
      'After selecting your venue and time slot, you\'ll be directed to the checkout page. We support secure payment processing. Your payment is confirmed instantly, and you\'ll receive a booking confirmation with all the details.',
  },
  {
    question: 'How do I receive notifications?',
    answer:
      'Click the bell icon in the navigation bar to view your notifications. You\'ll receive notifications for booking confirmations, reminders, cancellations, and loyalty point updates. Make sure to check your notifications regularly to stay updated.',
  },
  {
    question: 'What is the AI Chat Assistant?',
    answer:
      'The AI Chat Assistant is the chat bubble in the bottom-right corner of the screen. You can ask it questions about venues, get booking recommendations, check availability, or get help with any feature. It\'s available 24/7 to assist you.',
  },
];

const sections = [
  {
    icon: MapPin,
    title: 'Browsing Venues',
    content:
      'Navigate to the "Venues" page to explore all available spaces in Tashkent. Each venue card shows the name, type, location, price, and rating. Click on any venue to view detailed information including photos, amenities, available time slots, and reviews. Use the search and filter options to find the perfect venue for your needs.',
  },
  {
    icon: Calendar,
    title: 'Making a Booking',
    content:
      'Once you\'ve found a venue, select your preferred date and available time slot, then click "Book Now". You\'ll need to be logged in to make a booking. Review your booking details on the checkout page and confirm your payment. After booking, you\'ll see the confirmation in "My Bookings".',
  },
  {
    icon: CreditCard,
    title: 'Payments & Checkout',
    content:
      'Payments are processed securely during checkout. The total amount includes the venue rental fee for your selected time slot. Once payment is confirmed, your booking is finalized and you\'ll receive a notification. You can view all your past and upcoming bookings in the "My Bookings" section.',
  },
  {
    icon: Star,
    title: 'Loyalty Rewards',
    content:
      'Earn points with every completed booking. Visit the "Rewards" page to track your points, see your current tier, and view your transaction history. Higher tiers unlock better perks: Bronze starts at 0 points, Silver at 500, and Gold at 1500. Keep booking to level up!',
  },
  {
    icon: Crown,
    title: 'Subscription Plans',
    content:
      'For frequent bookers, subscription plans offer the best value. Go to "Plans" to compare options. Each plan has different benefits such as discounted venue rates, bonus loyalty points, and priority access. Subscribe to a plan that matches how often you book.',
  },
  {
    icon: Bell,
    title: 'Notifications',
    content:
      'Stay informed with real-time notifications. The bell icon in the top navigation shows your unread notification count. Click it to see booking confirmations, upcoming booking reminders, cancellation notices, and loyalty point updates. Never miss an important update about your bookings.',
  },
  {
    icon: MessageCircle,
    title: 'AI Chat Assistant',
    content:
      'Need quick help? Use the AI Chat Assistant by clicking the chat bubble at the bottom-right corner of any page. Ask about venue availability, get personalized recommendations, or get help navigating the platform. The assistant understands natural language, so just type your question.',
  },
];

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{question}</span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 text-gray-600 leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

export default function Help() {
  const [search, setSearch] = useState('');

  const filteredFaqs = faqs.filter(
    (f) =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="bg-primary-100 rounded-full p-4">
            <HelpCircle className="h-10 w-10 text-primary-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Everything you need to know about using Curator. Find answers to common questions or learn how to use each feature.
        </p>

        {/* Search */}
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Getting Started */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <ol className="list-decimal list-inside space-y-3 text-gray-700 leading-relaxed">
            <li><strong>Create an account</strong> — Click "Sign Up" and fill in your details to get started.</li>
            <li><strong>Browse venues</strong> — Explore available spaces on the "Venues" page.</li>
            <li><strong>Book a slot</strong> — Select your preferred date and time, then confirm your booking.</li>
            <li><strong>Earn rewards</strong> — Get loyalty points for every completed booking and unlock perks.</li>
            <li><strong>Stay updated</strong> — Check notifications for booking updates and reminders.</li>
          </ol>
        </div>
      </section>

      {/* Feature Guides */}
      {filteredSections.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Feature Guide</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.title}
                  className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-50 rounded-lg p-2">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{section.content}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ */}
      {filteredFaqs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>
      )}

      {/* No results */}
      {search && filteredFaqs.length === 0 && filteredSections.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          <p>No results found for "{search}". Try a different search term or use the AI Chat Assistant for help.</p>
        </div>
      )}

      {/* Contact / Support */}
      <section className="bg-primary-50 rounded-xl p-6 text-center space-y-3">
        <h2 className="text-xl font-bold text-gray-900">Still need help?</h2>
        <p className="text-gray-600">
          Use the AI Chat Assistant in the bottom-right corner for instant help, or contact our support team.
        </p>
        <p className="text-sm text-gray-500">
          Email: support@smartbook-tashkent.uz &bull; Phone: +998 71 123 45 67
        </p>
      </section>
    </div>
  );
}
