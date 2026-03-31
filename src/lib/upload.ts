const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

export async function uploadFiles(files: File[]): Promise<string[]> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("file", file);
  }

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || "업로드 실패");
  }

  const data = await res.json();
  return data.urls;
}
