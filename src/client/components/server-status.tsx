import { useEffect, useState } from "react";

type Props = {};

export function ServerStatus({}: Props) {
  const [status, useStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => useStatus(data));
  }, []);

  return (
    <div>
      <h1>Server Status</h1>
      <p>{status}</p>
    </div>
  );
}
