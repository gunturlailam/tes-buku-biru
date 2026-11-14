"use client";

import { useState, useMemo } from "react";
import { RecommendationCard } from "@/features/recommendations/components/RecommendationCard";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Alert } from "@/components/ui/Alert";
import { useQuery } from "@tanstack/react-query";
import { recommendationAPI } from "@/lib/api";
import { getDateRangeForPeriod, type PeriodType } from "@/lib/date-utils";
import type { Recommendation } from "@/types/financial";
import { Filter, Sparkles } from "lucide-react";

export default function RecommendationsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("MTD");
  const [filterPriority, setFilterPriority] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "reviewed"
  >("all");

  // Get date range based on selected period
  const dateRange = useMemo(() => getDateRangeForPeriod(selectedPeriod), [selectedPeriod]);

  // Fetch recommendations from API
  const { data: recommendationsData, isLoading, error } = useQuery({
    queryKey: ["recommendations", dateRange],
    queryFn: () => recommendationAPI.getRecommendations(dateRange),
  });

  const [localRecommendations, setLocalRecommendations] = useState<Recommendation[]>([]);

  // Update local state when API data changes
  useMemo(() => {
    if (recommendationsData?.recommendations) {
      setLocalRecommendations(recommendationsData.recommendations);
    }
  }, [recommendationsData]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">Memuat rekomendasi AI...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="error">
          Gagal memuat rekomendasi. Pastikan backend berjalan dan coba refresh halaman.
        </Alert>
      </div>
    );
  }

  // No data state
  if (!recommendationsData || localRecommendations.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Rekomendasi AI
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Saran berbasis analisis data keuangan Anda
          </p>
        </div>
        <Alert variant="warning">
          Tidak ada rekomendasi untuk periode ini. Sistem memerlukan lebih banyak data untuk menghasilkan rekomendasi.
        </Alert>
      </div>
    );
  }

  const handleMarkDone = (id: string) => {
    setLocalRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id ? { ...rec, status: "reviewed" as const } : rec,
      ),
    );
  };

  let filteredRecommendations = localRecommendations;

  if (filterPriority !== "all") {
    filteredRecommendations = filteredRecommendations.filter(
      (rec) => rec.priority === filterPriority,
    );
  }

  if (filterStatus !== "all") {
    filteredRecommendations = filteredRecommendations.filter(
      (rec) => rec.status === filterStatus,
    );
  }

  const highPriorityCount = localRecommendations.filter(
    (r) => r.priority === "high",
  ).length;
  const mediumPriorityCount = localRecommendations.filter(
    (r) => r.priority === "medium",
  ).length;
  const lowPriorityCount = localRecommendations.filter(
    (r) => r.priority === "low",
  ).length;
  const activeCount = localRecommendations.filter(
    (r) => r.status === "active",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Rekomendasi AI
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Saran berbasis analisis data keuangan Anda
        </p>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {activeCount} Rekomendasi Aktif
            </h3>
            <p className="text-sm text-white/90 leading-relaxed">
              Rekomendasi ini dihasilkan berdasarkan analisis pola keuangan
              usaha Anda. Setiap rekomendasi dilengkapi dengan evidence,
              assumptions, dan limitations untuk transparansi penuh.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-white/10">
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wider">
              Prioritas Tinggi
            </p>
            <p className="financial-number text-2xl font-bold mt-1">
              {highPriorityCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wider">
              Prioritas Sedang
            </p>
            <p className="financial-number text-2xl font-bold mt-1">
              {mediumPriorityCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/70 uppercase tracking-wider">
              Prioritas Rendah
            </p>
            <p className="financial-number text-2xl font-bold mt-1">
              {lowPriorityCount}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filter:</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterPriority === "all" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterPriority("all")}
          >
            Semua Prioritas
          </Button>
          <Button
            variant={filterPriority === "high" ? "danger" : "ghost"}
            size="sm"
            onClick={() => setFilterPriority("high")}
          >
            Tinggi ({highPriorityCount})
          </Button>
          <Button
            variant={filterPriority === "medium" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterPriority("medium")}
          >
            Sedang ({mediumPriorityCount})
          </Button>
          <Button
            variant={filterPriority === "low" ? "ghost" : "ghost"}
            size="sm"
            onClick={() => setFilterPriority("low")}
          >
            Rendah ({lowPriorityCount})
          </Button>
        </div>
        <div className="h-6 w-px bg-gray-200"></div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilterStatus("all")}
          >
            Semua Status
          </Button>
          <Button
            variant={filterStatus === "active" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilterStatus("active")}
          >
            Aktif ({activeCount})
          </Button>
          <Button
            variant={filterStatus === "reviewed" ? "ghost" : "ghost"}
            size="sm"
            onClick={() => setFilterStatus("reviewed")}
          >
            Selesai
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {filteredRecommendations.map((rec) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            onMarkDone={handleMarkDone}
          />
        ))}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/60 shadow-premium p-8 text-center hover:border-emerald-200 hover:shadow-md transition-all">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tidak Ada Rekomendasi
            </h3>
            <p className="text-sm text-gray-600">
              Tidak ada rekomendasi yang sesuai dengan filter yang dipilih.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
