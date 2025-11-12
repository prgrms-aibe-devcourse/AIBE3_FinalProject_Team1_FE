/**
 * 선택 상태 관리 스토어
 * 게시글, 예약 등의 선택된 항목을 관리
 */
import { create } from "zustand";

interface SelectionState {
  // 선택된 게시글 ID 목록
  selectedPostIds: number[];
  togglePostSelection: (postId: number) => void;
  setPostSelection: (postIds: number[]) => void;
  clearPostSelection: () => void;

  // 선택된 예약 ID 목록
  selectedReservationIds: number[];
  toggleReservationSelection: (reservationId: number) => void;
  setReservationSelection: (reservationIds: number[]) => void;
  clearReservationSelection: () => void;

  // 전체 선택 해제
  clearAll: () => void;
}

/**
 * 선택 상태 스토어
 */
export const useSelectionStore = create<SelectionState>((set) => ({
  // 게시글 선택
  selectedPostIds: [],
  togglePostSelection: (postId) =>
    set((state) => ({
      selectedPostIds: state.selectedPostIds.includes(postId)
        ? state.selectedPostIds.filter((id) => id !== postId)
        : [...state.selectedPostIds, postId],
    })),
  setPostSelection: (postIds) => set({ selectedPostIds: postIds }),
  clearPostSelection: () => set({ selectedPostIds: [] }),

  // 예약 선택
  selectedReservationIds: [],
  toggleReservationSelection: (reservationId) =>
    set((state) => ({
      selectedReservationIds: state.selectedReservationIds.includes(
        reservationId,
      )
        ? state.selectedReservationIds.filter((id) => id !== reservationId)
        : [...state.selectedReservationIds, reservationId],
    })),
  setReservationSelection: (reservationIds) =>
    set({ selectedReservationIds: reservationIds }),
  clearReservationSelection: () => set({ selectedReservationIds: [] }),

  // 전체 선택 해제
  clearAll: () =>
    set({
      selectedPostIds: [],
      selectedReservationIds: [],
    }),
}));
