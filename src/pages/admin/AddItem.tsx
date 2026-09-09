import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, X } from "lucide-react";
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

const categories = ["Cap", "Shirt"];

const AddItem = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: null as string | null,
    size: "",
    color: "",
    stock: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value === "none" ? null : value }));
    if (errors.category) setErrors((prev) => ({ ...prev, category: "" }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Item name is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = "Price must be greater than 0";
    if (formData.stock === "" || Number(formData.stock) < 0)
      newErrors.stock = "Stock must be 0 or greater";
    if (!imageFile) newErrors.image = "Please upload an image";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("name", formData.name);
      formDataPayload.append("description", formData.description);
      formDataPayload.append("price", formData.price);
      if (formData.category) formDataPayload.append("category", formData.category);
      if (formData.size) formDataPayload.append("size", formData.size);
      if (formData.color) formDataPayload.append("color", formData.color);
      formDataPayload.append("stock", formData.stock || "0");
      formDataPayload.append("image", imageFile!);

      await api.post("/api/items", formDataPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowSuccess(true);
      setFormData({ name: "", description: "", price: "", category: null, size: "", color: "", stock: "" });
      removeImage();

      setTimeout(() => {
        setShowSuccess(false);
        navigate("/admin/items");
      }, 1500);
    } catch (err: unknown) {
      console.error("Failed to add item:", err);
      alert((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="font-brand text-2xl mb-2">Add New Item</h1>
        <p className="text-muted-foreground mb-6">Fill in item details below</p>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            ✓ Item added successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name */}
          <div className="space-y-1">
            <Label>Item Name</Label>
            <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Classic Cap" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe the item..." />
            {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
          </div>

          {/* Price + Category */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label>Price (₦)</Label>
              <Input type="number" name="price" value={formData.price} onChange={handleInputChange} placeholder="e.g. 15000" />
              {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
            </div>

            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={formData.category || "none"} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color + Size */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <Label>
                Color <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                placeholder="e.g. Black"
              />
            </div>

            <div className="space-y-1">
              <Label>
                Size <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                placeholder="e.g. XL"
              />
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-1">
            <Label>Stock Quantity</Label>
            <Input
              type="number"
              min="0"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              placeholder="e.g. 10"
            />
            {errors.stock && <p className="text-red-500 text-sm">{errors.stock}</p>}
          </div>

          {/* Image Upload */}
          <div className="space-y-1">
            <Label>Image</Label>
            {!imagePreview ? (
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageChange} />
              </div>
            ) : (
              <div className="relative">
                <img src={imagePreview} className="w-full h-48 object-cover rounded-xl" alt="Preview" />
                <Button type="button" size="icon" variant="secondary" className="absolute top-2 right-2" onClick={removeImage}>
                  <X />
                </Button>
              </div>
            )}
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="font-body uppercase tracking-[0.1em]">
              {isSubmitting ? "Adding..." : "Add Item"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/admin/items")} className="font-body uppercase tracking-[0.1em]">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default AddItem;