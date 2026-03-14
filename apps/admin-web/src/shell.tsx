import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { getStoredApiKey, setApiKey } from "./lib/api";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/events", label: "Events" },
  { to: "/configs", label: "Listservs" },
  { to: "/duplicates", label: "Dedup Log" },
];

export function Shell() {
  const [key, setKey] = useState(getStoredApiKey());
  const [input, setInput] = useState("");

  useEffect(() => {
    if (!key) return;
    setApiKey(key);
  }, [key]);

  if (!key) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
          <h1 className="text-lg font-bold text-gray-900 mb-4">Admin Panel</h1>
          <p className="text-sm text-gray-500 mb-4">Enter the admin API key to continue.</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setKey(input)}
            placeholder="API key"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            type="button"
            onClick={() => setKey(input)}
            className="mt-3 w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col p-4">
        <h1 className="text-base font-bold text-gray-900 mb-6">Pipeline Admin</h1>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setApiKey("");
              setKey("");
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
