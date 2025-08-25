"use client";

import { useState } from "react";
import { createKnowledge } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function NewKnowledge() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createKnowledge({ title, content, created_by: "user" });
    router.push("/");
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: "2rem" }}>
      <h1>ナレッジ追加</h1>
      <div>
        <label>タイトル</label>
        <input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label>内容</label>
        <textarea value={content} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)} required />
      </div>
      <button type="submit">保存</button>
    </form>
  );
}
