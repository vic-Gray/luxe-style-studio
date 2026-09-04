import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  ShoppingBag,
  MapPin,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useCart } from "@/context/CartContext";

interface FormData {
  name: string;
  email: string;
  phone: string;
  note: string;
  shippingAddress: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  shippingAddress?: string;
}

interface CustomerLocation {
  lat: number;
  lng: number;
}

type LocationStatus = "idle" | "loading" | "success" | "error";

const Checkout = () => {
  const navigate = useNavigate();

  const { state, subtotal, itemCount } = useCart();

  const { items } = state;

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    note: "",
    shippingAddress: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [errorMessage, setErrorMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isOrderPlaced, setIsOrderPlaced] =
    useState(false);

  const [orderId, setOrderId] = useState("");

  /* ---------------- LOCATION SHARING ---------------- */
  const [location, setLocation] =
    useState<CustomerLocation | null>(null);

  const [locationStatus, setLocationStatus] =
    useState<LocationStatus>("idle");

  const [locationError, setLocationError] = useState("");

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError(
        "Geolocation isn't supported by your browser"
      );
      return;
    }

    setLocationStatus("loading");
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("success");
      },
      (error) => {
        setLocationStatus("error");
        setLocationError(
          error.code === error.PERMISSION_DENIED
            ? "Location permission denied. You can still check out without it."
            : "Couldn't get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  /* ---------------- EMPTY CART ---------------- */
  if (items.length === 0 && !isOrderPlaced) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <ShoppingBag
            size={48}
            className="mx-auto text-muted-foreground/30"
          />

          <h2 className="font-display text-2xl">
            Your cart is empty
          </h2>

          <button
            onClick={() =>
              navigate("/#collection")
            }
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Collection
          </button>
        </motion.div>
      </div>
    );
  }

  /* ---------------- VALIDATION ---------------- */
  const validateForm = () => {
    const newErrors: FormErrors = {};

    let valid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    }

    if (
      !formData.email.trim() &&
      !formData.phone.trim()
    ) {
      newErrors.email =
        "Email or phone required";

      newErrors.phone =
        "Email or phone required";

      valid = false;
    }

    if (!formData.shippingAddress.trim()) {
      newErrors.shippingAddress =
        "Address is required";

      valid = false;
    }

    setErrors(newErrors);

    return valid;
  };

  /* ---------------- INPUT CHANGE ---------------- */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (
      errors[name as keyof FormErrors]
    ) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  /* ---------------- SUBMIT ORDER + PAYSTACK ---------------- */
  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    setErrorMessage("");

    try {
      /* ---------------- CREATE ORDER PAYLOAD ---------------- */
      const orderPayload = {
        userId: "guest",

        fullName: formData.name,

        email: formData.email,

        phone: formData.phone,

        deliveryAddress:
          formData.shippingAddress,

        notes: formData.note,

        currency: "NGN",

        // Customer's shared geolocation (optional — may be null
        // if they declined or the browser doesn't support it)
        location: location
          ? { lat: location.lat, lng: location.lng }
          : null,

        items: items.map((item) => ({
          itemId: item.id,

          name: item.name,

          quantity: item.quantity,

          size: item.size ?? null,

          color: item.color ?? null,

          price:
            typeof item.price === "string"
              ? parseFloat(
                  item.price.replace(
                    /[^0-9.-]+/g,
                    ""
                  )
                )
              : Number(item.price),
        })),

        total: subtotal,
      };

      /* ---------------- STEP 1: CREATE ORDER ---------------- */
      const orderResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/orders`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            orderPayload
          ),
        }
      );

      const orderData =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          orderData?.message ||
            "Failed to create order"
        );
      }

      const createdOrderId =
        orderData._id ||
        orderData.orderId;

      if (!createdOrderId) {
        throw new Error(
          "Order ID not returned"
        );
      }

      /* ---------------- STEP 2: INITIALIZE PAYMENT ---------------- */
      const paymentResponse =
        await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/payments/initialize`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              orderId: createdOrderId,
            }),
          }
        );

      const paymentData =
        await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(
          paymentData?.message ||
            "Failed to initialize payment"
        );
      }

      /* ---------------- GET PAYSTACK URL ---------------- */
      const paymentUrl =
        paymentData?.data
          ?.authorization_url;

      if (!paymentUrl) {
        throw new Error(
          "Payment link not returned"
        );
      }

      /* ---------------- SAVE ORDER ---------------- */
      localStorage.setItem(
        "pendingOrderId",
        createdOrderId
      );

      setOrderId(createdOrderId);

      /* ---------------- REDIRECT TO PAYSTACK ---------------- */
      window.location.href =
        paymentUrl;
    } catch (err: any) {
      console.error(
        "Checkout error:",
        err
      );

      setErrorMessage(
        err.message ||
          "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---------------- SUCCESS PAGE ---------------- */
  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-32 text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 mx-auto bg-green-500 text-white rounded-full flex items-center justify-center"
          >
            <CheckCircle size={40} />
          </motion.div>

          <h1 className="text-3xl font-bold text-green-600">
            Order Placed Successfully!
          </h1>

          <p className="text-muted-foreground">
            Thank you, {formData.name}
          </p>

          <div className="p-4 border bg-green-50 text-green-700 inline-block">
            Order ID: {orderId}
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <button
              onClick={() =>
                navigate("/#collection")
              }
              className="px-6 py-3 bg-black text-white"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---------------- MAIN UI ---------------- */
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Navbar />

      <MobileBottomNav />

      <main className="pt-28 md:pt-36 max-w-6xl mx-auto px-6 md:px-12 pb-24">
        {/* BACK BUTTON */}
        <motion.button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 text-sm text-muted-foreground"
        >
          <ArrowLeft size={16} />
          Back
        </motion.button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* FORM */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <input
              name="name"
              placeholder="Full Name"
              onChange={
                handleInputChange
              }
              className="w-full p-3 border"
            />

            {errors.name && (
              <p className="text-red-500 text-sm">
                {errors.name}
              </p>
            )}

            <input
              name="email"
              placeholder="Email"
              onChange={
                handleInputChange
              }
              className="w-full p-3 border"
            />

            <input
              name="phone"
              placeholder="Phone"
              onChange={
                handleInputChange
              }
              className="w-full p-3 border"
            />

            <textarea
              name="shippingAddress"
              placeholder="Shipping Address"
              onChange={
                handleInputChange
              }
              className="w-full p-3 border"
            />

            {errors.shippingAddress && (
              <p className="text-red-500 text-sm">
                {errors.shippingAddress}
              </p>
            )}

            {/* SHARE LOCATION */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleShareLocation}
                disabled={locationStatus === "loading"}
                className="flex items-center gap-2 text-sm border px-3 py-2 hover:bg-muted/50 disabled:opacity-60"
              >
                {locationStatus === "loading" ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : locationStatus === "success" ? (
                  <CheckCircle size={16} className="text-green-600" />
                ) : (
                  <MapPin size={16} />
                )}

                {locationStatus === "success"
                  ? "Location Shared"
                  : "Share My Location"}
              </button>

              <p className="text-xs text-muted-foreground">
                Sharing your location helps our riders find you
                faster. This is optional.
              </p>

              {locationStatus === "success" && location && (
                <p className="text-xs text-green-600">
                  Captured: {location.lat.toFixed(4)},{" "}
                  {location.lng.toFixed(4)}
                </p>
              )}

              {locationStatus === "error" && (
                <p className="text-xs text-red-500">
                  {locationError}
                </p>
              )}
            </div>

            <textarea
              name="note"
              placeholder="Order Note (optional)"
              onChange={
                handleInputChange
              }
              className="w-full p-3 border"
            />

            {/* ERROR */}
            {errorMessage && (
              <div className="p-3 bg-red-100 text-red-600 border border-red-300 text-sm">
                {errorMessage}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-black text-white flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />

                  Processing...
                </>
              ) : (
                `Pay ₦${subtotal.toLocaleString(
                  "en-NG"
                )}`
              )}
            </button>
          </form>

          {/* ORDER SUMMARY */}
          <div className="border p-6 h-fit">
            <h2 className="text-lg mb-4">
              Order Summary
            </h2>

            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between mb-3"
              >
                <span>
                  {item.name}
                </span>

                <span>
                  × {item.quantity}
                </span>
              </div>
            ))}

            <hr className="my-4" />

            <div className="flex justify-between">
              <span>Total Items</span>

              <span>{itemCount}</span>
            </div>

            <div className="flex justify-between font-bold mt-2">
              <span>Total</span>

              <span>
                ₦
                {subtotal.toLocaleString(
                  "en-NG"
                )}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;