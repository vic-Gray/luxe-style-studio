import { useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { Instagram } from "lucide-react";
import { toast } from "sonner";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  // Validate fields
  if (
    !formData.name.trim() ||
    !formData.email.trim() ||
    !formData.message.trim()
  ) {
    toast.error("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/contact`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }

    const data = await response.json();

    toast.success(data.message || "Message sent successfully!");

    // Reset form
    setFormData({
      name: "",
      email: "",
      message: "",
    });
  } catch (error: unknown) {
    console.error("Contact form error:", error);
    toast.error((error as Error).message || "Something went wrong");
  }


    // Build mailto link
    const mailtoLink = `mailto:victorygray59@gmail.com?subject=${encodeURIComponent(
      `New Message from ${formData.name}`,
    )}&body=${encodeURIComponent(
      `Hello Victory,

You have received a new message from your website contact form:

-----------------------------------

Name: ${formData.name}
Email: ${formData.email}

Message:
${formData.message}

-----------------------------------

Regards,
Website Contact Form`,
    )}`;

    // Open email client
    window.location.href = mailtoLink;

    toast.success("Opening your email app...");

    // Reset form
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="py-24 md:py-32 px-6 md:px-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="font-body text-xs tracking-[0.4em] uppercase text-muted-foreground mb-3">
            Get in Touch
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground">
            Contact
          </h2>
        </motion.div>

        {/* Contact Form */}
        <motion.form
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Name */}
          <div>
            <input
              type="text"
              placeholder="Name"
              maxLength={100}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-transparent border-b border-border py-3 font-body text-sm tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email"
              maxLength={255}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-transparent border-b border-border py-3 font-body text-sm tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          {/* Message */}
          <div>
            <textarea
              placeholder="Message"
              rows={4}
              maxLength={1000}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="w-full bg-transparent border-b border-border py-3 font-body text-sm tracking-wider text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full font-body text-xs tracking-[0.3em] uppercase px-10 py-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-300"
            >
              Send Message
            </button>
          </div>
        </motion.form>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-8 mt-14"
        >
          {/* Instagram */}
          <a
            href="https://www.instagram.com/matteekayofficial"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <Instagram size={16} />
            Instagram
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/1234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-body text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
            </svg>
            WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;
