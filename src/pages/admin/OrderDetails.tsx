import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

interface OrderItem {
  name?: string;
  slug?: string;
  image?: string;
  category?: string;
  size?: string;
  color?: string;
  quantity?: number;
  price?: number;
}

interface Order {
  _id?: string;
  createdAt?: string;
  status?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  deliveryAddress?: string;
  shippingAddress?: string;
  notes?: string;
  total?: number;
  currency?: string;
  isPaid?: boolean;
  location?: { lat: number; lng: number; accuracy?: number } | null;
  items?: OrderItem[];
  userId?: { name?: string; email?: string };
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("admin-token");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;

      setLoading(true);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch order");
        }

        const data = await res.json();

        // API returns direct object
        setOrder(data);
      } catch (err) {
        console.error("Failed to load order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, token]);

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 text-gray-500">Loading order...</div>
      </AdminLayout>
    );
  }

  /* ---------------- EMPTY ---------------- */
  if (!order) {
    return (
      <AdminLayout>
        <div className="p-6 text-red-500">Order not found</div>
      </AdminLayout>
    );
  }

  const hasLocation =
    order.location &&
    typeof order.location.lat === "number" &&
    typeof order.location.lng === "number";

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* BACK */}
        <button onClick={() => navigate(-1)} className="text-sm underline">
          ← Back
        </button>

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Order #{order._id?.slice(-8)}
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* STATUS */}
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium
                ${
                  order.status === "delivered"
                    ? "bg-green-100 text-green-700"
                    : order.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                }
              `}
            >
              {order.status || "pending"}
            </span>

            {/* PAYMENT */}
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium
                ${
                  order.isPaid
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-600"
                }
              `}
            >
              {order.isPaid ? "Paid" : "Unpaid"}
            </span>
          </div>
        </div>

        {/* CUSTOMER INFO */}
        <div className="border rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-4">Customer Information</h2>

          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Name:</span>{" "}
              {order.fullName || order.userId?.name || "N/A"}
            </p>

            <p>
              <span className="font-medium">Email:</span>{" "}
              {order.email || order.userId?.email || "N/A"}
            </p>

            <p>
              <span className="font-medium">Phone:</span>{" "}
              {order.phone || order.userId?.phone || "N/A"}
            </p>

            <p>
              <span className="font-medium">Delivery Address:</span>{" "}
              {order.deliveryAddress ||
                order.shippingAddress ||
                order.userId?.address ||
                "N/A"}
            </p>

            {/* SHARED LOCATION */}
            <p className="flex items-center gap-1">
              <span className="font-medium">Shared Location:</span>{" "}
              {hasLocation ? (
                <a
                  href={`https://www.google.com/maps?q=${order.location.lat},${order.location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 underline"
                >
                  <MapPin size={14} />
                  View on Google Maps ({order.location.lat.toFixed(4)},{" "}
                  {order.location.lng.toFixed(4)})
                </a>
              ) : (
                <span className="text-gray-400">Not shared</span>
              )}
            </p>

            {order.notes && (
              <p>
                <span className="font-medium">Notes:</span> {order.notes}
              </p>
            )}
          </div>

          {/* MAP PREVIEW */}
          {hasLocation && (
            <div className="mt-4 rounded-lg overflow-hidden border h-48">
              <iframe
                title="Customer location"
                width="100%"
                height="100%"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://maps.google.com/maps?q=${order.location.lat},${order.location.lng}&z=15&output=embed`}
              />
            </div>
          )}
        </div>

        {/* ORDER ITEMS */}
        <div className="border rounded-xl p-5">
          <h2 className="font-semibold text-lg mb-5">Order Items</h2>

          {order.items?.length > 0 ? (
            <div className="space-y-4">
              {order.items.map((item: OrderItem, index: number) => (
                <div key={index} className="flex gap-4 border rounded-lg p-4">
                  {/* IMAGE */}
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />

                  {/* INFO */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">
                      {item.name || item.slug || "Unknown Product"}
                    </h3>

                    {item.category && (
                      <p className="text-sm text-gray-500">
                        Category: {item.category}
                      </p>
                    )}

                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>Quantity: {item.quantity || 1}</p>

                      {item.size && <p>Size: {item.size}</p>}

                      {item.color && <p>Color: {item.color}</p>}

                      {item.slug && <p>Slug: {item.slug}</p>}
                    </div>
                  </div>

                  {/* PRICE */}
                  <div className="text-right">
                    <p className="font-semibold text-lg">
                      ₦
                      {(
                        (item.price || 0) * (item.quantity || 1)
                      ).toLocaleString()}
                    </p>

                    <p className="text-sm text-gray-500">
                      ₦{(item.price || 0).toLocaleString()} each
                    </p>
                  </div>
                </div>
              ))}

              {/* TOTAL */}
              <div className="border-t pt-4 flex justify-between items-center text-lg font-bold">
                <span>Total</span>

                <span>
                  {order.currency || "₦"}
                  {Number(order.total || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No items found</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderDetails;