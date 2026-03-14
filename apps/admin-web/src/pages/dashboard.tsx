import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPipelineStatus, pollPipeline } from "../lib/api";

export function Dashboard() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["pipeline-status"],
    queryFn: getPipelineStatus,
    refetchInterval: 30_000,
  });

  const pollMutation = useMutation({
    mutationFn: pollPipeline,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pipeline-status"] }),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Pipeline Dashboard</h1>
        <button
          type="button"
          onClick={() => pollMutation.mutate()}
          disabled={pollMutation.isPending}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {pollMutation.isPending ? "Polling..." : "Poll Now"}
        </button>
      </div>

      {pollMutation.isSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          Poll completed successfully.
        </div>
      )}
      {pollMutation.isError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Poll failed: {(pollMutation.error as Error).message}
        </div>
      )}

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {error && <p className="text-sm text-red-500">Error: {(error as Error).message}</p>}

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Processed" value={data.total} />
          <StatCard label="Events Created" value={data.success} color="green" />
          <StatCard label="Duplicates" value={data.duplicates} color="yellow" />
          <StatCard label="Skipped" value={data.skipped} color="gray" />
          <StatCard label="Errors" value={data.errors} color="red" />
        </div>
      )}

      {data?.last_poll && (
        <p className="mt-4 text-xs text-gray-400">
          Last poll: {new Date(data.last_poll).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "indigo",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-700",
    green: "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red: "bg-red-50 text-red-700",
    gray: "bg-gray-50 text-gray-700",
  };

  return (
    <div className={`rounded-xl p-4 ${colors[color] ?? colors.indigo}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium opacity-70 mt-1">{label}</p>
    </div>
  );
}
