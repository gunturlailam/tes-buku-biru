import { useQuery } from "@tanstack/react-query";
import { categoryAPI } from "@/lib/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: categoryAPI.getCategories,
    staleTime: 1000 * 60 * 10, // 10 minutes - categories don't change often
  });
}
