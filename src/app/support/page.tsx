"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/Providers";
import ChatBox from "@/components/ChatBox";
import { api } from "@/lib/api";
import { usePoll } from "@/lib/hooks";
import type { ChatMessage } from "@/lib/types";

export default function SupportPage() {
  const { user, toast } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  async function load() {
    const r = await api("/api/chat");
    if (r.ok) setMessages(r.data.messages);
  }
  usePoll(load, 4000, !!user);

  if (!user)
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-3">
        <div className="text-5xl">💬</div>
        <h1 className="text-2xl font-black">خدمة العملاء</h1>
        <p className="text-zinc-400">سجّل الدخول للتحدث مع الإدارة.</p>
        <Link href="/login?next=/support" className="rb-btn rb-blue">
          تسجيل الدخول
        </Link>
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto px-3 py-6">
      <h1 className="text-2xl font-black mb-1">💬 خدمة العملاء</h1>
      <p className="text-sm text-zinc-400 mb-3">محادثة مباشرة مع الإدارة — يتم حل جميع المشاكل من خلالها فقط.</p>
      <div className="rb-card overflow-hidden h-[65vh] md:h-[70vh]">
        <ChatBox
          me="user"
          messages={messages}
          onSend={async (body) => {
            const r = await api("/api/chat", "POST", { body });
            if (!r.ok) toast(r.data.error || "تعذر الإرسال", "err");
            await load();
          }}
        />
      </div>
    </div>
  );
}
