import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";

const categories = ["cap", "shirts"];

interface Variant {
  _id?: string;
  color: string;
  size: string;
  stock: number;
  price: number;
}

const EditItem = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    color: "",
    size: "",
    stock: "",
  });

  const [variants, setVariants] = useState<Variant[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem("admin-token");

  /* FETCH ITEM */
  useEffect(() => {
    if (!token) {
      navigate("/admin/login", { replace: true });
      return;
    }

    const fetchItem = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/items/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch item");

        const data = await res.json();

        // Safely coerce every field to a clean string so inputs never show "true"/"false"
        const safeStr = (val: unknown): string => {
          if (val === null || val === undefined) return "";
          if (typeof val === "boolean") return "";
          return String(val);
        };

        setFormData({
          name: safeStr(data.name),
          description: safeStr(data.description),
          price: safeStr(data.price),
          category: safeStr(data.category),
          imageUrl: safeStr(data.imageUrl),
          color: safeStr(data.color),
          size: safeStr(data.size),
          stock: safeStr(data.stock),
        });

        setVariants(data.variants ?? []);
        setImagePreview(safeStr(data.imageUrl) || null);
      } catch (err) {
        console.error(err);
        alert("Failed to load item");
        navigate("/admin/items");
      } finally {
        setIsFetching(false);
      }
    };

    fetchItem();
  }, [id]);

  /* INPUT */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((p) => ({ ...p, category: value === "none" ? "" : value }));
  };

  /* IMAGE */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* VALIDATION */
  const validate = () => {
    if (!formData.name || !formData.description) return false;
    if (Number(formData.price) <= 0) return false;
    return true;
  };

  /* SUBMIT */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.imageUrl;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("image", imageFile);

        const uploadRes = await api.post(
          "/api/items/upload-image",
          uploadData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        finalImageUrl = uploadRes.data.url;
      }

      await api.patch(`/api/items/${id}`, {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        category: formData.category || null,
        imageUrl: finalImageUrl,
        color: formData.color || null,
        size: formData.size || null,
        stock: Number(formData.stock || 0),
      });

      setShowSuccess(true);

      setTimeout(() => navigate("/admin/items"), 1200);
    } catch (err: unknown) {
      console.error("Update failed:", (err as { response?: { data?: unknown } })?.response?.data);
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <AdminLayout>
        <p>Loading...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Edit Item</h1>

        {showSuccess && (
          <div className="p-3 bg-green-100 border rounded">
            Updated successfully
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Item name"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Item description"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="price">Price (₦)</Label>
            <Input
              id="price"
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="e.g. 15000"
            />
          </div>

          <div className="space-y-1">
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="color">Color <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="e.g. Black"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="size">Size <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="size"
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                placeholder="e.g. XL"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="e.g. 10"
              />
            </div>
          </div>

          {/* IMAGE */}
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-foreground transition-colors"
            >
              <Upload className="mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload image</p>
              <input hidden ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} />
            </div>
          </div>

          {imagePreview && (
            <div className="relative w-full max-w-xs">
              <img src={imagePreview} className="w-full h-48 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => { setImagePreview(null); setImageFile(null); }}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <Button disabled={isSubmitting} type="submit" className="w-full">
            {isSubmitting ? "Updating..." : "Update Item"}
          </Button>
        </form>
      </div>
    </AdminLayout>
  );
};

export default EditItem;