export async function api(path, method = "GET", body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error("Request failed");
  return res.status === 204 ? null : res.json();
}
