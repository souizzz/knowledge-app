"use client";

import { useEffect, useState } from "react";
import { fetchKnowledge, Knowledge } from "../lib/api";
import SettingsMenu from "./settings-menu/SettingsMenu";
import Link from "next/link";

export default function Home() {
    return (
        <div>
            <h1>Home</h1>
            <Link href="/knowledge">ナレッジ管理&登録</Link>
            <Link href="/seles-metrics">営業数値管理</Link>
        </div>
    )
}
  