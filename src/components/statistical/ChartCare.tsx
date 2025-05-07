"use client";

import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

// Register components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Province names (bạn có thể thêm nhiều nếu muốn)
const PROVINCE_NAMES: Record<number, string> = {
  24: "Hà Nội",
  58: "TP.HCM",
  56:"Thừa Thiên HuếHuế",
  21:"Gia Lai",
  16: "Đắk Lắk",
  44: "Phú Yên",
  48:"Quảng Ninh",
  17:"Đak Nông",
  45:"Quảng Bình",  
};

interface ProvinceEngagement {
  provinceGid: number;
  totalEngagement: number;
}

const ProvinceEngagementChart = () => {
  const [provinces, setProvinces] = useState<ProvinceEngagement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/province_ad/top");

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error("Error fetching province engagement data:", error);
        setError("Failed to load province engagement data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading province data...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center h-64 flex items-center justify-center">{error}</div>;
  }

  if (!provinces || provinces.length === 0) {
    return <div className="text-center h-64 flex items-center justify-center">No province engagement data available</div>;
  }

  const getProvinceName = (provinceGid: number) => {
    return PROVINCE_NAMES[provinceGid] || `Province ${provinceGid}`;
  };

  const chartData = {
    labels: provinces.map((province) => getProvinceName(province.provinceGid)),
    datasets: [
      {
        label: "Total Engagement (Likes + Comments)",
        data: provinces.map((province) => province.totalEngagement),
        backgroundColor: [
          "#4285F4", "#34A853", "#FBBC05", "#EA4335", "#8E24AA",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Top 5 Provinces by Engagement", font: { size: 16, weight: 700 } },
      tooltip: {
        callbacks: {
          label: (context: any) => `Engagement: ${context.raw.toLocaleString()}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Engagement Count'
        },
        ticks: {
          callback: (value: any) => value.toLocaleString()
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="w-full h-80 border border-gray-200 rounded-lg p-4 bg-white">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ProvinceEngagementChart;
