import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createConfig, deleteConfig, getConfigs, updateConfig } from "../lib/api";

export function ListservConfig() {
  const queryClient = useQueryClient();
  const { data: configs, isLoading } = useQuery({
    queryKey: ["configs"],
    queryFn: getConfigs,
  });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ address: "", label: "", gmail_label: "" });

  const createMutation = useMutation({
    mutationFn: createConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configs"] });
      setShowForm(false);
      setForm({ address: "", label: "", gmail_label: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteConfig,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["configs"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      updateConfig(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["configs"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Listserv Configs</h1>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "Cancel" : "Add Listserv"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Address (e.g. LIST@Princeton.EDU)"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              placeholder="Display label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              placeholder="Gmail label (optional)"
              value={form.gmail_label}
              onChange={(e) => setForm({ ...form, gmail_label: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <button
            type="button"
            onClick={() => createMutation.mutate(form)}
            disabled={!form.address || !form.label || createMutation.isPending}
            className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {createMutation.isPending ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Gmail Label</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs?.map((cfg) => (
              <tr key={cfg.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{cfg.label}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{cfg.address}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{cfg.gmail_label ?? "—"}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleMutation.mutate({ id: cfg.id, enabled: !cfg.enabled })}
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      cfg.enabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {cfg.enabled ? "Enabled" : "Disabled"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete "${cfg.label}"?`)) {
                        deleteMutation.mutate(cfg.id);
                      }
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {configs?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No listserv configs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
