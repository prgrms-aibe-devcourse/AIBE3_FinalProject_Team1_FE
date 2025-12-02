import { create } from "zustand";

import type { ChatRoomListDto } from "@/types/domain";

interface ChatState {
  rooms: ChatRoomListDto[];
  currentRoomId: number | null;
  setRooms: (rooms: ChatRoomListDto[]) => void;
  setCurrentRoomId: (roomId: number | null) => void;
  addRoom: (room: ChatRoomListDto) => void;
  updateRoom: (
    roomId: number,
    updater: (room: ChatRoomListDto) => ChatRoomListDto,
  ) => void;
  resetUnread: (roomId: number) => void;
  clearRooms: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  currentRoomId: null,

  setRooms: (rooms) =>
    set((state) => {
      // rooms가 실제로 변경되지 않았으면 상태 업데이트하지 않음
      if (
        state.rooms.length === rooms.length &&
        state.rooms.every(
          (room, index) =>
            room.id === rooms[index]?.id &&
            room.unreadCount === rooms[index]?.unreadCount &&
            room.lastMessageTime === rooms[index]?.lastMessageTime,
        )
      ) {
        return state; // 상태 변경 없음
      }

      // 기존 rooms의 실시간 업데이트 데이터 보존
      const updatedRooms = rooms.map((newRoom) => {
        const existingRoom = state.rooms.find((r) => r.id === newRoom.id);
        if (!existingRoom) return newRoom;

        // 현재 열려있는 채팅방이면 unreadCount는 무조건 0 유지
        if (state.currentRoomId === newRoom.id) {
          return {
            ...newRoom,
            unreadCount: 0,
            lastMessage:
              existingRoom.lastMessageTime &&
              newRoom.lastMessageTime &&
              new Date(existingRoom.lastMessageTime) >
                new Date(newRoom.lastMessageTime)
                ? existingRoom.lastMessage
                : newRoom.lastMessage,
            lastMessageTime:
              existingRoom.lastMessageTime &&
              newRoom.lastMessageTime &&
              new Date(existingRoom.lastMessageTime) >
                new Date(newRoom.lastMessageTime)
                ? existingRoom.lastMessageTime
                : newRoom.lastMessageTime,
          };
        }

        // 기존 방의 데이터가 더 최신이면 유지
        const shouldKeepExisting = {
          unreadCount:
            (existingRoom.unreadCount ?? 0) > (newRoom.unreadCount ?? 0),
          lastMessage:
            existingRoom.lastMessageTime &&
            newRoom.lastMessageTime &&
            new Date(existingRoom.lastMessageTime) >
              new Date(newRoom.lastMessageTime),
        };

        return {
          ...newRoom,
          // 더 큰 unreadCount 유지
          unreadCount: shouldKeepExisting.unreadCount
            ? existingRoom.unreadCount
            : newRoom.unreadCount,
          // 더 최신 lastMessage 유지
          lastMessage: shouldKeepExisting.lastMessage
            ? existingRoom.lastMessage
            : newRoom.lastMessage,
          lastMessageTime: shouldKeepExisting.lastMessage
            ? existingRoom.lastMessageTime
            : newRoom.lastMessageTime,
        };
      });
      return { rooms: updatedRooms };
    }),

  setCurrentRoomId: (roomId) => set({ currentRoomId: roomId }),

  addRoom: (room) =>
    set((state) => {
      if (state.rooms.some((r) => r.id === room.id)) return state;
      return { rooms: [room, ...state.rooms] };
    }),

  updateRoom: (roomId, updater) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? updater(room) : room,
      ),
    })),

  resetUnread: (roomId) =>
    set((state) => ({
      rooms: state.rooms.map((room) =>
        room.id === roomId ? { ...room, unreadCount: 0 } : room,
      ),
    })),

  clearRooms: () => set({ rooms: [] }),
}));
