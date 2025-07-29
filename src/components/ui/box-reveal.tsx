"use client"

import { motion, useAnimation, useInView } from "framer-motion"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface BoxRevealProps {
  children: React.ReactNode
  width?: "fit-content" | "100%"
  boxColor?: string
  duration?: number
  className?: string
}

export function BoxReveal({
  children,
  width = "fit-content",
  boxColor = "#5046e6",
  duration = 0.5,
  className,
}: BoxRevealProps) {
  const mainControls = useAnimation()
  const slideControls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      slideControls.start("visible")
      mainControls.start("visible")
    }
  }, [isInView, mainControls, slideControls])

  return (
    <div ref={ref} style={{ position: "relative", width, overflow: "hidden" }}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 75 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={mainControls}
        transition={{ duration: duration, delay: 0.25 }}
        className={cn(className)}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{
          hidden: { left: 0 },
          visible: { left: "100%" },
        }}
        initial="hidden"
        animate={slideControls}
        transition={{ duration: duration, ease: "easeIn" }}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 0,
          right: 0,
          background: boxColor,
          zIndex: 20,
        }}
      />
    </div>
  )
}