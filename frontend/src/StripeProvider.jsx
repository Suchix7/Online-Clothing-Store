import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function App() {
  return (
    <Elements stripe={stripePromise}>
      <Checkout />
    </Elements>
  );
}
