/**
 * Sidebar 컴포넌트
 */
"use client";

import { useEffect } from "react";

import { useUIStore } from "@/store/uiStore";

import { cn } from "@/lib/utils";

interface SidebarProps {
  children: React.ReactNode;
  position?: "left" | "right";
}

export function Sidebar({ children, position = "left" }: SidebarProps) {
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen]);

  if (!isSidebarOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={() => setSidebarOpen(false)}
      />
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-50 h-full w-80 bg-white shadow-lg transition-transform duration-300",
          position === "left" ? "left-0" : "right-0",
          isSidebarOpen ? "translate-x-0" : position === "left" ? "-translate-x-full" : "translate-x-full",
        )}
      >
        {children}
      </aside>
    </>
  );
}

