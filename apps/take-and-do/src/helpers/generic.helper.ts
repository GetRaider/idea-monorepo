export const genericHelper = {
  generateId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const randomNibble = (Math.random() * 16) | 0;
      const value = char === "x" ? randomNibble : (randomNibble & 0x3) | 0x8;
      return value.toString(16);
    });
  },
};
