'use client';

import { ReactNode, useState, useEffect } from "react";
import "../globals.css";
import Link from "next/link";
import Image from "next/image";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import UserProfile from "@components/userprofile/UserProfile"; // Dùng useAuth từ context gốc đã bọc ở layout.tsx
import { usePathname } from 'next/navigation';

type Props = {
  children: ReactNode;
};

export default function MainLayout({ children }: Props) {
  const [active, setActive] = useState("home");
  const pathname = usePathname(); // Sử dụng usePathname thay vì useRouter
  
  // Sử dụng useEffect để cập nhật active state dựa trên pathname
  useEffect(() => {
    if (pathname === '/') {
      setActive('home');
    } else if (pathname === '/share-space') {
      setActive('share');
    } else if (pathname === '/aboutus') {
      setActive('about');
    }
  }, [pathname]);

  return (
    <>
      {/* Header */}
      <header>
   <nav className="w-full mx-auto relative z-10 flex items-center justify-between bg-white py-0 text-black border-b border-blue-600/20 shadow-lg shadow-blue-400/20">
     <div className="flex-shrink-0 px-4">
       <Link href="/">
         <Image
           src="/img/Logo_merus.png"
           alt="Logo"
           className="w-40 ml-15 h-auto cursor-pointer"
           width={160}
           height={30}
         />
       </Link>
     </div>
     <ul className="hidden text-lg md:flex w-1/2 items-center justify-between gap-4 py-2 cursor-pointer md:px-10 border-r-2 border-l-2 border-gray-800 dark:border-gray-300">
       <Link href="/" onClick={() => setActive("home")}>
         <li className={`relative px-2 py-1 transition-all duration-300 ${
           active === "home" 
             ? "text-blue-600 font-semibold" 
             : "hover:text-blue-600"
         }`}>
           Trang chủ
           <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform transition-transform duration-300 ${
             active === "home" 
               ? "scale-x-100" 
               : "scale-x-0 hover:scale-x-100"
           }`}></span>
         </li>
       </Link>
       
       <Link href="/share-space" onClick={() => setActive("share")}>
         <li className={`relative px-2 py-1 transition-all duration-300 ${
           active === "share" 
             ? "text-blue-600 font-semibold" 
             : "hover:text-blue-600"
         }`}>
           Không gian chia sẻ
           <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform transition-transform duration-300 ${
             active === "share" 
               ? "scale-x-100" 
               : "scale-x-0 hover:scale-x-100"
           }`}></span>
         </li>
       </Link>
       
       <Link href="/aboutus" onClick={() => setActive("about")}>
         <li className={`relative px-2 py-1 transition-all duration-300 ${
           active === "about" 
             ? "text-blue-600 font-semibold" 
             : "hover:text-blue-600"
         }`}>
           Về chúng tôi
           <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 transform transition-transform duration-300 ${
             active === "about" 
               ? "scale-x-100" 
               : "scale-x-0 hover:scale-x-100"
           }`}></span>
         </li>
       </Link>
     </ul>
     <div className="hidden md:flex justify-start pl-2 pr-10 py-1 gap-12">
       <UserProfile />
     </div>
   </nav>
 </header>
      
      {/* Main content */}
      <main>{children}</main>
      
      {/* Footer */}
{/* Footer */}
{/* Footer */}
<footer className="bg-gray-800 text-white py-8 border-t border-blue-600/20 shadow-[0_-4px_6px_rgba(96,165,250,0.2)] mt-2">
  <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      
      {/* Logo và mô tả */}
      <div className="col-span-2">
        <Image src="/img/Logo_merus.png" alt="Logo" className="w-40 h-auto" width={160} height={30} />
        <p className="text-sm text-gray-400 text-left mt-4">
          Website kết hợp du lịch, văn hóa và trí tuệ nhân tạo, mang đến trải nghiệm khám phá Việt Nam thông minh và cá nhân hóa.
        </p>

        {/* Social Icons */}
        <div className="flex space-x-4 mt-4">
          <a href="https://www.facebook.com/anvanket1402" className="text-white text-xl hover:text-blue-500 rounded-full p-2 bg-blue-600">
            <FaFacebookF />
          </a>
          <a href="https://www.instagram.com/vanket_1402/" className="text-white text-xl hover:text-pink-400 rounded-full p-2 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
            <FaInstagram />
          </a>
          <a href="#" className="text-white text-xl hover:text-blue-500 rounded-full p-2 bg-blue-600">
            <FaLinkedinIn />
          </a>
        </div>
      </div>

      {/* Thông tin liên hệ */}
      <div className="col-span-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
          <div>
            <ul className="space-y-2 text-sm">
              <li><p className="text-black text-base font-bold">Địa chỉ</p></li>
              <li><p className="text-gray-500">Hàn Thuyên, Thủ Đức, Hồ Chí Minh</p></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-2 text-sm">
              <li><p className="text-black text-base font-bold">Liên hệ</p></li>
              <li><p className="text-gray-500">+84 377 892 859</p></li>
              <li><p className="text-gray-500">22520595@gm.uit.edu.vn</p></li>
            </ul>
          </div>
          <div>
            <ul className="space-y-2 text-sm">
              <li><p className="text-black text-base font-bold">Thời gian</p></li>
              <li><p className="text-gray-500">Thứ hai - Thứ bảy</p></li>
              <li><p className="text-gray-500">9AM - 7PM</p></li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  </div>

  {/* Divider */}
  <hr className="h-px bg-gray-600 border-0 mx-auto w-[90%] mt-7" />

  {/* Bottom Footer */}
  <div className="bg-white-700 pt-4">
             <div className="max-w-7xl mx-auto grid grid-cols-2 gap-4 px-4 text-center">
               <div className="text-left flex items-center">
                 <p className="text-sm text-gray-500">&copy; 2025 VintelliTour. Tất cả quyền lợi được bảo vệ.</p>
               </div>

      {/* Công nghệ hỗ trợ */}
      <div className="flex justify-center items-center">
                <div className="flex items-center justify-center space-x-12">
                  <div className="flex items-center justify-center w-12 h-12">
                    <Image 
                      src="/img/brand-threejs.svg" 
                      alt="threejs" 
                      className="object-contain" 
                      width={48} 
                      height={48} 
                    />
                  </div>
                  <div className="flex items-center justify-center w-12 h-12">
                    <Image 
                      src="/img/Langchain--Streamline-Simple-Icons.svg" 
                      alt="langchain" 
                      className="object-contain" 
                      width={48} 
                      height={48} 
                    />
                  </div>
                  <div className="flex items-center justify-center w-12 h-12">
                    <Image 
                      src="/img/LangGraph_icon.png" 
                      alt="langgraph" 
                      className="object-contain" 
                      width={48} 
                      height={48} 
                    />
                  </div>
                  <div className="flex items-center justify-center w-8 h-8">
                    <Image 
                      src="/img/leaflet.svg" 
                      alt="leaflet" 
                      className="object-contain" 
                      width={32} 
                      height={32} 
                    />
                  </div>
                  <div className="flex items-center justify-center w-12 h-12">
                    <Image 
                      src="/img/mongodb-original-wordmark.svg" 
                      alt="mongodb" 
                      className="object-contain" 
                      width={48} 
                      height={48} 
                    />
                  </div>
                  <div className="flex items-center justify-center w-12 h-12">
                    <Image 
                      src="/img/nextjs.svg" 
                      alt="nextjs" 
                      className="object-contain" 
                      width={57} 
                      height={57} 
                    />
                  </div>
                  <div className="flex items-center justify-center w-32 h-12">
                    <Image 
                      src="/img/tailwind-css.svg" 
                      alt="tailwind" 
                      width={200} 
                      height={12} 
                    />
                  </div>
                </div>
              </div>
 
             </div>
           </div>
         </footer>


    </>
  );
}