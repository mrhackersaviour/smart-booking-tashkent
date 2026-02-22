import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { CreditCard, Calendar, MapPin, Users, Clock, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

// In production, use environment variable
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_demo');

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#374151',
      fontFamily: 'Inter, system-ui, sans-serif',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
    },
  },
};

function PaymentForm({ booking, clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      // In production, use stripe.confirmCardPayment
      // For demo, simulate payment
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Confirm payment with backend
      await api.confirmPayment({
        booking_id: booking.id,
        payment_intent_id: clientSecret.split('_secret')[0],
      });

      onSuccess();
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
        <div className="border border-gray-200 rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Shield className="h-4 w-4" />
        <span>Your payment is secured with 256-bit SSL encryption</span>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full btn-primary py-3 text-lg flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Pay {booking.amount?.toLocaleString()} UZS
          </>
        )}
      </button>

      <p className="text-xs text-center text-gray-400">
        By completing this purchase, you agree to our Terms of Service
      </p>
    </form>
  );
}

function PaymentSuccess({ booking }) {
  const navigate = useNavigate();

  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
      <p className="text-gray-500 mb-6">Your booking has been confirmed and paid.</p>

      <div className="card p-4 text-left mb-6">
        <div className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Booking ID</span>
            <span className="font-medium">#{booking.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount Paid</span>
            <span className="font-medium text-green-600">{booking.amount?.toLocaleString()} UZS</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={() => navigate('/my-bookings')} className="btn-primary">
          View My Bookings
        </button>
        <button onClick={() => navigate('/venues')} className="btn-secondary">
          Browse More
        </button>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadBookingAndPaymentIntent();
  }, [bookingId]);

  const loadBookingAndPaymentIntent = async () => {
    try {
      const [bookingData, paymentData] = await Promise.all([
        api.getBooking(bookingId),
        api.createPaymentIntent(bookingId),
      ]);

      setBooking({
        ...bookingData.booking,
        venue: bookingData.venue,
        amount: paymentData.amount,
      });
      setPaymentIntent(paymentData);
    } catch (err) {
      setError(err.message || 'Failed to load checkout');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-48 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="bg-red-50 text-red-700 px-6 py-4 rounded-lg mb-6">{error}</div>
        <button onClick={() => navigate('/my-bookings')} className="btn-secondary">
          Go to My Bookings
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <PaymentSuccess booking={booking} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h1>

      {/* Booking Summary */}
      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <p className="font-medium text-gray-900">{booking.venue?.name}</p>
              <p className="text-sm text-gray-500">{booking.venue?.address}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">{booking.booking_date}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">{booking.start_time} - {booking.end_time}</span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gray-400" />
            <span className="text-gray-700">{booking.guests_count} guests</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Total Amount</span>
            <span className="text-2xl font-bold text-gray-900">{booking.amount?.toLocaleString()} UZS</span>
          </div>
        </div>
      </div>

      {/* Payment Form */}
      <div className="card p-5">
        <Elements stripe={stripePromise}>
          <PaymentForm
            booking={booking}
            clientSecret={paymentIntent.clientSecret}
            onSuccess={() => setSuccess(true)}
          />
        </Elements>
      </div>

      {/* Demo mode note */}
      <div className="mt-4 text-center text-xs text-gray-400">
        Demo mode: Use card 4242 4242 4242 4242, any future date, any CVC
      </div>
    </div>
  );
}
