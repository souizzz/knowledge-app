const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type Knowledge = {
  id: number;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
};

export async function fetchKnowledge(): Promise<Knowledge[]> {
  try {
    const res = await fetch(`${API_URL}/knowledge`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error('fetchKnowledge error:', error);
    return [];
  }
}

export async function createKnowledge(data: Omit<Knowledge, "id" | "created_at">) {
  const res = await fetch(`${API_URL}/knowledge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteKnowledge(id: number) {
  await fetch(`${API_URL}/knowledge/${id}`, { method: "DELETE" });
}


