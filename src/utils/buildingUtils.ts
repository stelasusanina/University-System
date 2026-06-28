export function getBuildingNumberFromRoom(room: string): number | null {
  const digits = room.replace(/\D/g, "");
  if (digits.length === 5) {
    return parseInt(digits.substring(0, 2), 10);
  }

  if (digits.length === 4) {
    return parseInt(digits.charAt(0), 10);
  }

  return null;
}
