interface AvatarStackProps {
  users: { id: string; displayName: string; avatarUrl?: string | null }[];
  size?: number;
  max?: number;
}

// Generate a consistent color from a string
function colorFromString(str: string) {
  const colors = [
    "#22c55e",
    "#ef4444",
    "#3b82f6",
    "#06b6d4",
    "#f97316",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return colors[Math.abs(hash) % colors.length] ?? "#8b5cf6";
}

export function AvatarStack({ users, size = 30, max = 5 }: AvatarStackProps) {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex items-center">
      {visible.map((user, idx) => (
        <div
          key={user.id}
          className="rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white font-bold"
          style={{
            width: size,
            height: size,
            background: user.avatarUrl ? undefined : colorFromString(user.id),
            marginLeft: idx === 0 ? 0 : -(size * 0.33),
            position: "relative",
            zIndex: visible.length - idx,
            fontSize: size * 0.4,
          }}
        >
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            user.displayName[0]?.toUpperCase()
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="rounded-full border-2 border-white shadow-sm bg-gray-200 text-gray-600 flex items-center justify-center font-bold"
          style={{
            width: size,
            height: size,
            marginLeft: -(size * 0.33),
            position: "relative",
            zIndex: 0,
            fontSize: size * 0.35,
          }}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
