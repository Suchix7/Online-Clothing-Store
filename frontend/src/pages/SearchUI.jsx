// components/SearchBox.jsx
import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axiosInstance.js";

export default function SearchBox({ onResults }) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const t = useRef();

  useEffect(() => {
    clearTimeout(t.current);
    if (!q) {
      setSuggestions([]);
      return;
    }
    t.current = setTimeout(async () => {
      const { data } = await axiosInstance.get(`/predict/suggest`, {
        params: { q },
      });
      setSuggestions(data.suggestions || []);
    }, 350);
  }, [q]);

  const search = async (query) => {
    const { data } = await axiosInstance.get(`/predict/search`, {
      params: { q: query, limit: 12 },
    });
    onResults?.(data);
  };

  return (
    <div className="relative">
      <input
        className="w-full border rounded p-2"
        placeholder="Search products or models…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") search(q);
        }}
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full mt-1 rounded shadow">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                setQ(s);
                setSuggestions([]);
                search(s);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
