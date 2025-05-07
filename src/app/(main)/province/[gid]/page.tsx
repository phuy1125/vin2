"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Culture {
  title: string;
  description: string;
}

interface Cuisine {
  title: string;
  description: string;
}

interface Province {
  _id: number;
  name: string;
  description: string;
  cuisine: Cuisine;
  culture: Culture;
}

interface Location {
  _id: string;
  name: string;
  description: string;
  image: string[];
  slug: string;
  provinceGid: number;
}

export default function ProvincePage() {
  const params = useParams();
  const [province, setProvince] = useState<Province | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProvinceData = async () => {
      try {
        const gid = params?.gid;
        if (!gid) return;

        const [provinceRes, locationsRes] = await Promise.all([
          fetch(`/api/province_ad/${gid}`),
          fetch(`/api/locations?provinceGid=${gid}`)
        ]);

        if (!provinceRes.ok || !locationsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const provinceData = await provinceRes.json();
        const locationsData = await locationsRes.json();

        setProvince(provinceData);
        setLocations(locationsData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Lỗi khi tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };

    fetchProvinceData();
  }, [params?.gid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-gray-700">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error || !province) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-red-500 mb-2">Đã xảy ra lỗi</h2>
          <p className="text-gray-600">{error || "Không tìm thấy thông tin tỉnh thành"}</p>
          <Link href="/" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Trở về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero section */}
      {/* Hero section with background image overlay */}
<div className="relative">
  {/* Background image with overlay */}
  <div className="absolute inset-0 bg-black/40 z-10"></div>
  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 z-20"></div>
  
  {/* Dynamic background - có thể thay thế bằng ảnh đại diện của tỉnh */}
  <div className="absolute inset-0 overflow-hidden">
    <Image 
      src="/img/Canhdep_Vietnam-1.jpg" 
      alt={`${province.name} background`}
      fill
      className="object-cover"
      priority
    />
  </div>
  
  {/* Content */}
  <div className="relative z-30 py-16 md:py-32">
    <div className="max-w-6xl mx-auto px-4">
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 text-white drop-shadow-lg">
          {province.name}
        </h1>
        <div className="w-24 h-1 bg-yellow-400 mb-6"></div>
        <p className="text-lg md:text-xl text-gray-100 leading-relaxed drop-shadow-md mb-8">
          {province.description}
        </p>
      </div>
    </div>
  </div>
</div>

      <div className="max-w-6xl mx-auto py-10 px-4">
        {/* Attractions section */}
        <div className="mb-16">
          <div className="flex items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Điểm đến nổi bật</h2>
            <div className="ml-4 flex-1 h-px bg-gray-300"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {locations.map((loc) => (
              <Link 
                href={`/attractions/${loc._id}`} 
                key={loc._id}
                className="group bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full"
              >
                <div className="relative w-full h-56 overflow-hidden">
                  <Image
                    src={loc.image?.[0] || "/img/VN.jpg"}
                    alt={loc.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-70"></div>
                  <h3 className="absolute bottom-3 left-4 right-4 text-white font-semibold text-lg drop-shadow-md">
                    {loc.name}
                  </h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-600 line-clamp-3">{loc.description}</p>
                  <div className="mt-4 text-blue-600 font-medium flex items-center group-hover:text-blue-700">
                    Xem chi tiết
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Culture and Cuisine sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <h2 className="text-2xl font-bold ml-3 text-gray-800">{province.culture.title}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{province.culture.description}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h2 className="text-2xl font-bold ml-3 text-gray-800">{province.cuisine.title}</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">{province.cuisine.description}</p>
          </div>
        </div>

        {/* Back to all provinces button */}
        <div className="text-center mt-8">
          <Link href="/" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Xem tất cả tỉnh thành
          </Link>
        </div>
      </div>
    </div>
  );
}