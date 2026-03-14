import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  type PipelineEvent,
  deletePipelineEvent,
  getPipelineEvents,
  updatePipelineEvent,
} from "../lib/api";

export function EventReview() {
  const queryClient = useQueryClient();
  const { data: events, isLoading } = useQuery({
    queryKey: ["pipeline-events"],
    queryFn: () => getPipelineEvents(),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePipelineEvent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline-events"] }),
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Pipeline Events</h1>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {events?.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                onDelete={() => {
                  if (confirm(`Delete "${event.title}"?`)) {
                    deleteMutation.mutate(event.id);
                  }
                }}
              />
            ))}
            {events?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No pipeline events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventRow({ event, onDelete }: { event: PipelineEvent; onDelete: () => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);

  const updateMutation = useMutation({
    mutationFn: (fields: Record<string, unknown>) => updatePipelineEvent(event.id, fields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-events"] });
      setEditing(false);
    },
  });

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50">
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateMutation.mutate({ title });
              if (e.key === "Escape") setEditing(false);
            }}
            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        ) : (
          <button
            type="button"
            className="cursor-pointer hover:text-indigo-600 text-left"
            onClick={() => setEditing(true)}
          >
            {event.title}
          </button>
        )}
      </td>
      <td className="px-4 py-3 text-gray-500">{new Date(event.datetime).toLocaleDateString()}</td>
      <td className="px-4 py-3 text-gray-500">{event.location_name ?? "—"}</td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        {new Date(event.created_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
