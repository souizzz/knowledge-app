"use client";

import { useEffect, useState } from "react";
import { fetchKnowledge, Knowledge } from "../lib/api";
import SettingsMenu from "./settings-menu/SettingsMenu";
import Link from "next/link";

export default function Home() {
    return (
        <div style={{ padding: "2rem" }}>
            <h1 style={{ 
                fontSize: "2rem", 
                fontWeight: "700", 
                color: "#1f2937",
                marginBottom: "2rem"
            }}>
                Home
            </h1>
            <div style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: "1rem",
                maxWidth: "400px"
            }}>
                <Link 
                    href="/knowledge"
                    style={{
                        display: "block",
                        padding: "1rem 1.5rem",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "0.5rem",
                        fontWeight: "500",
                        fontSize: "1rem",
                        transition: "all 0.2s ease",
                        outline: "none",
                        userSelect: "none",
                        WebkitTapHighlightColor: "transparent",
                        textAlign: "center"
                    }}
                    onMouseOver={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "#2563eb";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "#3b82f6";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                    onTouchStart={(e: React.TouchEvent) => {
                        (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
                    }}
                    onTouchEnd={(e: React.TouchEvent) => {
                        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                    }}
                >
                    ナレッジ管理&登録
                </Link>
                <Link 
                    href={"/seles-metrics?v=v2.1.0&cb=" + Date.now()}
                    style={{
                        display: "block",
                        padding: "1rem 1.5rem",
                        backgroundColor: "#10b981",
                        color: "white",
                        textDecoration: "none",
                        borderRadius: "0.5rem",
                        fontWeight: "500",
                        fontSize: "1rem",
                        transition: "all 0.2s ease",
                        outline: "none",
                        userSelect: "none",
                        WebkitTapHighlightColor: "transparent",
                        textAlign: "center"
                    }}
                    onMouseOver={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "#059669";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e: React.MouseEvent) => {
                        (e.currentTarget as HTMLElement).style.backgroundColor = "#10b981";
                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                    onTouchStart={(e: React.TouchEvent) => {
                        (e.currentTarget as HTMLElement).style.transform = "scale(0.98)";
                    }}
                    onTouchEnd={(e: React.TouchEvent) => {
                        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                    }}
                >
                    営業数値管理
                </Link>
            </div>
        </div>
    )
}
  