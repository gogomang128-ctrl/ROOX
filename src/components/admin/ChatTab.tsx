"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/hooks";
import type { ChatMessage } from "@/lib/types";
import ChatBox from "../ChatBox";
import { useApp } from "../Providers";

export type Thread = { id: number; username: string; publicId: string; lastBody: string; lastAt: string; unread: number };

export default function ChatTab({
  threads,
  reloadThreads,
  selected,
  setSelected,
}: {
  threads: Thread[];
  reloadThreads: () => Promise<void>;
  selected: { id: number; username: string } | null;
  setSelected: (s: { id: number; username: string } | null) => void;
}) {
  const { toast } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function load() {
    if (!selected) return;
    const r = await api(`/api/admin/chat?userId=${selected.id}`);
    if (r.ok) {
      setMessages(r.data.messages);
      reloadThreads();
    }
  }
  usePoll(load, 3500, !!selected);

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-3 h-[72vh]">
      <div className={`rb-card overflow-y-auto ${selected ? "hidden md:block" : ""}`}>
        <div className="p-3 font-black border-b border-[#3b3e43]">المحادثات</div>
        {threads.length === 0 && <p className="p-4 text-sm text-zinc-500">لا توجد محادثات بعد. يمكنك بدء محادثة من تبويب العملاء (💬).</p>}
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setMessages([]);
              setSelected({ id: t.id, username: t.username });
            }}
            className={`w-full text-start p-3 border-b border-[#2d2f33] hover:bg-[#2d2f33] ${selected?.id === t.id ? "bg-[#2d2f33]" : ""}`}
          >
            <div className="flex items-center gap-2">
              <b className="flex-1 truncate">{t.username}</b>
              {t.unread > 0 && <span className="bg-red-500 text-xs font-black rounded-full px-2">{t.unread}</span>}
            </div>
            <div className="text-xs text-zinc-400 truncate">{t.lastBody}</div>
          </button>
        ))}
      </div>

      <div className={`rb-card overflow-hidden flex flex-col min-h-0 ${selected ? "" : "hidden md:flex"}`}>
        {selected ? (
          <>
            <div className="p-3 border-b border-[#3b3e43] flex items-center gap-2">
              <button className="md:hidden rb-btn rb-gray !py-0.5 !px-2 text-sm" onClick={() => setSelected(null)}>→</button>
              <b>💬 {selected.username}</b>
            </div>
            <div className="flex-1 min-h-0">
              <ChatBox
                me="admin"
                messages={messages}
                placeholder={`الرد على ${selected.username}...`}
                onSend={async (body) => {
                  const r = await api("/api/admin/chat", "POST", { userId: selected.id, body });
                  if (!r.ok) toast(r.data.error || "فشل الإرسال", "err");
                  await load();
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-zinc-500">اختر محادثة</div>
        )}
      </div>
    </div>
  );
}
