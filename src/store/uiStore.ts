/**
 * UI 상태 관리 스토어
 * 모달, 사이드바, 알림 등의 UI 상태를 관리
 */
import { create } from "zustand";

interface UIState {
  // 모달 상태
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;

  // 사이드바 상태
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // 알림 토스트
  toast: { message: string; type: "success" | "error" | "info" } | null;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;

  // 로딩 상태
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

/**
 * UI 스토어
 */
export const useUIStore = create<UIState>((set) => ({
  // 모달
  isModalOpen: false,
  modalContent: null,
  openModal: (content) =>
    set({
      isModalOpen: true,
      modalContent: content,
    }),
  closeModal: () =>
    set({
      isModalOpen: false,
      modalContent: null,
    }),

  // 사이드바
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),

  // 토스트
  toast: null,
  showToast: (message, type = "info") =>
    set({
      toast: { message, type },
    }),
  hideToast: () => set({ toast: null }),

  // 로딩
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));

