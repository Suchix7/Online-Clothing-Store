/* global axios */

// --- Helpers / state ---
const ChatState = {
  socket: null,
  adminId: "admin",
  users: [], // [{userId, name, lastMessage, unread, connected, lastTs }]
  conversations: {}, // { userId: [ {from, message, ts} ] }
  activeUserId: null,
  attachments: [],
};
// Track shown images to avoid duplicates when socket echoes back
const ShownImages = new Set(); // contains final image URLs
// Track pending bubbles so we can upgrade them after upload
const PendingBubbles = []; // array of { el, localUrl, ts }

function appendPendingImageBubble(type, localUrl, ts) {
  const el = document.createElement("div");
  el.className = "msg msg--" + (type === "out" ? "out" : "in") + " pending";
  el.innerHTML = `
    <img class="msg-img" src="${localUrl}" alt="image" />
    <div class="spinner-wrap"><div class="spinner"></div></div>
    <span class="msg-time">${new Date(ts || Date.now()).toLocaleString()}</span>
  `;
  document.getElementById("chatbot-messages").appendChild(el);
  scrollMessagesToEnd({ smooth: true });
  return el;
}

// Upgrade a pending bubble: swap src to final URL, remove spinner/state
function resolvePendingBubble(el, finalUrl) {
  if (!el) return;
  const img = el.querySelector(".msg-img");
  if (img) img.src = finalUrl;
  const spin = el.querySelector(".spinner-wrap");
  if (spin) spin.remove();
  el.classList.remove("pending", "error");
  ShownImages.add(finalUrl);
  scrollMessagesToEnd({ smooth: true });
}

// Mark pending bubble as error with retry
function failPendingBubble(el, onRetry) {
  if (!el) return;
  const spin = el.querySelector(".spinner-wrap");
  if (spin) spin.remove();
  el.classList.remove("pending");
  el.classList.add("error");
  if (!el.querySelector(".retry")) {
    const btn = document.createElement("button");
    btn.className = "retry";
    btn.textContent = "Retry";
    btn.onclick = (e) => {
      e.stopPropagation();
      onRetry?.();
    };
    el.appendChild(btn);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  ensureSocket();
  bootstrapConversations();
  setInitialMobileView(); // NEW
});

window.addEventListener("resize", setInitialMobileView); // NEW
function setSendDisabled(disabled) {
  const btn = document.getElementById("chatbot-send");
  if (!btn) return;
  btn.disabled = disabled;
  btn.style.opacity = disabled ? 0.6 : 1;
  btn.style.cursor = disabled ? "not-allowed" : "pointer";
}

const fileInput = document.getElementById("chatbot-file");
const attachBtn = document.getElementById("chatbot-attach");
const attachmentsRow = document.getElementById("chatbot-attachments");
const messagesBox = document.getElementById("chatbot-messages");

// open picker
attachBtn.addEventListener("click", () => fileInput.click());

// input change
fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
  fileInput.value = ""; // reset so selecting same file again works
});

// drag & drop
["dragenter", "dragover"].forEach((evt) =>
  messagesBox.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    messagesBox.classList.add("dragover");
  })
);
["dragleave", "drop"].forEach((evt) =>
  messagesBox.addEventListener(evt, (e) => {
    e.preventDefault();
    e.stopPropagation();
    messagesBox.classList.remove("dragover");
  })
);
messagesBox.addEventListener("drop", (e) => {
  const dt = e.dataTransfer;
  if (dt?.files?.length) handleFiles(dt.files);
});

function handleFiles(fileList) {
  const MAX = 10 * 1024 * 1024; // 10MB/client-side guard
  Array.from(fileList).forEach((file) => {
    if (!file.type.startsWith("image/")) return; // only images
    if (file.size > MAX) {
      // basic guard
      console.warn("File too large:", file.name);
      return;
    }
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(file);
    ChatState.attachments.push({ id, file, url });
  });
  renderAttachments();
}

function renderAttachments() {
  if (!ChatState.attachments.length) {
    attachmentsRow.style.display = "none";
    attachmentsRow.innerHTML = "";
    return;
  }
  attachmentsRow.style.display = "flex";
  attachmentsRow.innerHTML = "";
  ChatState.attachments.forEach((a) => {
    const wrap = document.createElement("div");
    wrap.className = "attach-thumb";
    wrap.innerHTML = `
      <img src="${a.url}" alt="attachment" />
      <button class="attach-remove" title="Remove" data-id="${a.id}">×</button>
    `;
    attachmentsRow.appendChild(wrap);
  });
  // remove listener
  attachmentsRow.querySelectorAll(".attach-remove").forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute("data-id");
      const idx = ChatState.attachments.findIndex((x) => x.id === id);
      if (idx >= 0) {
        URL.revokeObjectURL(ChatState.attachments[idx].url);
        ChatState.attachments.splice(idx, 1);
        renderAttachments();
      }
    };
  });
}

function clearAttachments() {
  ChatState.attachments.forEach((a) => URL.revokeObjectURL(a.url));
  ChatState.attachments = [];
  renderAttachments();
}

function appendImageBubble(type, src, ts) {
  if (src && ShownImages.has(src)) {
    // already shown via optimistic bubble
    return;
  }
  const el = document.createElement("div");
  el.className = "msg msg--" + (type === "out" ? "out" : "in");
  el.innerHTML = `
    <img class="msg-img" src="${src}" alt="image" />
    <span class="msg-time">${new Date(ts || Date.now()).toLocaleString()}</span>
  `;
  document.getElementById("chatbot-messages").appendChild(el);
  if (src) ShownImages.add(src);
}

// ===== REST bootstrap =====
async function bootstrapConversations() {
  try {
    const { data } = await axios.get("/api/chat/conversations", {
      withCredentials: true,
    });

    ChatState.users = mergeUsers(
      [],
      (data || []).map((c) => ({
        userId: c.userId,
        name: c.userName || c.userId,
        lastMessage: c.lastMessage || "",
        connected: false,
        unread: 0,
        lastTs: c.updatedAt ? new Date(c.updatedAt).getTime() : 0,
      }))
    );

    renderUsers();
  } catch (err) {
    console.error("Failed to load conversations:", err);
  }
}
// --- Mobile view helpers ---
const MOBILE_BREAKPOINT = 768;

function isMobile() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

// Set initial mobile view on load/resize
function setInitialMobileView() {
  if (!isMobile()) {
    document.body.classList.remove("users-view", "chat-view");
    return;
  }
  // Default to Users list first on mobile
  if (
    !document.body.classList.contains("users-view") &&
    !document.body.classList.contains("chat-view")
  ) {
    document.body.classList.add("users-view");
  }
}

function goToUsersSection() {
  if (!isMobile()) return;
  document.body.classList.remove("chat-view");
  document.body.classList.add("users-view");

  // optional smooth scroll to the users area
  const users = document.getElementById("chatbot-users");
  if (users && users.scrollIntoView) {
    users.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function goToChatSection() {
  if (!isMobile()) return;
  document.body.classList.remove("users-view");
  document.body.classList.add("chat-view");

  const chat = document.getElementById("chatbot-chat");
  if (chat && chat.scrollIntoView) {
    chat.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
const mobileUsersBtn = document.getElementById("mobile-users-btn");
if (mobileUsersBtn) {
  mobileUsersBtn.addEventListener("click", goToUsersSection);
}

// Load a user's last 50 messages via REST and seed ChatState.conversations[userId]
// Load a user's last 50 messages via REST and seed ChatState.conversations[userId]
async function loadMessages(userId, opts = {}) {
  const { before, limit = 50, appendToTop = false } = opts;
  try {
    const params = new URLSearchParams({ userId, limit });
    if (before) params.append("before", before);
    const { data } = await axios.get(
      `/api/chat/messages?${params.toString()}`,
      { withCredentials: true }
    );

    const mapped = (data || []).map((doc) => {
      const images = Array.isArray(doc.attachments)
        ? doc.attachments
            .filter((a) => a?.type === "image" && a?.url)
            .map((a) => a.url)
        : [];
      return {
        from: doc.sender?.role === "admin" ? ChatState.adminId : userId,
        message: doc.text || "", // 👈 no “[image]” fallback
        ts: doc.ts ? new Date(doc.ts).getTime() : Date.now(),
        images,
      };
    });

    if (!ChatState.conversations[userId]) ChatState.conversations[userId] = [];

    if (appendToTop) {
      ChatState.conversations[userId] = [
        ...mapped,
        ...ChatState.conversations[userId],
      ];
    } else {
      ChatState.conversations[userId] = mapped; // initial load
    }

    // bump list sort
    const newestTsInBatch = mapped.length
      ? mapped[mapped.length - 1].ts
      : undefined;
    if (newestTsInBatch) {
      upsertUser(userId, {
        lastTs: newestTsInBatch,
        lastMessage: mapped[mapped.length - 1].message || "", // 👈 only caption if present
        username:
          ChatState.users.find((u) => u.userId === userId)?.name || userId,
      });

      renderUsers();
    }
  } catch (err) {
    console.error("Failed to load messages:", err);
    if (!ChatState.conversations[userId]) ChatState.conversations[userId] = [];
  }
}

// ===== Socket setup (live updates only) =====
function ensureSocket() {
  if (ChatState.socket) return;
  const socket = io();

  socket.on("connect", () => {
    socket.emit("admin:subscribe"); // ✅ after connect
  });

  socket.on("admin:user-status", ({ userId, connected }) => {
    const u = ChatState.users.find((u) => u.userId === userId);
    if (u) {
      u.connected = connected;
      renderUsers();
      if (ChatState.activeUserId === userId) updateActivePresenceUI();
    }
  });

  socket.on("admin:user-list", (users) => {
    // users: [{ userId, name, connected: true }]
    ChatState.users = mergeUsers(
      ChatState.users,
      users.map((u) => ({
        userId: u.userId,
        name: u.name || u.userId,
        connected: !!u.connected,
        // keep existing lastTs/lastMessage sorting if present
        lastTs: ChatState.users.find((x) => x.userId === u.userId)?.lastTs || 0,
        lastMessage:
          ChatState.users.find((x) => x.userId === u.userId)?.lastMessage || "",
      }))
    );
    renderUsers();
    updateActivePresenceUI();
  });

  socket.on("user:subscribed", ({ userId }) => {
    // You can just mark presence or re-bootstrap; keeping re-bootstrap
    bootstrapConversations();
    const u = ChatState.users.find((u) => u.userId === userId);
    if (u) {
      u.connected = true;
      console.log(ChatState.users);
      renderUsers();
      if (ChatState.activeUserId === userId) updateActivePresenceUI();
    }
  });

  socket.on("user:disconnected", (userId) => {
    const u = ChatState.users.find((u) => u.userId === userId);
    if (u) {
      u.connected = false;
      renderUsers();
      if (ChatState.activeUserId === userId) updateActivePresenceUI();
    }
  });

  socket.on("new-message", (payload) => {
    const userId = payload.userId;
    const ts = payload.ts || Date.now();
    if (!userId) return;

    // Extract images
    const imagesFromAttachments = Array.isArray(payload.attachments)
      ? payload.attachments
          .filter((a) => a?.type === "image" && a?.url)
          .map((a) => a.url)
      : [];
    const images = payload.imageUrl
      ? [payload.imageUrl]
      : imagesFromAttachments;

    const caption = payload.message ?? payload.text ?? ""; // 👈 caption only

    upsertUser(userId, {
      name: payload.username || userId,
      lastMessage: caption || "", // 👈 no “[image]”
      lastTs: ts,
    });

    if (!ChatState.conversations[userId]) ChatState.conversations[userId] = [];
    const conv = ChatState.conversations[userId];

    if (
      conv.length &&
      conv[conv.length - 1].ts === ts &&
      conv[conv.length - 1].message === caption &&
      (!images.length ||
        JSON.stringify(conv[conv.length - 1].images || []) ===
          JSON.stringify(images))
    ) {
      return;
    }

    conv.push({
      from: payload.from,
      message: caption || "", // 👈 no placeholder
      ts,
      images,
    });

    const u = ChatState.users.find((u) => u.userId === userId);
    if (u) {
      u.lastMessage = caption || ""; // 👈 no placeholder
      if (ChatState.activeUserId !== userId) {
        u.unread = (u.unread || 0) + 1;
      }
    }

    renderUsers();
    if (ChatState.activeUserId === userId) {
      if (caption?.trim()) {
        appendMessageBubble(
          payload.from === ChatState.adminId ? "out" : "in",
          caption,
          ts
        );
      }
      images.forEach((src) => {
        appendImageBubble(
          payload.from === ChatState.adminId ? "out" : "in",
          src,
          ts
        );
      });
      scrollMessagesToEnd();
    }
  });

  ChatState.socket = socket;
}

// ===== User list helpers =====
function mergeUsers(current, incoming) {
  const map = new Map(current.map((u) => [u.userId, u]));

  incoming.forEach((nu) => {
    const old = map.get(nu.userId) || {};
    const name =
      nu.name ?? old.name ?? nu.username ?? old.username ?? nu.userId;
    map.set(nu.userId, {
      ...old,
      ...nu,
      name,
      connected: Boolean(nu.connected ?? old.connected),
      lastTs: Math.max(Number(nu.lastTs || 0), Number(old.lastTs || 0)), // ⭐ NEW
    });
  });

  // ⭐ NEW: sort by lastTs desc first (latest at the top), then unread desc, then connected, then name
  return Array.from(map.values()).sort((a, b) => {
    const at = a.lastTs || 0;
    const bt = b.lastTs || 0;
    if (at !== bt) return bt - at; // latest activity first
    const ua = a.unread || 0,
      ub = b.unread || 0;
    if (ua !== ub) return ub - ua; // then unread count
    if (a.connected !== b.connected) return b.connected - a.connected; // then presence
    return (a.name || "").localeCompare(b.name || "");
  });
}

function upsertUser(userId, patch = {}) {
  const idx = ChatState.users.findIndex((u) => u.userId === userId);
  if (idx >= 0) {
    const prev = ChatState.users[idx];
    ChatState.users[idx] = {
      ...prev,
      ...patch,
      name: patch.name ?? patch.username ?? prev.name ?? userId,
      connected: Boolean(patch.connected ?? prev.connected),
      unread:
        typeof patch.unread === "number" ? patch.unread : prev.unread ?? 0,
      lastMessage: patch.lastMessage ?? prev.lastMessage ?? "",
      lastTs: Math.max(Number(patch.lastTs || 0), Number(prev.lastTs || 0)), // ⭐ NEW
    };
  } else {
    ChatState.users.unshift({
      // ⭐ NEW: insert new users at the top immediately
      userId,
      name: patch.name ?? patch.username ?? userId,
      connected: Boolean(patch.connected),
      unread: typeof patch.unread === "number" ? patch.unread : 0,
      lastMessage: patch.lastMessage ?? "",
      lastTs: Number(patch.lastTs || 0), // ⭐ NEW
      ...patch,
    });
  }
}

// ===== Rendering =====
function renderUsers() {
  const ul = document.getElementById("chatbot-users-list");
  const query = (
    document.getElementById("chatbot-user-search").value || ""
  ).toLowerCase();

  // ⭐ Ensure array is sorted before rendering (in case only a single user changed)
  ChatState.users = mergeUsers([], ChatState.users);

  ul.innerHTML = "";
  ChatState.users
    .filter(
      (u) =>
        u.userId.toLowerCase().includes(query) ||
        (u.name || "").toLowerCase().includes(query)
    )
    .forEach((u) => {
      const li = document.createElement("li");
      li.className =
        "chatbot-user" + (ChatState.activeUserId === u.userId ? " active" : "");
      li.dataset.userId = u.userId;

      li.innerHTML = `
          <div class="chatbot-user__avatar">${(u.name || u.userId)
            .substring(0, 1)
            .toUpperCase()}</div>
          <div class="chatbot-user__meta">
            <div class="chatbot-user__name">${u.name || u.userId}</div>
            <div class="chatbot-user__line">${
              u.lastMessage ? u.lastMessage : u.connected ? "Online" : "Offline"
            }</div>
          </div>
          <div>${
            u.unread
              ? `<span class="chatbot-user__badge">${u.unread}</span>`
              : ""
          }</div>
        `;
      li.onclick = () => selectUser(u.userId);
      ul.appendChild(li);
    });
}

function updateActivePresenceUI() {
  const activeId = ChatState.activeUserId;
  if (!activeId) return;
  const u = ChatState.users.find((x) => x.userId === activeId);
  if (!u) return;
  document.getElementById("chatbot-active-status").innerText = u.connected
    ? "Online"
    : "Offline";
}

// Select / open a conversation
// Select / open a conversation
async function selectUser(userId) {
  ChatState.activeUserId = userId;
  const u = ChatState.users.find((x) => x.userId === userId);
  if (u) u.unread = 0;

  document.getElementById("chatbot-active-name").innerText = u?.name || userId;
  document.getElementById("chatbot-active-id").innerText = userId;
  document.getElementById("chatbot-active-status").innerText = u?.connected
    ? "Online"
    : "Offline";

  if (ChatState.socket) {
    ChatState.socket.emit("admin:open-user", { userId });
  }

  await loadMessages(userId, { limit: 50 });

  const box = document.getElementById("chatbot-messages");
  box.innerHTML = "";

  (ChatState.conversations[userId] || []).forEach((msg) => {
    // text bubble (if any)
    if (msg.message?.trim()) {
      appendMessageBubble(
        msg.from === ChatState.adminId ? "out" : "in",
        msg.message,
        msg.ts
      );
    }
    // image bubble(s) (if any)
    if (Array.isArray(msg.images) && msg.images.length) {
      msg.images.forEach((src) => {
        appendImageBubble(
          msg.from === ChatState.adminId ? "out" : "in",
          src,
          msg.ts
        );
      });
    }
  });

  renderUsers();
  goToChatSection(); // NEW: only affects mobile
  scrollMessagesToEnd();
  updateActivePresenceUI();
}

function appendMessageBubble(type, text, ts) {
  const el = document.createElement("div");
  el.className = "msg msg--" + (type === "out" ? "out" : "in");
  el.innerHTML = `${escapeHTML(text)}<span class="msg-time">${new Date(
    ts || Date.now()
  ).toLocaleString()}</span>`;
  document.getElementById("chatbot-messages").appendChild(el);
}

function scrollMessagesToEnd({ smooth = false } = {}) {
  const msgBox = document.getElementById("chatbot-messages");
  if (!msgBox) return;

  const go = () => {
    if (typeof msgBox.scrollTo === "function") {
      msgBox.scrollTo({
        top: msgBox.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    } else {
      msgBox.scrollTop = msgBox.scrollHeight;
    }
  };

  // run after layout/paint
  requestAnimationFrame(() => {
    go();
    // run again after microtasks (helps when images/fonts resize the box)
    setTimeout(go, 0);
  });
}

function escapeHTML(str) {
  return (str || "").replace(
    /[&<>"']/g,
    (s) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[
        s
      ])
  );
}

// Enter key
document.getElementById("chatbot-send").addEventListener("click", async () => {
  const input = document.getElementById("chatbot-input");
  const text = input.value.trim();
  const userId = ChatState.activeUserId;
  if ((!text && ChatState.attachments.length === 0) || !userId) return;

  // 1) send text (existing socket flow)
  if (text && ChatState.socket) {
    ChatState.socket.emit("admin-send-message", { userId, text });
    input.value = "";
  }

  // 2) show images instantly as outgoing bubbles (frontend-only)
  // 2) outgoing images with optimistic bubbles + loader
  if (ChatState.attachments.length) {
    const now = Date.now();
    setSendDisabled(true);

    // Create pending bubbles and remember them in send order
    const localPendings = ChatState.attachments.map((a) => {
      const el = appendPendingImageBubble("out", a.url, now);
      const rec = { el, localUrl: a.url, ts: now };
      PendingBubbles.push(rec);
      return rec;
    });

    // Build FormData
    const fd = new FormData();
    ChatState.attachments.forEach((a) => fd.append("files", a.file));
    fd.append("userId", ChatState.activeUserId);

    try {
      const { data } = await axios.post("/api/chat/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          // Optional: could map progress to a progress bar if you want
          // const pct = Math.round((evt.loaded / (evt.total || 1)) * 100);
        },
      });

      // data.images = [{ url, publicId, fieldname }]
      // Resolve pendings 1:1 in order (index match)
      (data.images || []).forEach((img, idx) => {
        const rec = localPendings[idx];
        if (rec) {
          resolvePendingBubble(rec.el, img.url);
        }
        // Emit socket so receivers get it too (your current behavior)
        ChatState.socket?.emit("admin-send-image", {
          userId: ChatState.activeUserId,
          imageUrl: img.url,
          caption: "", // optional
        });
      });

      // Clear local attachments row
      clearAttachments();
      scrollMessagesToEnd({ smooth: true });
    } catch (err) {
      console.error("Upload failed:", err);

      // Mark all created pending bubbles as failed with a retry that re-sends only failed ones
      localPendings.forEach((rec) => {
        failPendingBubble(rec.el, async () => {
          // Retry only this one file if you want (needs single-file upload endpoint),
          // or re-run the same multi-file flow. For simplicity, re-run full flow:
          document.getElementById("chatbot-send").click();
        });
      });
    } finally {
      // Re-enable send whether success or fail
      setSendDisabled(false);
    }
  }
});

// Search users
document
  .getElementById("chatbot-user-search")
  .addEventListener("input", renderUsers);
// ---------- Lightbox (Fullscreen Images) ----------
let LB = {
  overlay: null,
  img: null,
  closeBtn: null,
  prevBtn: null,
  nextBtn: null,
  imgs: [],
  index: 0,
  touch: { x0: 0, x1: 0 },
};

function ensureLightbox() {
  if (LB.overlay) return;
  const o = document.createElement("div");
  o.id = "chat-lightbox";
  o.innerHTML = `
    <button class="lb-close" aria-label="Close">&times;</button>
    <button class="lb-prev" aria-label="Previous">&#10094;</button>
    <img class="lb-img" alt="image" />
    <button class="lb-next" aria-label="Next">&#10095;</button>
  `;
  document.body.appendChild(o);

  LB.overlay = o;
  LB.img = o.querySelector(".lb-img");
  LB.closeBtn = o.querySelector(".lb-close");
  LB.prevBtn = o.querySelector(".lb-prev");
  LB.nextBtn = o.querySelector(".lb-next");

  // Close handlers
  const close = () => hideLightbox();
  LB.closeBtn.addEventListener("click", close);
  o.addEventListener("click", (e) => {
    // click outside the image closes
    if (e.target === o) close();
  });
  document.addEventListener("keydown", (e) => {
    if (!o.classList.contains("visible")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") showPrev();
    if (e.key === "ArrowRight") showNext();
  });

  // Nav handlers
  LB.prevBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showPrev();
  });
  LB.nextBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showNext();
  });

  // Swipe (mobile)
  o.addEventListener(
    "touchstart",
    (e) => {
      LB.touch.x0 = e.touches[0].clientX;
    },
    { passive: true }
  );
  o.addEventListener(
    "touchend",
    (e) => {
      LB.touch.x1 = e.changedTouches[0].clientX;
      const dx = LB.touch.x1 - LB.touch.x0;
      if (Math.abs(dx) > 40) {
        dx > 0 ? showPrev() : showNext();
      }
    },
    { passive: true }
  );
}

function openLightboxFrom(targetImg) {
  ensureLightbox();
  // Collect current image list in the messages box (only non-pending)
  const container = document.getElementById("chatbot-messages");
  LB.imgs = Array.from(container.querySelectorAll(".msg-img")).filter(
    (img) =>
      img.closest(".msg") && !img.closest(".msg").classList.contains("pending")
  );
  // Index of clicked one
  LB.index = Math.max(0, LB.imgs.indexOf(targetImg));
  updateLightboxImage();
  LB.overlay.classList.add("visible");
  document.body.classList.add("no-scroll");
}

function hideLightbox() {
  if (!LB.overlay) return;
  LB.overlay.classList.remove("visible");
  document.body.classList.remove("no-scroll");
}

function updateLightboxImage() {
  if (!LB.imgs.length) return;
  const src = LB.imgs[LB.index]?.src;
  if (!src) return;
  LB.img.src = src;
  // toggle nav visibility if single image
  const one = LB.imgs.length <= 1;
  LB.prevBtn.style.display = one ? "none" : "grid";
  LB.nextBtn.style.display = one ? "none" : "grid";
}

function showPrev() {
  if (!LB.imgs.length) return;
  LB.index = (LB.index - 1 + LB.imgs.length) % LB.imgs.length;
  updateLightboxImage();
}
function showNext() {
  if (!LB.imgs.length) return;
  LB.index = (LB.index + 1) % LB.imgs.length;
  updateLightboxImage();
}

// Delegate clicks on chat images (works for dynamically added ones)
messagesBox.addEventListener("click", (e) => {
  const img = e.target.closest(".msg-img");
  if (!img) return;
  // If still uploading (pending), ignore
  const msg = img.closest(".msg");
  if (msg && msg.classList.contains("pending")) return;
  openLightboxFrom(img);
});

(() => {
  const savedBtn = document.getElementById("chatbot-saved-btn");
  const panel = document.getElementById("chatbot-saved-panel");
  const list = document.getElementById("chatbot-saved-list");
  const closeBtn = document.getElementById("chatbot-saved-close");
  const inputEl = document.getElementById("chatbot-input");

  if (!savedBtn || !panel || !list || !closeBtn || !inputEl) return;

  // Your fixed replies
  const SAVED_REPLIES = [
    { title: "Welcome", reply: "Hi! 👋 How can I help you today?" },
    {
      title: "Order status",
      reply: "Could you share your order ID so I can check the status?",
    },
    { title: "Thanks", reply: "Thank you! We’ll get back to you shortly." },
    {
      title: "Shipping Info",
      reply: "Our standard shipping takes 3–5 business days.",
    },
    {
      title: "Discount",
      reply: "Use code OS10 at checkout for 10% off (limited time).",
    },
  ];

  let query = ""; // search text

  const searchEl = document.querySelector("#chatbot-saved-search");

  // Grab the header and inject a search input at the top
  const header = panel.querySelector(".chatbot-saved-panel__header");
  // Insert before the Close button

  function isOpen() {
    return !panel.classList.contains("hidden");
  }
  function openPanel() {
    renderList();
    panel.classList.remove("animateFadeInDown");
    panel.classList.remove("hidden");
    panel.classList.add("animateFadeInUp");
    savedBtn.setAttribute("aria-expanded", "true");
  }
  function closePanel() {
    panel.classList.remove("animateFadeInUp");
    panel.classList.add("animateFadeInDown");
    setTimeout(() => {
      panel.classList.add("hidden");
    }, 300);
    savedBtn.setAttribute("aria-expanded", "false");
  }
  function togglePanel() {
    isOpen() ? closePanel() : openPanel();
  }

  // Filter helper
  function getFiltered() {
    if (!query) return SAVED_REPLIES;
    const q = query.toLowerCase();
    return SAVED_REPLIES.filter(
      (it) =>
        (it.title || "").toLowerCase().includes(q) ||
        (it.reply || "").toLowerCase().includes(q)
    );
  }

  function renderList() {
    const data = getFiltered();
    list.innerHTML = "";
    if (!data.length) {
      const li = document.createElement("li");
      li.style.padding = "12px";
      li.textContent = "No matches.";
      list.appendChild(li);
      return;
    }
    data.forEach((item) => {
      const li = document.createElement("li");
      li.className = "chatbot-saved-item";
      li.setAttribute("role", "button");
      li.setAttribute("tabindex", "0");

      const title = document.createElement("div");
      title.className = "chatbot-saved-item__title";
      title.textContent = item.title;

      const quick = document.createElement("button");
      quick.type = "button";
      quick.title = "Insert into input";
      quick.style.border = "none";
      quick.style.background = "transparent";
      quick.style.cursor = "pointer";
      quick.innerHTML = `<i class="fa-solid fa-paper-plane"></i>`;

      const reply = document.createElement("div");
      reply.className = "chatbot-saved-item__reply";
      reply.textContent = item.reply;

      const insert = () => insertIntoInput(item.reply);

      li.addEventListener("click", insert);
      li.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          insert();
        }
      });
      quick.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        insert();
      });

      li.appendChild(title);
      li.appendChild(quick);
      li.appendChild(reply);
      list.appendChild(li);
    });
  }

  function insertIntoInput(text) {
    inputEl.value = text; // just insert (no auto-send) to push
    inputEl.focus();
    const len = inputEl.value.length;
    try {
      inputEl.setSelectionRange(len, len);
    } catch {}
    closePanel();
  }

  // Open/close
  savedBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    togglePanel();
  });
  closeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    closePanel();
  });

  // Outside click closes
  document.addEventListener("click", (e) => {
    if (!isOpen()) return;
    const inside = panel.contains(e.target) || savedBtn.contains(e.target);
    if (!inside) closePanel();
  });

  // ESC closes; ESC in search clears first
  document.addEventListener("keydown", (e) => {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      if (document.activeElement === searchEl && searchEl.value) {
        searchEl.value = "";
        query = "";
        renderList();
      } else {
        closePanel();
      }
    }
  });

  // Search behavior (debounced lightly)
  let t;
  searchEl.addEventListener("input", (e) => {
    const val = e.target.value || "";
    clearTimeout(t);
    t = setTimeout(() => {
      query = val.trim();
      renderList();
    }, 80);
  });
})();
