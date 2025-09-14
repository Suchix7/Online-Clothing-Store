import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Minus, Plus } from "lucide-react";
import logo from "../assets/logo1.png";
import socket from "../lib/socket.js";
import { useAuthStore } from "../store/useAuthStore.js";
import { axiosInstance } from "../lib/axiosInstance.js";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, role: "bot", text: "Hi! 👋 How can I help you today?" },
  ]);
  const [minimized, setMinimized] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const { authUser } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const hasSetUpListener = useRef(false);
  const firstMessage = useRef(false);

  // history helpers/state
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const oldestTsRef = useRef(null);

  // fixed panel height
  const PANEL_HEIGHT = 350;

  // image attachments
  const [attachments, setAttachments] = useState([]); // [{ id, file, url }]
  const fileInputRef = useRef(null);

  // fullscreen image viewer (lightbox)
  const [lightbox, setLightbox] = useState({ open: false, src: "" });

  const openPicker = () => fileInputRef.current?.click();

  function handleFiles(fileList) {
    const MAX = 10 * 1024 * 1024; // 10MB
    const next = [];
    Array.from(fileList).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      if (file.size > MAX) return;
      const id = crypto.randomUUID();
      const url = URL.createObjectURL(file);
      next.push({ id, file, url });
    });
    if (next.length) setAttachments((prev) => [...prev, ...next]);
  }

  function removeAttachment(id) {
    setAttachments((prev) => {
      const found = prev.find((x) => x.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return prev.filter((x) => x.id !== id);
    });
  }

  // Do not revoke here; blobs move into chat for optimistic bubbles.
  function clearAttachments() {
    setAttachments([]);
  }

  const isGuest = (id) => typeof id === "string" && id.startsWith("guest_");

  const toUserView = (m) => {
    const imgs = Array.isArray(m.attachments)
      ? m.attachments
          .filter((a) => a?.type === "image" && a?.url)
          .map((a) => a.url)
      : [];
    return {
      id: m._id || m.clientId || m.ts || crypto.randomUUID(),
      role: m.sender?.role === "admin" ? "bot" : "user",
      text: m.text || "",
      images: imgs,
      ts: m.ts ? new Date(m.ts).getTime() : Date.now(),
      status: m.status || "delivered",
    };
  };

  const WELCOME = {
    id: "welcome",
    role: "bot",
    text: "Hi! 👋 How can I help you today?",
  };

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen, minimized]);
  // Lock background page scroll on mobile while chat is open (and not minimized/lightbox)

  // Close chat on Escape, but NOT while lightbox is open
  useEffect(() => {
    function onKey(e) {
      if (lightbox.open) return; // ignore here, lightbox has its own handler
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox.open]);

  const [guestId] = useState(() => {
    const k = "yt_guest_id";
    let gid = localStorage.getItem(k);
    if (!gid) {
      gid = "guest_" + crypto.randomUUID();
      localStorage.setItem(k, gid);
    }
    return gid;
  });
  const effectiveUserId = authUser?._id || guestId;

  // identify/subscribe socket
  useEffect(() => {
    if (socket.disconnected) socket.connect();
    socket.emit("auth-ping", {
      userId: effectiveUserId,
      username: authUser?.fullName || "Guest",
    });
    socket.emit("user:subscribe", { userId: effectiveUserId });
  }, [effectiveUserId, authUser?.fullName]);

  // drag & drop to attachments
  useEffect(() => {
    const box = listRef.current;
    if (!box) return;

    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const onDrop = (e) => {
      stop(e);
      const files = e.dataTransfer?.files;
      if (files?.length) handleFiles(files);
    };

    box.addEventListener("dragenter", stop);
    box.addEventListener("dragover", stop);
    box.addEventListener("dragleave", stop);
    box.addEventListener("drop", onDrop);

    return () => {
      box.removeEventListener("dragenter", stop);
      box.removeEventListener("dragover", stop);
      box.removeEventListener("dragleave", stop);
      box.removeEventListener("drop", onDrop);
    };
  }, []);

  // ===== Helpers for optimistic image uploading =====
  function updateImageInMessage(setter, msgId, tempId, updater) {
    setter((prev) =>
      prev.map((m) => {
        if (m.id !== msgId) return m;
        const images = (m.images || []).map((img) => {
          const isTempMatch = typeof img === "object" && img?.tempId === tempId;
          return isTempMatch ? { ...img, ...updater(img) } : img;
        });
        return { ...m, images };
      })
    );
  }

  function revokeIfBlob(url) {
    if (url && typeof url === "string" && url.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }
  }

  // live messages
  useEffect(() => {
    const onNewMessage = (payload) => {
      if (payload.userId !== effectiveUserId) return;

      const incomingImgs = Array.isArray(payload.attachments)
        ? payload.attachments
            .filter((a) => a?.type === "image" && a?.url)
            .map((a) => a.url)
        : payload.imageUrl
        ? [payload.imageUrl]
        : [];

      // Avoid duplicating our own optimistic images when server echoes back
      setMessages((prev) => {
        if (incomingImgs.length) {
          const last = prev[prev.length - 1];
          if (last?.role === "user" && last?.images?.length) {
            const lastUrls = last.images.map((i) =>
              typeof i === "string" ? i : i.url
            );
            const allIncluded = incomingImgs.every((u) => lastUrls.includes(u));
            if (allIncluded) return prev;
          }
        }

        if (payload.imageUrl) {
          return [
            ...prev,
            {
              id: payload._id || payload.ts || Date.now(),
              role: payload.from === "admin" ? "bot" : "user",
              text: payload.message || "",
              images: [payload.imageUrl],
              ts: payload.ts || Date.now(),
            },
          ];
        }

        return [
          ...prev,
          {
            id: payload._id || payload.ts || Date.now(),
            role: payload.from === "admin" ? "bot" : "user",
            text: payload.message ?? payload.text ?? "",
            images: incomingImgs,
            ts: payload.ts || Date.now(),
          },
        ];
      });
    };

    if (!hasSetUpListener.current) {
      socket.on("new-message", onNewMessage);
      hasSetUpListener.current = true;
    }

    return () => {
      if (hasSetUpListener.current) {
        socket.off("new-message", onNewMessage);
        hasSetUpListener.current = false;
        setMessages([
          { id: 1, role: "bot", text: "Hi! 👋 How can I help you today?" },
        ]);
      }
    };
  }, [effectiveUserId]);

  // load history when panel opens (registered users only)
  useEffect(() => {
    if (!isOpen) return;

    if (isGuest(effectiveUserId)) {
      setMessages((cur) => (cur && cur.length ? cur : [WELCOME]));
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setIsLoadingHistory(true);
        const res = await axiosInstance.get(
          `/chat/messages?userId=${effectiveUserId}&limit=50`,
          {
            credentials: "include",
          }
        );
        const data = await res.data;
        if (cancelled) return;

        const mapped = (data || []).map(toUserView).sort((a, b) => a.ts - b.ts);
        oldestTsRef.current = mapped[0]?.ts || null;

        setMessages(mapped.length ? mapped : [WELCOME]);
      } catch (e) {
        console.error(e);
        setMessages((cur) => (cur && cur.length ? cur : [WELCOME]));
      } finally {
        if (!cancelled) setIsLoadingHistory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, effectiveUserId]);

  function toggleOpen() {
    setIsOpen((v) => !v);
    setMinimized(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  }

  // ===== Fullscreen image viewer handlers =====
  function openLightbox(url) {
    setLightbox({ open: true, src: url });
    try {
      document.body.style.overflow = "hidden";
    } catch {}
  }
  function closeLightbox() {
    setLightbox({ open: false, src: "" });
    try {
      document.body.style.overflow = "";
    } catch {}
  }
  useEffect(() => {
    const onEsc = (e) => {
      if (!lightbox.open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeLightbox();
      }
    };
    window.addEventListener("keydown", onEsc, true); // capture
    return () => window.removeEventListener("keydown", onEsc, true);
  }, [lightbox.open]);

  // ===== Core send with optimistic image bubbles + progress (95% cap) =====
  async function handleSend() {
    const text = input.trim();
    const hasImages = attachments.length > 0;
    if (!text && !hasImages) return;

    setIsSending(true);
    try {
      // 1) Send text (if any)
      if (text) {
        socket.emit("user-message", { userId: effectiveUserId, message: text });
        setInput("");
      }

      // 2) Images: optimistic render + per-file upload progress
      if (hasImages) {
        // Build one optimistic message containing all selected images
        const optimisticId = crypto.randomUUID();
        const optimisticImgs = attachments.map((a) => ({
          url: a.url, // local preview (blob)
          tempId: a.id,
          status: "uploading",
          progress: 0,
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: optimisticId,
            role: "user",
            text: "",
            images: optimisticImgs,
            ts: Date.now(),
            status: "sending",
          },
        ]);

        // Upload each image sequentially for easy per-file progress
        for (const a of attachments) {
          const fd = new FormData();
          fd.append("files", a.file);
          fd.append("userId", effectiveUserId);

          try {
            const res = await axiosInstance.post("/chat/upload", fd, {
              headers: { "Content-Type": "multipart/form-data" },
              withCredentials: true,
              onUploadProgress: (e) => {
                if (!e.total) return;
                const pctRaw = Math.round((e.loaded * 100) / e.total);
                // Cap UI at 95% during upload events; 100% only after server response.
                const pct = Math.min(95, pctRaw);
                updateImageInMessage(
                  setMessages,
                  optimisticId,
                  a.id,
                  (img) => ({
                    progress: Math.max(img.progress ?? 0, pct),
                  })
                );
              },
            });

            const uploaded = res?.data?.images?.[0];
            const finalUrl = uploaded?.url;

            // Now the server has responded — it's truly sent:
            // swap blob→server URL, mark done, set 100%
            updateImageInMessage(setMessages, optimisticId, a.id, (img) => {
              revokeIfBlob(img.url);
              return {
                status: "done",
                progress: 100,
                url: finalUrl || img.url,
                tempId: undefined,
              };
            });

            // Optional: notify via socket (no need to wait for ack to show 100%)
            if (finalUrl) {
              socket.emit("user-send-image", {
                userId: effectiveUserId,
                imageUrl: finalUrl,
                caption: "",
              });
            }
          } catch (err) {
            console.error("Upload failed for", a.file?.name, err);
            updateImageInMessage(setMessages, optimisticId, a.id, () => ({
              status: "error",
            }));
          }
        }

        // Clear the picker row (previews already in the chat bubble)
        clearAttachments();
      }

      // Optional one-time autoresponse (kept from your code)
      if (!firstMessage.current && text) {
        setTimeout(() => {
          if (messages.length < 3) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: "bot",
                text: "Thank you for reaching out! We'll get back to you shortly.",
                ts: Date.now(),
              },
            ]);
          }
        }, 3000);
        firstMessage.current = true;
      }
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSend();
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        aria-label="Open chat"
        onClick={toggleOpen}
        className="group relative flex items-center justify-center h-14 w-14 rounded-full shadow-xl transition-all duration-300 focus:outline-none focus-visible:ring-4 ring-offset-2 ring-gray-300 bg-white text-black border border-gray-300 cursor-pointer"
      >
        <MessageCircle className="h-6 w-6 transition-transform group-active:scale-95" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed bottom-20 right-5 w-[18rem] sm:w-[20rem] md:w-[22rem] flex flex-col overflow-hidden rounded-xl border border-gray-300 bg-white text-black shadow-2xl"
          >
            <div className="relative flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-300">
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  className="relative h-9 w-9 rounded-full bg-gray-200 shadow-inner"
                  alt="logo"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-black">
                      Chat with us
                    </h3>
                    <span
                      className="h-2 w-2 rounded-full bg-green-400"
                      title="Online"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Typically replies in a few minutes
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600"
                  onClick={() => setMinimized((v) => !v)}
                  aria-label={minimized ? "Restore" : "Minimize"}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!minimized && (
                <motion.div
                  key="chat-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: PANEL_HEIGHT, opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col overflow-hidden"
                >
                  {isLoadingHistory && (
                    <div className="px-4 py-1 text-xs text-gray-500">
                      Loading…
                    </div>
                  )}

                  <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto overscroll-contain touch-pan-y px-4 py-3 space-y-3 bg-white"
                    style={{ WebkitOverflowScrolling: "touch" }}
                    onWheel={(e) => e.stopPropagation()}
                    onTouchMove={(e) => e.stopPropagation()}
                    onDragEnter={(e) => e.preventDefault()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer?.files?.length)
                        handleFiles(e.dataTransfer.files);
                    }}
                  >
                    {messages.map((m) => (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        key={m.id}
                      >
                        <ChatBubble
                          role={m.role}
                          text={m.text}
                          images={m.images}
                          onImageClick={(url) => openLightbox(url)}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* attachments preview row */}
                  {attachments.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                      <div className="flex gap-2 overflow-x">
                        {attachments.map((a) => (
                          <div key={a.id} className="relative">
                            <img
                              src={a.url}
                              alt="attachment"
                              className="h-16 w-16 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => removeAttachment(a.id)}
                              className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white"
                              title="Remove"
                              aria-label="Remove attachment"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* input row */}
                  <div className="flex items-center gap-2 rounded-xl border leading-none border-gray-300 bg-white shadow-sm px-3 py-2  ">
                    <button
                      type="button"
                      onClick={openPicker}
                      className="shrink-0 flex items-center justify-center h-8 w-8 rounded-full border border-gray-300 font-bold"
                      aria-label="Attach images"
                      title="Attach images"
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      multiple
                      onChange={(e) => {
                        handleFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />

                    <div className="relative flex-1">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder=""
                        className="w-full resize-none bg-transparent outline-none text-sm text-black py-1"
                        aria-label="Message"
                      />
                      {!input && (
                        <span className="absolute inset-0 flex items-center text-gray-400 text-sm pointer-events-none leading-none">
                          Type your message…
                        </span>
                      )}
                    </div>

                    <button
                      onClick={handleSend}
                      className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white bg-black hover:opacity-90 disabled:opacity-50"
                      disabled={isSending}
                      aria-label="Send"
                    >
                      <Send className="h-4 w-4" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen image viewer (lightbox) */}
      {lightbox.open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 rounded-full bg-white/10 hover:bg-white/20 p-2 text-white"
            aria-label="Close image"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Image */}
          <img
            src={lightbox.src}
            alt="Full size"
            className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function ChatBubble({ role, text, images = [], onImageClick }) {
  const isUser = role === "user";
  const hasImages = Array.isArray(images) && images.length > 0;

  // normalize images to objects { url, status?, progress? }
  const normImages = hasImages
    ? images.map((img) => (typeof img === "string" ? { url: img } : img))
    : [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[100%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isUser
            ? "bg-black text-white rounded-br-sm"
            : "bg-gray-100 text-black border border-gray-300 rounded-bl-sm"
        }`}
      >
        {hasImages && (
          <div
            className="mb-1 grid gap-2"
            style={{
              gridTemplateColumns:
                normImages.length > 1 ? "repeat(2, minmax(0, 1fr))" : "1fr",
            }}
          >
            {normImages.map((img, idx) => {
              const uploading = img.status === "uploading";
              const failed = img.status === "error";
              const pct = typeof img.progress === "number" ? img.progress : 0;
              const url = img.url;

              return (
                <div key={idx} className="relative">
                  <button
                    type="button"
                    onClick={() => onImageClick?.(url)}
                    className="block focus:outline-none"
                    title="View image"
                  >
                    <img
                      src={url}
                      alt={`attachment-${idx}`}
                      className={`block w-full h-auto rounded-lg ${
                        failed ? "opacity-60" : ""
                      }`}
                      style={{ maxHeight: 220, objectFit: "cover" }}
                    />
                  </button>

                  {/* Uploading overlay */}
                  {uploading && (
                    <div className="absolute inset-0 rounded-lg bg-black/50 flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
                      <span className="text-xs text-white/90">{pct}%</span>
                    </div>
                  )}

                  {/* Error badge */}
                  {failed && (
                    <div className="absolute bottom-2 right-2 rounded bg-red-600 text-white text-[10px] px-1.5 py-0.5">
                      Upload failed
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {text?.trim() ? <div className="break-words">{text}</div> : null}
      </div>
    </div>
  );
}

function TypingIndicator({ show = true }) {
  if (!show) return null;
  return (
    <div className="flex items-center gap-2 text-gray-400 text-xs">
      <span className="relative inline-flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500" />
      </span>
      Typing…
    </div>
  );
}
