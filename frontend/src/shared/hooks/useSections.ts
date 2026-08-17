import { useEffect, useState } from "react";
import { getSections } from "@/shared/lib/api-client";
import type { SectionDto } from "@/domain/types";

export function useSections(): { sections: SectionDto[]; loading: boolean } {
  const [sections, setSections] = useState<SectionDto[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSections().then((data) => {
      if (!cancelled) setSections(data);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { sections, loading };
}
