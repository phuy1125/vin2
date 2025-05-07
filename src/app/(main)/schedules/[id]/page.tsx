"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

// StrictMode fix không cần thiết nữa vì chúng ta không dùng react-beautiful-dnd
const useStrictModeDndFix = () => {
  return true; // Luôn trả về true vì không cần fix cho react-beautiful-dnd nữa
};

export default function EditSchedulePage({ params }) {
  const router = useRouter();
  const { id } = params;
  const strictModeEnabled = useStrictModeDndFix();

  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // State để quản lý dropdown nào đang mở

  useEffect(() => {
    if (id) {
      fetchItinerary();
    }
  }, [id]);

  const fetchItinerary = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setError("Không tìm thấy userId trong localStorage");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/schedules/${id}?userId=${userId}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`API returned ${res.status}: ${errorData.error || 'Unknown error'}`);
      }
      
      const data = await res.json();
      // Đảm bảo mỗi day có một id duy nhất và ổn định
      if (data && data.itinerary) {
        data.itinerary = data.itinerary.map((day, index) => ({
          ...day,
          tempId: day._id || `day-${index}-${Date.now()}` // Tạo ID tạm thời nếu không có _id
        }));
      }
      
      // Chuyển đổi định dạng dữ liệu từ DB để phù hợp với giao diện
      if (data && data.itinerary) {
        data.itinerary = data.itinerary.map(day => {
          // Định dạng lại dữ liệu cho mỗi thời điểm trong ngày
          const formatTimeOfDay = (timeOfDay) => {
            if (!day[timeOfDay] || !day[timeOfDay].activities || day[timeOfDay].activities.length === 0) {
              return { activity: '', cost: 0 };
            }
            
            // Ghép các mô tả hoạt động thành một chuỗi và tính tổng chi phí
            const activity = day[timeOfDay].activities
              .map(act => act.description)
              .filter(desc => desc && desc.trim().length > 0)
              .join('\n');
              
            const cost = day[timeOfDay].activities.reduce((sum, act) => sum + (act.cost || 0), 0);
            
            return { activity, cost };
          };
          
          return {
            ...day,
            morning: formatTimeOfDay('morning'),
            afternoon: formatTimeOfDay('afternoon'),
            evening: formatTimeOfDay('evening')
          };
        });
      }
      
      setItinerary(data);
    } catch (error) {
      console.error("Failed to load itinerary", error);
      setError(`Lỗi: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý di chuyển ngày đến vị trí mới
  const moveDay = (fromIndex, toIndex) => {
    // Đóng dropdown sau khi di chuyển
    setOpenDropdown(null);
    
    // Nếu vị trí không thay đổi, không làm gì cả
    if (fromIndex === toIndex) return;
    
    // Tạo bản sao mới của mảng itinerary để tránh thay đổi trực tiếp state
    const items = Array.from(itinerary.itinerary);
    
    // Xóa phần tử được di chuyển khỏi vị trí cũ
    const [movedItem] = items.splice(fromIndex, 1);
    
    // Chèn phần tử vào vị trí mới
    items.splice(toIndex, 0, movedItem);

    // Cập nhật lại số thứ tự ngày
    const updatedItems = items.map((item, index) => ({
      ...item,
      day: index + 1
    }));

    // Cập nhật state với thứ tự mới
    setItinerary({
      ...itinerary,
      itinerary: updatedItems
    });
  };

  // Toggle dropdown
  const toggleDropdown = (index) => {
    if (openDropdown === index) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(index);
    }
  };

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kiểm tra nếu click không phải vào dropdown hoặc nút toggle
      if (openDropdown !== null && !event.target.closest('.dropdown-menu') && !event.target.closest('.dropdown-toggle')) {
        setOpenDropdown(null);
      }
    };
    
    // Thêm event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup event listener khi component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  const handleActivityChange = (dayIndex, timeOfDay, field, value) => {
    const updatedItinerary = { ...itinerary };
    
    // Ensure the activity object exists
    if (!updatedItinerary.itinerary[dayIndex][timeOfDay]) {
      updatedItinerary.itinerary[dayIndex][timeOfDay] = { activity: '', cost: 0 };
    }
    
    updatedItinerary.itinerary[dayIndex][timeOfDay][field] = field === 'cost' ? Number(value) : value;
    setItinerary(updatedItinerary);
  };

  const handleGeneralInfoChange = (field, value) => {
    setItinerary({
      ...itinerary,
      [field]: value
    });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const userId = localStorage.getItem("userId");
      if (!userId) {
        throw new Error("Không tìm thấy userId trong localStorage");
      }

      // Chuyển đổi dữ liệu về định dạng của database trước khi gửi
      const prepareItineraryForSave = itinerary.itinerary.map(day => {
        // Chuyển đổi định dạng dữ liệu cho mỗi thời điểm trong ngày
        const formatTimeOfDayForSave = (timeOfDay) => {
          if (!day[timeOfDay] || !day[timeOfDay].activity) {
            return { activities: [] };
          }
          
          // Tách nội dung hoạt động thành các hoạt động riêng biệt (dựa vào dấu xuống dòng)
          const activities = day[timeOfDay].activity
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(description => ({
              description,
              cost: 0 // Chi phí mặc định cho từng hoạt động
            }));
          
          // Nếu có ít nhất một hoạt động, đặt tổng chi phí cho hoạt động đầu tiên
          if (activities.length > 0) {
            activities[0].cost = day[timeOfDay].cost || 0;
          }
          
          return { activities };
        };
        
        // Loại bỏ tempId trước khi gửi lên server
        const { tempId, morning, afternoon, evening, ...restDay } = day;
        
        return {
          ...restDay,
          morning: formatTimeOfDayForSave('morning'),
          afternoon: formatTimeOfDayForSave('afternoon'),
          evening: formatTimeOfDayForSave('evening')
        };
      });

      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          updates: {
            destination: itinerary.destination,
            duration: itinerary.duration,
            startDate: itinerary.startDate,
            itinerary: prepareItineraryForSave
          }
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Lỗi cập nhật lịch trình');
      }

      // Navigate back to schedules page after successful save
      router.push('/schedules');
    } catch (error) {
      console.error("Failed to save changes", error);
      alert(`Lỗi khi lưu: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const formatCost = (cost) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cost);
  };

  const calculateTotalCost = () => {
    if (!itinerary || !itinerary.itinerary) return 0;
    
    return itinerary.itinerary.reduce((total, day) => {
      return total + 
        (day.morning?.cost || 0) + 
        (day.afternoon?.cost || 0) + 
        (day.evening?.cost || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Có lỗi xảy ra: {error}</p>
          <button 
            onClick={() => router.push('/schedules')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="bg-gray-50 border border-gray-200 p-8 rounded-lg text-center">
          <p className="text-xl text-gray-600">Không tìm thấy lịch trình.</p>
          <button 
            onClick={() => router.push('/schedules')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-800">Chỉnh sửa lịch trình</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push('/schedules')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={saveChanges}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* General Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Thông tin chung</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến</label>
            <input
              type="text"
              value={itinerary.destination || ''}
              onChange={(e) => handleGeneralInfoChange('destination', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian</label>
            <input
              type="text"
              value={itinerary.duration || ''}
              onChange={(e) => handleGeneralInfoChange('duration', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              readOnly
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
            <input
              type="date"
              value={itinerary.startDate ? new Date(itinerary.startDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleGeneralInfoChange('startDate', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <div className="bg-blue-50 p-3 rounded-md flex flex-col">
              <span className="text-sm text-gray-600">Tổng chi phí:</span>
              <span className="text-lg font-bold text-blue-700">{formatCost(calculateTotalCost())}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Itinerary Days */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Lịch trình theo ngày</h2>
        <p className="text-gray-500 mb-6 italic">Sử dụng menu di chuyển để thay đổi thứ tự các ngày.</p>
          
        <div className="space-y-6">
          {itinerary.itinerary.map((day, index) => (
            <div
              key={day.tempId}
              className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
            >
              {/* Day Header với dropdown menu */}
              <div className="bg-blue-500 text-white p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold mr-3">
                    {day.day}
                  </div>
                  <h3 className="text-lg font-medium">Ngày {day.day}</h3>
                </div>
                
                <div className="relative">
                  <button 
                    className="px-3 py-1 bg-blue-600 rounded flex items-center dropdown-toggle hover:bg-blue-700 transition-colors"
                    onClick={() => toggleDropdown(index)}
                  >
                    Di chuyển <span className="ml-1">{openDropdown === index ? '▲' : '▼'}</span>
                  </button>
                  
                  {openDropdown === index && (
                    <div className="absolute right-0 top-10 bg-white shadow-lg rounded-md border border-gray-200 w-48 z-10 dropdown-menu">
                      <div className="p-2 text-gray-700 text-sm border-b">Di chuyển đến vị trí:</div>
                      {itinerary.itinerary.map((_, targetIndex) => (
                        <button
                          key={targetIndex}
                          onClick={() => moveDay(index, targetIndex)}
                          disabled={index === targetIndex}
                          className="w-full text-left p-2 hover:bg-blue-50 disabled:text-gray-400 disabled:hover:bg-white"
                        >
                          {index === targetIndex ? (
                            <span className="flex items-center text-black">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Ngày {targetIndex + 1} (vị trí hiện tại)
                            </span>
                          ) : (
                            <span className="text-black">Ngày {targetIndex + 1}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Day Content */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Morning */}
                  <div className="bg-blue-50 p-4 rounded-md">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                      </svg>
                      Buổi sáng
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hoạt động</label>
                        <textarea
                          value={day.morning?.activity || ''}
                          onChange={(e) => handleActivityChange(index, 'morning', 'activity', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Chi phí (VND)</label>
                        <input
                          type="number"
                          value={day.morning?.cost || 0}
                          onChange={(e) => handleActivityChange(index, 'morning', 'cost', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Afternoon */}
                  <div className="bg-amber-50 p-4 rounded-md">
                    <h4 className="font-medium text-amber-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
                      </svg>
                      Buổi chiều
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hoạt động</label>
                        <textarea
                          value={day.afternoon?.activity || ''}
                          onChange={(e) => handleActivityChange(index, 'afternoon', 'activity', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Chi phí (VND)</label>
                        <input
                          type="number"
                          value={day.afternoon?.cost || 0}
                          onChange={(e) => handleActivityChange(index, 'afternoon', 'cost', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Evening */}
                  <div className="bg-indigo-50 p-4 rounded-md">
                    <h4 className="font-medium text-indigo-800 mb-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                      Buổi tối
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Hoạt động</label>
                        <textarea
                          value={day.evening?.activity || ''}
                          onChange={(e) => handleActivityChange(index, 'evening', 'activity', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Chi phí (VND)</label>
                        <input
                          type="number"
                          value={day.evening?.cost || 0}
                          onChange={(e) => handleActivityChange(index, 'evening', 'cost', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-8 flex justify-end space-x-3">
        <button
          onClick={() => router.push('/schedules')}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200 transition-colors"
        >
          Hủy
        </button>
        <button
          onClick={saveChanges}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
}