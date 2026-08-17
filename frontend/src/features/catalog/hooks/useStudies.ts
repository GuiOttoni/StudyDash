import { useEffect, useState } from "react";
import { getStudies } from "@/shared/lib/api-client";
import type { StudyDto } from "@/domain/types";

export function useStudies(section?: string): { studies: StudyDto[]; loading: boolean } {
  const [studies, setStudies] = useState<StudyDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getStudies(section).then((data) => {
      if (!cancelled) setStudies(data);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [section]);

  return { studies, loading };
}
