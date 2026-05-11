import { MediaCard } from "./MediaCard";
import type { UnifiedMedia } from "@/types/media";

interface Props {
  title: string;
  items: UnifiedMedia[];
}

export function Carousel({ title, items }: Props) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-base font-semibold mb-3 px-1">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide">
        {items.map((item) => (
          <MediaCard key={`${item.type}-${item.id}`} media={item} />
        ))}
      </div>
    </section>
  );
}
