"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";

export default function ChatBox({
  messages,
  me,
  onSend,
  placeholder = "اكتب رسالتك...",
}: {
  messages: ChatMessage[];
  me: "user" | "admin";
  onSend: (body: string) => Promise<void>;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const lastId = messages.length ? messages[messages.length - 1].id : 0;

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [lastId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    await onSend(t);
    setText("");
    setBusy(false);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div ref={box} className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#101113] rounded-t-lg">
        {messages.length === 0 && (
          <p className="text-center text-zinc-500 text-sm pt-10">لا توجد رسائل بعد. ابدأ المحادثة 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                  mine ? "bg-[#335fff]" : "bg-[#2d2f33]"
                }`}
              >
                <div className="text-[10px] opacity-70 font-bold mb-0.5">
                  {m.sender === "admin" ? "👑 الإدارة" : "👤 العميل"}
                </div>
                {m.body}
                <div className="text-[10px] opacity-60 mt-1" dir="ltr">
                  {new Date(m.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="flex gap-2 p-2 bg-[#232527] rounded-b-lg">
        <input
          className="rb-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          maxLength={1000}
        />
        <button className="rb-btn rb-green" disabled={busy || !text.trim()}>
          إرسال
        </button>
      </form>
    </div>
  );
}
