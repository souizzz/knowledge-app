"use client";

import { useRouter } from "next/navigation";
import { deleteKnowledge } from "../../../../lib/api";

export default function KnowledgeDetail({ params }: { params: { id: string } }) {
  const router = useRouter();

  const handleDelete = async () => {
    await deleteKnowledge(Number(params.id));
    router.push("/");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>ナレッジ詳細 (ID: {params.id})</h1>
      <button onClick={handleDelete} style={{ color: "red" }}>
        削除
      </button>
    </div>
  );
}
