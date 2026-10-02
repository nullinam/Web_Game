// Client-side room preview only. Replace this adapter with authenticated WebSocket room events.
const MAX_ROOMS = 5;
const ROOM_CAPACITY = 5;
let rooms = Array.from({ length: MAX_ROOMS }, (_, index) => ({ id: `room-${index + 1}`, gameId: null, number: index + 1, players: 0, state: "open" }));

export function listRooms() { return rooms.map((room) => ({ ...room })); }

export function joinRoom(gameId, preferredRoomId = null) {
  const candidates = rooms.filter((room) => (!room.gameId || room.gameId === gameId) && room.players < ROOM_CAPACITY && room.state === "open");
  const room = candidates.find((candidate) => candidate.id === preferredRoomId) || candidates[0];
  if (!room) return { ok: false, reason: "Every room is full right now. Try again in a moment." };
  room.gameId = gameId;
  room.players += 1;
  if (room.players === ROOM_CAPACITY) room.state = "full";
  return { ok: true, room: { ...room } };
}
