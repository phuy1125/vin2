'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@context/AuthContext";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getUserBadges, Badge as BadgeType } from '../../utils/userUtils';
import UltraBadge from '../../components/Badge/Badge'; // Import the Ultra Badge component

export default function UserProfile() {
  const { isLoggedIn, userName, userId, avatar, logout, updateUserName, updateAvatar } = useAuth();
  const router = useRouter();

  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [isLoadingBadges, setIsLoadingBadges] = useState<boolean>(false);
  const [badgeError, setBadgeError] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleAvatarClick = () => {
    if (userId) {
      router.push(`/user/${userId}`);
    }
  };

  // Load user data from localStorage if needed
  useEffect(() => {
    const storedUserName = localStorage.getItem('userName');
    const storedAvatar = localStorage.getItem('avatar');
  
    if (storedUserName && storedUserName !== userName) {
      updateUserName(storedUserName);
    }
  
    if (storedAvatar && storedAvatar !== avatar) {
      updateAvatar(storedAvatar);
    }
  }, [userName, avatar, updateUserName, updateAvatar]);

  // Fetch user badges
  useEffect(() => {
    async function fetchUserBadges() {
      if (!userId) return;
      
      setIsLoadingBadges(true);
      setBadgeError(null);
      
      try {
        console.log("Fetching badges for userId:", userId);
        const userBadges = await getUserBadges(userId);
        console.log("Received badges:", userBadges);
        setBadges(userBadges);
      } catch (error) {
        console.error("Error fetching badges:", error);
        setBadgeError("Không thể tải huy hiệu");
        setBadges([]);
      } finally {
        setIsLoadingBadges(false);
      }
    }

    if (userId) {
      fetchUserBadges();
    } else {
      setBadges([]);
    }
  }, [userId]);

  return (
    <div className="flex items-center gap-4">
      {isLoggedIn ? (
        <>
          <div className="flex items-center cursor-pointer group" onClick={handleAvatarClick}>
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300"></div>
              <Image
                src={avatar || "/img/avatar-default-svgrepo-com.svg"}
                alt="User Avatar"
                className="relative z-10 w-10 h-10 rounded-full transition-all duration-300 ease-in-out group-hover:scale-110 border-2 border-transparent group-hover:border-blue-400"
                width={40}
                height={40}
              />
            </div>
            <div className="ml-2">
              <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors duration-300">{userName}</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isLoadingBadges ? (
              <div className="flex items-center py-1 px-3 rounded-full bg-gray-200 animate-pulse">
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <div className="w-16 h-4 ml-2 bg-gray-300 rounded"></div>
              </div>
            ) : badgeError ? (
              <span className="text-sm text-red-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {badgeError}
              </span>
            ) : badges.length > 0 ? (
              badges.map((badge, index) => (
                <UltraBadge 
                  key={index}
                  type={badge.type}
                  label={badge.label}
                />
              ))
            ) : null}
          </div>

          <button
            onClick={handleLogout}
            className="text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-700 hover:to-indigo-600 px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-all duration-300 ml-4"
          >
            Đăng xuất
          </button>
        </>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/login')}
            className="bg-white text-white border-2 border-blue-800 rounded px-6 py-2 rounded-md relative overflow-hidden group hover:bg-gradient-to-r hover:from-blue-500 hover:via-indigo-400 hover:to-purple-500"
          >
            <span className="relative group-hover:text-white z-10 font-bold text-gray-800 transition-colors duration-300">
              Đăng nhập
            </span>
          </button>
          <button
            onClick={() => router.push('/register')}
            className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 text-white px-6 py-2 rounded-md relative overflow-hidden group shadow-md hover:shadow-lg"
          >
            <span className="absolute top-0 left-0 w-full h-full bg-white opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-0 transition duration-500"></span>
            <span className="relative z-10 font-bold text-white">
              Đăng ký
            </span>
          </button>
        </div>
      )}
    </div>
  );
}