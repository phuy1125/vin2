"use client";

import {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import jwt from 'jsonwebtoken';

interface AuthContextType {
  isLoggedIn: boolean;
  userEmail: string | null;
  userName: string | null;
  userId: string | null;  // Lưu userId trong context
  avatar: string | null;  // Thêm avatar vào context
  login: (token: string) => Promise<void>;
  logout: () => void;
  updateUserName: (newUserName: string) => void;
  updateAvatar: (newAvatar: string) => void;  // Thêm hàm cập nhật avatar
  likedPosts: Record<string, boolean>; // thêm
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);  // Lưu userId trong state
  const [avatar, setAvatar] = useState<string | null>(null);  // Lưu avatar trong state
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // ✅ Hàm fetch liked posts chung
  const fetchLikedPosts = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/likes`);
      const data = await response.json();
      if (data.success && Array.isArray(data.likedPostIds)) {
        const likedPostsObj: Record<string, boolean> = {};
        data.likedPostIds.forEach((postId: string) => {
          likedPostsObj[postId] = true;
        });
        localStorage.setItem('likedPosts', JSON.stringify(likedPostsObj));
        console.log('✅ Lưu likedPosts thành công:', likedPostsObj);
      }
    } catch (error) {
      console.error('❌ Lỗi khi fetch liked posts:', error);
    }
  };

  // ✅ Khôi phục trạng thái khi load lại trang
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedUserId = localStorage.getItem('userId');
  
    if (token && storedUserId) {
      async function fetchUserInfo() {
        try {
          const decoded = jwt.decode(token!) as { name: string } | null;
          if (decoded) {
            const res = await fetch(`/api/users/${storedUserId}`);
            const data = await res.json();
  
            if (res.ok) {
              setIsLoggedIn(true);
              setUserName(data.username);
              setAvatar(data.avatar);
              setUserId(storedUserId);
              fetchLikedPosts(storedUserId!);
  
              localStorage.setItem('userName', data.username);
              localStorage.setItem('avatar', data.avatar || '');
            } else {
              console.error('Không lấy được user info:', data.message);
              logout();
            }
          } else {
            logout();
          }
        } catch (error) {
          console.error('Lỗi khi fetch user info:', error);
          logout();
        }
      }
  
      fetchUserInfo();
    }
  }, []);
  
  // ✅ Hàm login async + await fetch liked
  const login = async (token: string) => {
    localStorage.setItem('authToken', token);

    const decoded = jwt.decode(token) as { name: string; _id: string; avatar: string } | null;
    if (decoded && decoded.name && decoded._id) {
      setIsLoggedIn(true);
      setUserName(decoded.name);
      setUserId(decoded._id);  // Lưu userId vào state và localStorage
      localStorage.setItem('userId', decoded._id);

      // Lưu avatar vào state và localStorage
      setAvatar(decoded.avatar);
      localStorage.setItem('avatar', decoded.avatar);

      await fetchLikedPosts(decoded._id); // ⬅ fetch sau login
    }
  };

  const logout = async () => {
    try {
      // Gọi API logout để xóa cookie
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        // Cập nhật state
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('likedPosts');
        localStorage.removeItem('avatar'); // Xóa avatar khi logout
        setIsLoggedIn(false);
        setUserName(null);
        setUserId(null);
        setAvatar(null); // Xóa avatar khi logout
      } else {
        console.error('Đăng xuất thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    }
  };

  // Cập nhật tên người dùng
  const updateUserName = (newUserName: string) => {
    setUserName(newUserName);
    localStorage.setItem('userName', newUserName); // Cập nhật tên mới vào localStorage
  };

  // Cập nhật avatar
  const updateAvatar = (newAvatar: string | null) => {
    if (newAvatar) {
      // If avatar is a string (URL), store it directly
      setAvatar(newAvatar);
      localStorage.setItem('avatar', newAvatar); // Store the URL in localStorage
    } else {
      // If avatar is null, remove it from state and localStorage
      setAvatar(null);
      localStorage.removeItem('avatar'); // Remove avatar from localStorage
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        userEmail,
        userName,
        userId,
        avatar,
        login,
        logout,
        updateUserName,
        updateAvatar, // Thêm hàm updateAvatar vào context
        likedPosts, // thêm likedPosts ở đây
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
