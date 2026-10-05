export type GameInfo = {
  id: "circuit-break" | "nuts-and-bolts" | "flow-free" | "unblock-me" | "two-dots";
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: string;
  material: string;
  instructions: string;
};

export const games: GameInfo[] = [
  { id: "circuit-break", title: "Circuit Break", subtitle: "Power the board", description: "Turn the wire tiles until the battery's current reaches the lamp.", icon: "ϟ", accent: "#70d7d1", material: "circuit", instructions: "Tap a wire tile to rotate it. Carry power from the battery to the lamp." },
  { id: "nuts-and-bolts", title: "Nuts & Bolts", subtitle: "Sort the hardware", description: "Move the top nut from bolt to bolt until every stack is one color.", icon: "⚙", accent: "#e6a66f", material: "metal", instructions: "Select a bolt, then another. Move its top nut. Sort each color onto its own bolt." },
  { id: "flow-free", title: "Flow Free", subtitle: "Connect every pair", description: "Draw color paths between matching dots without crossing another path.", icon: "◉", accent: "#72a9f4", material: "glass", instructions: "Drag from either colored dot to its partner. Join every pair and fill every cell." },
  { id: "unblock-me", title: "Unblock Me", subtitle: "Clear the way", description: "Slide the wooden blocks and make a clear lane for the red block to escape.", icon: "▰", accent: "#e8c383", material: "wood", instructions: "Drag blocks only along their length. Move the red block through the open exit." },
  { id: "two-dots", title: "Two Dots", subtitle: "Make a connection", description: "Join neighboring dots. A closed loop clears every dot of that color.", icon: "●", accent: "#ec7fa1", material: "pastel", instructions: "Drag through touching dots of one color. Close a loop to clear all dots of that color." },
];
