import Image from "next/image";

interface MoviePosterProps {
  title: string;
  posterPath: string | null;
}

const IMAGE_BASE = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p";

export default function MoviePoster({ title, posterPath }: MoviePosterProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-72 w-48 overflow-hidden rounded-2xl border border-cinema-border shadow-2xl shadow-black/60 sm:h-80 sm:w-52">
        {posterPath ? (
          <Image
            src={`${IMAGE_BASE}/w342${posterPath}`}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 192px, 208px"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-cinema-surface text-cinema-muted text-4xl">
            🎬
          </div>
        )}
      </div>
      <h1 className="max-w-xs text-center text-2xl font-bold text-slate-100 sm:text-3xl">
        {title}
      </h1>
    </div>
  );
}
