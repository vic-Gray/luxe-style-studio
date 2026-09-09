import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, MoreHorizontal, MapPin } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ---------------- ROUTE PROTECTION ---------------- */
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) navigate("/admin/login", { replace: true });
  }, [navigate]);

  return <>{children}</>;
};

/* ---------------- TYPES ---------------- */
interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
}

interface GeoLocation {
  lat: number;
  lng: number;
}

interface Order {
  _id: string;
  userId?: User;
  items: OrderItem[];
  total: number;
  status: string;
  fullName?: string;
  email?: string;
  phone?: string;
  shippingAddress: string;
  location?: GeoLocation | null;
  createdAt: string;
}

interface DisplayOrder {
  _id: string;
  userId?: User;
  items: OrderItem[];
  total: number;
  status: string;
  statusDisplay: string;
  fullName: string;
  email: string;
  phone: string;
  shippingAddress: string;
  location: GeoLocation | null;
  createdAt: string;
  date: string;
}

/* ---------------- HELPERS ---------------- */
const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "completed":
    case "delivered":
      return "bg-green-500/10 text-green-500";
    case "processing":
    case "shipped":
    case "paid":
      return "bg-blue-500/10 text-blue-500";
    case "pending":
      return "bg-yellow-500/10 text-yellow-500";
    case "cancelled":
      return "bg-red-500/10 text-red-500";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
};

const getNextStatus = (status: string): string | null => {
  const flow: Record<string, string> = {
    pending: "paid",
    paid: "shipped",
    shipped: "delivered",
  };
  return flow[status.toLowerCase()] || null;
};

/* ---------------- PAGE ---------------- */
const Orders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<DisplayOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const token = localStorage.getItem("admin-token");

  /* ---------------- FETCH ORDERS ---------------- */
  const fetchOrders = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      const mapped: DisplayOrder[] = (data.data || []).map((o: Order) => ({
        _id: o._id,
        userId: o.userId,
        items: o.items || [],
        total: o.total || 0,
        status: o.status,
        statusDisplay: o.status.charAt(0).toUpperCase() + o.status.slice(1),
        fullName: o.userId?.name || o.fullName || "Unknown",
        email: o.userId?.email || o.email || "N/A",
        phone: o.userId?.phone || o.phone || "N/A",
        shippingAddress: o.shippingAddress || "N/A",
        location: o.location ?? null,
        createdAt: o.createdAt,
        date: new Date(o.createdAt).toLocaleDateString(),
      }));

      setOrders(mapped);
    } catch (err) {
      console.error(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  /* ---------------- SEARCH ---------------- */
  useEffect(() => {
    const term = search.toLowerCase();

    setFilteredOrders(
      orders.filter(
        (o) =>
          o._id.toLowerCase().includes(term) ||
          o.fullName.toLowerCase().includes(term) ||
          o.email.toLowerCase().includes(term) ||
          o.shippingAddress.toLowerCase().includes(term),
      ),
    );
  }, [search, orders]);

  /* ---------------- NAVIGATE TO DETAILS PAGE ---------------- */
  const handleViewDetails = (order: DisplayOrder) => {
    navigate(`/admin/orders/${order._id}`);
  };

  /* ---------------- UPDATE STATUS ---------------- */
  const handleUpdateStatus = async (id: string, status: string) => {
    const next = getNextStatus(status);
    if (!next || !token) return;

    setActionLoading(id);

    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: next }),
        },
      );

      await fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------------- CANCEL ORDER ---------------- */
  const handleCancel = async (id: string) => {
    if (!token) return;

    setActionLoading(id);

    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/orders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel order");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="space-y-6">
          {/* HEADER */}
          <div className="flex justify-between items-center">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold"
            >
              Orders
            </motion.h2>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* SEARCH */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Search orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* TABLE */}
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>

            <CardContent>
              {loading ? (
                <p>Loading...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell>{order._id.slice(-8)}</TableCell>

                        <TableCell>
                          <div>
                            <p className="flex items-center gap-1">
                              {order.fullName}
                              {order.location && (
                                <MapPin
                                  size={12}
                                  className="text-green-600"
                                  aria-label="Location shared"
                                >
                                  <title>Location shared</title>
                                </MapPin>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.email}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>{order.date}</TableCell>

                        <TableCell>
                          <span
                            className={`px-2 py-1 text-xs rounded ${getStatusColor(
                              order.status,
                            )}`}
                          >
                            {order.statusDisplay}
                          </span>
                        </TableCell>

                        <TableCell>{order.items.length}</TableCell>

                        <TableCell className="font-medium">
                          ₦{Number(order.total || 0).toLocaleString("en-NG")}
                        </TableCell>

                        {/* ACTIONS */}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewDetails(order)}
                              >
                                View Full Page
                              </DropdownMenuItem>

                              {getNextStatus(order.status) && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUpdateStatus(order._id, order.status)
                                  }
                                >
                                  Mark as {getNextStatus(order.status)}
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => handleCancel(order._id)}
                              >
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Orders;