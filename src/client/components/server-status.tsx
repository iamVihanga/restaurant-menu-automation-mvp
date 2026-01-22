import { useEffect, useState } from "react";

type Props = {};

export function ServerStatus({}: Props) {
  const [status, useStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => useStatus(data as string));
  }, []);

  return (
    <div className="flex items-center gap-2">
      <h1>Server Status</h1>
      <p className="font-semibold text-green-500">{status}</p>
    </div>
  );
}
