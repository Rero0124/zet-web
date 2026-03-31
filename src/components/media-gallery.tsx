"use client";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST || "http://localhost:3002";

export function MediaGallery({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  return (
    <div className={`grid gap-2 ${urls.length === 1 ? "grid-cols-1" : urls.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {urls.map((url, i) => {
        const fullUrl = url.startsWith("http") ? url : `${API_HOST}${url}`;
        const isVideo = /\.(mp4|mov|webm|avi)$/i.test(url);
        return isVideo ? (
          <video
            key={i}
            src={fullUrl}
            controls
            className="w-full rounded-lg max-h-80 object-cover"
          />
        ) : (
          <img
            key={i}
            src={fullUrl}
            alt=""
            className="w-full rounded-lg max-h-80 object-cover"
          />
        );
      })}
    </div>
  );
}
