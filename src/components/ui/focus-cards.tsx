"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
  }: {
    card: any;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "rounded-lg relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-orange-400/20 to-blue-500/20 opacity-0 transition-opacity duration-300",
          hovered === index && "opacity-100"
        )}
      />
      <div className="absolute inset-0 flex items-end py-8 px-4 transition-all duration-300">
        <div
          className={cn(
            "text-xl md:text-2xl font-medium bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-200 transition-all duration-300",
            hovered === index && "text-white"
          )}
        >
          {card.title}
        </div>
      </div>
      <div className="absolute inset-0 p-4 flex flex-col justify-center items-center">
        <div className={cn(
          "w-16 h-16 mb-4 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300",
          hovered === index && "bg-white/20 scale-110"
        )}>
          {card.icon}
        </div>
        <p className={cn(
          "text-sm text-gray-600 text-center opacity-0 transition-all duration-300 transform translate-y-4",
          hovered === index && "opacity-100 translate-y-0"
        )}>
          {card.description}
        </p>
      </div>
    </div>
  )
);

Card.displayName = "Card";

export function FocusCards({ cards }: { cards: any[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto md:px-8 w-full">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
}