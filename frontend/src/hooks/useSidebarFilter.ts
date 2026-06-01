import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function useSidebarFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentGrade = searchParams.get('grade') || '';
  const currentTopic = searchParams.get('topic') || '';
  const currentType = searchParams.get('type') || '';
  const currentDifficulty = searchParams.get('difficulty') || '';
  const currentDuration = searchParams.get('duration') || '';
  const currentExamType = searchParams.get('examType') || '';
  const currentRole = searchParams.get('role') || '';
  const searchQuery = searchParams.get('q') || '';
  
  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        const params = new URLSearchParams(searchParams.toString());
        if (localSearch) {
          params.set('q', localSearch);
        } else {
          params.delete('q');
        }
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, pathname, router, searchParams, searchQuery]);

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // If grade changes, reset topic
    if (key === 'grade' && params.get('grade') !== currentGrade) {
      params.delete('topic');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setLocalSearch('');
    router.push(pathname || '');
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearch(e.target.value);
  };

  return {
    currentGrade, currentTopic, currentType, currentDifficulty,
    currentDuration, currentExamType, currentRole, searchQuery,
    localSearch, setFilter, clearFilters, handleSearch
  };
}
