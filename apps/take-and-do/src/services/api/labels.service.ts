export const labelsService = {
  async getAll(): Promise<string[]> {
    const response = await fetch("/api/labels");
    if (!response.ok) {
      throw new Error("Failed to fetch labels");
    }
    return response.json();
  },

  async create(label: string): Promise<string> {
    const response = await fetch("/api/labels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ label }),
    });
    if (!response.ok) {
      throw new Error("Failed to create label");
    }
    const data = await response.json();
    return data.label;
  },
};

