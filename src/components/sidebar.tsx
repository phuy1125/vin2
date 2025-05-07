"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { MessageSquare, PenSquare, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";


type SidebarProps = {
  onNewThread: () => void;
  onSelectThread: (threadId: string) => void;
  selectedThreadId: string | null;
};

export type SidebarHandle = {
  reloadThreads: () => void;
};

const Sidebar = forwardRef<SidebarHandle, SidebarProps>(
  ({ onNewThread, onSelectThread, selectedThreadId }, ref) => {
    const [userName, setUserName] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [userID, setUserID] = useState<string | null>(null);
    const [chatCount, setChatCount] = useState<number>(0);
    const [threads, setThreads] = useState<any[]>([]);
    const [showDelete, setShowDelete] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);

    const reloadThreads = () => {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      fetch(`/api/chatbox/threads/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
        .then((res) => res.json())
        .then((data) => {
          setChatCount(data.length);
          const threadsWithMessages = data
            .filter((thread: any) => thread.values?.messages?.length > 0)
            .sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
            .map((thread: any) => ({
              id: thread.thread_id,
              name: thread.values.messages[0]?.content || "Cuộc trò chuyện mới",
              createdAt: thread.created_at,
            }));
          setThreads(threadsWithMessages);
        });
    };

    useImperativeHandle(ref, () => ({
      reloadThreads,
    }));

    useEffect(() => {
      const userId = localStorage.getItem("userId");
      if (userId) {
        fetch(`/api/users/${userId}/getUserInfo`)
          .then((res) => res.json())
          .then((data) => {
            setUserName(data.name);
            setUserEmail(data.email);
            setUserID(data.userID);
          });

        reloadThreads();
      }
    }, []);

    const handleDelete = (threadId: string) => {
      fetch(`http://localhost:2024/threads/${threadId}`, {
        method: "DELETE",
      })
        .then((res) => {
          if (res.ok) {
            setThreads((prevThreads) =>
              prevThreads.filter((thread) => thread.id !== threadId)
            );

            setChatCount((prevCount) => prevCount - 1);

            if (threadId === selectedThreadId) {
              onSelectThread(""); // Reset threadId trong ChatInterface
            }
          } else {
            console.error("Failed to delete thread");
          }
        })
        .catch((error) => {
          console.error("Error deleting thread:", error);
        })
        .finally(() => {
          setShowDelete(null);
          setMenuPosition(null);
        });
    };

    useEffect(() => {
      const handleClickOutside = () => {
        setShowDelete(null);
        setMenuPosition(null);
      };

      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    return (
      <div className="w-full h-full flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-4">
          <h3 className="text-xs uppercase tracking-wider text-gray-500 font-medium mb-3">
            Menu chính
          </h3>

          {/* Trò chuyện */}
          <div className="w-full flex items-center justify-between px-4 py-3 text-sm rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold shadow">
            <div className="flex items-center gap-3">
              <MessageSquare size={18} />
              <span>Trò chuyện</span>
              <span className="ml-2 text-xs bg-white text-teal-700 px-2 py-0.5 rounded-full font-semibold shadow-sm">
                {chatCount}
              </span>
            </div>
          </div>
        </div>

        {/* Danh sách trò chuyện */}
        <div className="px-3 overflow-y-auto max-h-[300px]">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Gần đây:</h4>
          <ul className="flex flex-col gap-1">
            {threads.map((thread, index) => {
              const isActive = thread.id === selectedThreadId;

              return (
                <li
                  key={index}
                  onClick={() => onSelectThread(thread.id)}
                  className={`px-3 py-2 rounded-md cursor-pointer transition-colors relative ${
                    isActive
                      ? "bg-teal-600 text-white font-semibold"
                      : "hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="truncate text-sm">{thread.name}</div>

                    <div className="relative z-10">
                      <button
                        className="p-1 rounded-full hover:bg-white/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();

                          if (showDelete === thread.id) {
                            setShowDelete(null);
                            setMenuPosition(null);
                          } else {
                            setShowDelete(thread.id);
                            setMenuPosition({
                              x: rect.right - 140,
                              y: rect.bottom + 8,
                            });
                          }
                        }}
                      >
                        <MoreHorizontal
                          size={16}
                          className={isActive ? "text-white" : "text-gray-600"}
                        />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`text-[11px] ${
                      isActive ? "text-white/80" : "text-gray-500"
                    }`}
                  >
                    {formatDistanceToNow(new Date(thread.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Nút tạo mới */}
        <div className="mt-auto px-4 py-4">
          <button
            onClick={onNewThread}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all hover:shadow-md hover:from-teal-700 hover:to-teal-600 mb-3"
          >
            <span>Cuộc trò chuyện mới</span>
          </button>
          <Link href="/schedules">
          <button className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
            <PenSquare size={18} />
            <span>Lịch trình của bạn</span>
          </button>
          </Link>
        </div>

        {/* Thông tin người dùng */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-all">
            <div className="w-12 h-10 bg-gradient-to-br from-teal-400 to-teal-500 rounded-full flex items-center justify-center text-lg font-semibold text-white shadow-md">
              {userName
                ? userName
                    .trim()
                    .split(" ")
                    .slice(-2)
                    .map((word) => word.charAt(0).toUpperCase())
                    .join("")
                : "NM"}
            </div>
            <div className="text-sm">
              <div className="font-medium text-gray-800">
                {userName || "Không rõ"}
              </div>
              <div className="text-gray-400 text-xs">{userEmail || ""}</div>
            </div>
          </div>
        </div>

        {/* Popup delete */}
        {showDelete && menuPosition && (
          <div
            className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg w-36"
            style={{ left: menuPosition.x, top: menuPosition.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={() => handleDelete(showDelete)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Xóa
            </button>
          </div>
        )}
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
