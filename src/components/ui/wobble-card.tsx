"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const WobbleCard = ({
  children,
  containerClassName,
  className,
}: {
  children: React.ReactNode;
  containerClassName?: string;
  className?: string;
}) => {
  return (
    <motion.div
      initial={{ rotate: 0 }}
      whileHover={{ rotate: 2 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 10,
      }}
      className={cn(
        "mx-auto w-full bg-white relative rounded-2xl overflow-hidden shadow-lg border border-gray-100",
        containerClassName
      )}
    >
      <div
        className={cn(
          "relative h-full [background-image:radial-gradient(88%_100%_at_top,rgba(255,153,0,0.1),rgba(59,130,246,0.1))] p-6",
          className
        )}
      >
        <div className="relative z-10">{children}</div>
        
        {/* Decorative floating orbs */}
        <div className="absolute top-4 right-4 w-8 h-8 bg-orange-400/20 rounded-full blur-sm" />
        <div className="absolute bottom-4 left-4 w-12 h-12 bg-blue-500/20 rounded-full blur-md" />
        <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-yellow-400/20 rounded-full blur-sm" />
      </div>
    </motion.div>
  );
};

export const WobbleCardContent = ({
  icon,
  title,
  description,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
};