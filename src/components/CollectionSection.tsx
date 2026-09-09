import { useEffect, useState } from "react";

import OutfitCard from "./OutfitCard";
import { fetchOutfits, Outfit } from "../data/outfits";


const CollectionSection = () => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOutfits = async () => {
      try {
        const data = await fetchOutfits(1, 20);
        setOutfits(data);
      } catch (err: unknown) {
        setError((err as Error).message || "Failed to fetch items.");
      } finally {
        setLoading(false);
      }
    };

    loadOutfits();
  }, []);

  if (loading) {
    return (
      <section className="py-16 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <p className="text-center text-muted-foreground">
          Loading outfits...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
        <p className="text-center text-red-500">{error}</p>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 lg:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {outfits.map((outfit, idx) => (
          <OutfitCard
            key={outfit.id}
            id={outfit.id}
            image={outfit.image}
            name={outfit.name}
            price={outfit.price}
            index={idx}
          />
        ))}
      </div>
    </section>
  );
};

export default CollectionSection;