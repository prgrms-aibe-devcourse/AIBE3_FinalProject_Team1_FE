/**
 * Modal 컴포넌트
 */
"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useUIStore } from "@/store/uiStore";

import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ModalProps {
  children: React.ReactNode;
  title?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  children,
  title,
  onClose,
  showCloseButton = true,
  size = "md",
}: ModalProps) {
  const { isModalOpen, closeModal } = useUIStore();

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
    closeModal();
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isModalOpen]);

  if (!isModalOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className={cn(
          "w-full rounded-lg bg-white shadow-lg",
          sizeClasses[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            {title && (
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

