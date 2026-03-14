import { useQuery } from "@tanstack/react-query";
import { getDuplicates } from "../lib/api";

export function DedupLog() {
  const { data: dupes, isLoading } = useQuery({
    queryKey: ["duplicates"],
    queryFn: () => getDuplicates(),
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-6">Dedup Log</h1>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-500 uppercase">
              <th className="px-4 py-3">Message ID</th>
              <th className="px-4 py-3">Listserv</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {dupes?.map((d) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-600 max-w-xs truncate">
                  {d.message_id}
                </td>
                <td className="px-4 py-3 text-gray-500">{d.listserv_label ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(d.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {dupes?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                  No duplicates logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
