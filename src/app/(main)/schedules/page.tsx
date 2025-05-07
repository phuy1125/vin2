"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SchedulePage() {
  // Using the updated type structure
  type Schedule = {
    _id: string;
    destination?: string;
    duration?: string;
    startDate?: string;
    itinerary?: ItineraryDay[];
    user?: string;
  };
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(new Set());
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("Không tìm thấy userId trong localStorage");
        setLoading(false);
        return;
      }

      console.log("Fetching schedules with userId:", userId);
      const res = await fetch(`/api/schedules?userId=${userId}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API returned ${res.status}: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await res.json();
      console.log("API response data:", data);
      setSchedules(data);
    } catch (error) {
      console.error("Failed to load schedules", error);
      setError(`Lỗi: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const confirmDelete = (id: string) => {
    setShowConfirmation(id);
  };
  
  const cancelDelete = () => {
    setShowConfirmation(null);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleteLoading(id);
      const userId = localStorage.getItem("userId");
      
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Lỗi xóa lịch trình');
      }

      // Cập nhật state sau khi xóa thành công
      setSchedules((prev) => prev.filter((schedule) => schedule._id !== id));
      setShowConfirmation(null);
    } catch (error) {
      console.error("Failed to delete schedule", error);
      alert(`Lỗi khi xóa: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cost);
  };

  // Updated to handle the new activity structure
  const calculateTotalCost = (itinerary: ItineraryDay[] = []): number => {
    return itinerary.reduce((total, day) => {
      const morningCost = day.morning?.activities?.reduce((sum, act) => sum + (act.cost || 0), 0) || 0;
      const afternoonCost = day.afternoon?.activities?.reduce((sum, act) => sum + (act.cost || 0), 0) || 0;
      const eveningCost = day.evening?.activities?.reduce((sum, act) => sum + (act.cost || 0), 0) || 0;
      
      return total + morningCost + afternoonCost + eveningCost;
    }, 0);
  };

  // Helper function to calculate cost for a time period
  const calculatePeriodCost = (period?: ActivitiesGroup): number => {
    if (!period || !period.activities) return 0;
    return period.activities.reduce((sum, act) => sum + (act.cost || 0), 0);
  };

  // Helper function to get activity descriptions for a time period
  const getActivityDescription = (period?: ActivitiesGroup): string => {
    if (!period || !period.activities || period.activities.length === 0) {
      return "";
    }
    return period.activities.map(act => act.description).join(", ");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-800">Lịch trình của bạn</h1>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Có lỗi xảy ra: {error}</p>
        </div>
      ) : schedules.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v14" />
          </svg>
          <p className="text-xl text-gray-600">Bạn chưa có lịch trình nào.</p>
          <p className="mt-2 text-gray-500">Hãy tạo lịch trình đầu tiên của bạn!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {schedules.map((itinerary) => (
            <div key={itinerary._id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
              {/* Top Section - Always visible */}
              <div className="flex flex-col md:flex-row md:items-center">
                {/* Destination & Info */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white md:w-64 md:h-full flex flex-col justify-center">
                  <h2 className="text-xl font-bold mb-1">{itinerary.destination || "Chưa có điểm đến"}</h2>
                  <p className="text-blue-100 mb-2">{itinerary.duration || "Chưa có thời gian"}</p>
                  
                  <div className="flex items-center mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">
                      {itinerary.startDate ? formatDate(itinerary.startDate) : "Chưa có ngày bắt đầu"}
                    </span>
                  </div>
                </div>
                
                {/* Summary & Actions */}
                <div className="p-5 flex-grow flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-gray-700">
                      <span className="font-medium">
                        {itinerary.itinerary ? itinerary.itinerary.length : 0} ngày
                      </span>
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-gray-700">Tổng chi phí:</span>
                        <span className="font-bold text-blue-700">
                        {formatCost(calculateTotalCost(itinerary.itinerary || []))}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => toggleExpanded(itinerary._id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
                    >
                      {expanded.has(itinerary._id) ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Thu gọn
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Chi tiết
                        </>
                      )}
                    </button>
                    
                    <Link
                      href={`/schedules/${itinerary._id}`}
                      className="px-4 py-2 bg-green-50 text-green-600 rounded-md border border-green-200 hover:bg-green-100 transition-colors flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Sửa
                    </Link>
                    
                    <button
                      onClick={() => confirmDelete(itinerary._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-md border border-red-200 hover:bg-red-100 transition-colors flex items-center"
                      disabled={deleteLoading === itinerary._id}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Confirmation dialog */}
              {showConfirmation === itinerary._id && (
                <div className="p-4 bg-red-50 border-t border-red-100">
                  <p className="text-center font-medium text-red-700 mb-3">Bạn có chắc chắn muốn xóa lịch trình đến {itinerary.destination}?</p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => handleDelete(itinerary._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                      disabled={deleteLoading === itinerary._id}
                    >
                      {deleteLoading === itinerary._id ? 'Đang xóa...' : 'Xóa'}
                    </button>
                    <button
                      onClick={cancelDelete}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}

              {/* Expanded content - Updated to handle the new activity structure */}
              {expanded.has(itinerary._id) && (
                <div className="border-t border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-24">Ngày</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Sáng</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Chiều</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">Tối</th>
                          <th className="py-3 px-4 text-left font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 w-32">Chi phí</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {itinerary.itinerary?.map((day) => {
                          const morningCost = calculatePeriodCost(day.morning);
                          const afternoonCost = calculatePeriodCost(day.afternoon);
                          const eveningCost = calculatePeriodCost(day.evening);
                          const dayCost = morningCost + afternoonCost + eveningCost;
                          
                          return (
                            <tr key={day._id} className="hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {day.day}
                                  </div>
                                  <span className="ml-2 font-medium">Ngày {day.day}</span>
                                </div>
                              </td>
                              
                              <td className="py-3 px-4">
                                {day.morning && day.morning.activities && day.morning.activities.length > 0 ? (
                                  <div className="bg-blue-50 p-2 rounded-md">
                                    <p className="text-gray-700 text-sm">{getActivityDescription(day.morning)}</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                      {formatCost(morningCost)}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm italic">Không có hoạt động</span>
                                )}
                              </td>
                              
                              <td className="py-3 px-4">
                                {day.afternoon && day.afternoon.activities && day.afternoon.activities.length > 0 ? (
                                  <div className="bg-amber-50 p-2 rounded-md">
                                    <p className="text-gray-700 text-sm">{getActivityDescription(day.afternoon)}</p>
                                    <p className="text-gray-500 text-xs mt-1">{formatCost(afternoonCost)}</p>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm italic">Không có hoạt động</span>
                                )}
                              </td>
                              
                              <td className="py-3 px-4">
                                {day.evening && day.evening.activities && day.evening.activities.length > 0 ? (
                                  <div className="bg-indigo-50 p-2 rounded-md">
                                    <p className="text-gray-700 text-sm">{getActivityDescription(day.evening)}</p>
                                    <p className="text-gray-500 text-xs mt-1">{formatCost(eveningCost)}</p>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm italic">Không có hoạt động</span>
                                )}
                              </td>
                              
                              <td className="py-3 px-4 font-medium text-blue-700">
                                {formatCost(dayCost)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={4} className="py-3 px-4 text-right font-semibold text-gray-700">Tổng chi phí:</td>
                          <td className="py-3 px-4 font-bold text-blue-700">{formatCost(calculateTotalCost(itinerary.itinerary))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}