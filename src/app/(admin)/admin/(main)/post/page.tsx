"use client";

import React, { useState, useEffect } from "react";
import { AiOutlineHeart, AiOutlineComment, AiFillHeart, AiOutlineDelete, AiOutlineFlag, AiFillFlag } from "react-icons/ai";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { MdHistory } from "react-icons/md";
import Image from "next/image";

interface Post {
  _id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  media: Array<{ media_type: string; media_url: string }>;
  status: string;
  likes: number;
  comments_count: number;
  timestamp: string;
  tags: string[];
  flagged?: boolean;
  flaggedReason?: string;
  flaggedAt?: string;
}

interface ValidationResult {
  postId: string;
  label: string;
  score: number;
  content: string;
}

const SpaceShare: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});
  const [viewMode, setViewMode] = useState<"normal" | "flagged" | "history">("normal");
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<Post[]>([]);
  const [flaggedHistory, setFlaggedHistory] = useState<Post[]>([]);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});
   const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        setError('Failed to load posts. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);


  const sortedPosts = [...posts].sort((a, b) => {
    if (sortOrder === 'newest') {
      // Newest first
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      // Oldest first
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
  });
  // Validate all posts for moderation
  const validateAllPosts = async () => {
    setIsValidating(true);
  
    try {
      // Lọc các bài viết không bị flagged (bài viết thường)
      const postsToValidate = posts.filter(post => post.status !== 'flagged');
  
      // Nếu không có bài viết nào cần kiểm duyệt, thoát sớm
      if (postsToValidate.length === 0) {
        setError('Không có bài viết thường nào để kiểm duyệt.');
        setIsValidating(false);
        return;
      }
  
      const res = await fetch('/api/posts/validate-all');
      const data = await res.json();
      
      if (data.success && data.invalidPosts) {
        setValidationResults(data.invalidPosts);
  
        // Đánh dấu các bài viết bị vi phạm là flagged
        const flaggedPostIds = data.invalidPosts.map((result: ValidationResult) => result.postId);
  
        const newFlaggedPosts = posts.filter(post =>
          flaggedPostIds.includes(post._id) && post.status !== 'flagged'
        ).map(post => ({
          ...post,
          status: 'flagged',
          flaggedReason: data.invalidPosts.find((r: ValidationResult) => r.postId === post._id)?.label || "Inappropriate content",
          flaggedAt: new Date().toISOString()
        }));
  
        setPosts(posts.map(post => {
          if (flaggedPostIds.includes(post._id) && post.status !== 'flagged') {
            return {
              ...post,
              status: 'flagged',
              flaggedReason: data.invalidPosts.find((r: ValidationResult) => r.postId === post._id)?.label || "Inappropriate content",
              flaggedAt: new Date().toISOString()
            };
          }
          return post;
        }));
  
        setFlaggedPosts(newFlaggedPosts);
        setViewMode("flagged");
      }
    } catch (error) {
      setError('Failed to validate posts. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };
  
  // Approve a flagged post (remove flag)
  const approvePost = async (postId: string) => {
    // Tìm bài viết trong state
    const post = posts.find(post => post._id === postId);
    
    if (post) {
      try {
        // Cập nhật trạng thái bài viết thành 'active' trong cơ sở dữ liệu
        const res = await fetch(`/api/posts?postId=${postId}`, {
          method: 'PATCH', 
          body: JSON.stringify({ status: 'active' }),
          headers: {
            'Content-Type': 'application/json',
          },
        });
  
        if (!res.ok) {
          throw new Error('Failed to approve post');
        }
  
        // Cập nhật bài viết trong state sau khi đã được duyệt
        // Thay flaggedReason: null thành flaggedReason: undefined
        setPosts(posts.map(p => p._id === postId ? { ...p, status: 'active', flagged: false, flaggedReason: undefined } : p));
  
        // Xóa bài viết khỏi danh sách flaggedPosts
        setFlaggedPosts(flaggedPosts.filter(p => p._id !== postId));
      } catch (error) {
        console.error('Error approving post:', error);
      }
    }
  };

  
  // Delete post
  const deletePost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts?postId=${postId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setPosts(posts.filter(post => post._id !== postId));
        setFlaggedPosts(flaggedPosts.filter(post => post._id !== postId));
        // Nếu bạn có state flaggedHistory
        if (flaggedHistory) {
          setFlaggedHistory(flaggedHistory.filter(post => post._id !== postId));
        }
      } else {
        // Hiển thị lỗi nếu response không ok
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post. Please try again.');
    }
  };

  // Format post date
  const formatPostDate = (timestamp: string) => {
    const now = new Date();
    const postDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;

    const days = Math.floor(diffInSeconds / 86400);
    const hours = Math.floor((diffInSeconds % 86400) / 3600);
    return `${days} ngày, ${hours} giờ trước`;
  };

  // Next image in carousel
  const nextImage = (postId:string, postIndex:number) => {
    // Tìm post trực tiếp từ ID thay vì chỉ số
    const post = posts.find(p => p._id === postId);
    
    if (post && post.media && post.media.length > 1) {
      setCurrentImageIndices(prevIndices => {
        const currentIndex = prevIndices[postId] !== undefined ? prevIndices[postId] : 0;
        const newIndex = (currentIndex + 1) % post.media.length;
        return { ...prevIndices, [postId]: newIndex };
      });
    }
  };
  
  const prevImage = (postId:string, postIndex:number) => {
    // Tìm post trực tiếp từ ID thay vì chỉ số
    const post = posts.find(p => p._id === postId);
    
    if (post && post.media && post.media.length > 1) {
      setCurrentImageIndices(prevIndices => {
        const currentIndex = prevIndices[postId] !== undefined ? prevIndices[postId] : 0;
        const newIndex = (currentIndex - 1 + post.media.length) % post.media.length;
        return { ...prevIndices, [postId]: newIndex };
      });
    }
  };

  // Get posts based on current view mode
  const getDisplayPosts = () => {
    let postsToDisplay;
    switch (viewMode) {
      case "flagged":
        postsToDisplay = flaggedPosts;
        break;
      case "history":
        postsToDisplay = posts.filter(post => post.status === 'flagged');
        break;
      case "normal":
      default:
        postsToDisplay = posts.filter(post => post.status !== 'flagged');
    }
    
    // Sort posts based on sortOrder
    return [...postsToDisplay].sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
    });
  };
  
  // Thêm hàm mới để xác nhận tất cả các bài viết bị đánh dấu
  const approveAllFlaggedPosts = async () => {
    try {
      // Bắt đầu hiển thị trạng thái đang xử lý
      setIsValidating(true);
      
      // Không cần gọi API để thay đổi trạng thái, vì chúng ta chỉ
      // muốn giữ status là "flagged" nhưng chuyển chúng từ danh sách
      // "cần kiểm duyệt" sang "lịch sử kiểm duyệt"
      
      // Thêm ngày xác nhận vào bài viết để theo dõi lịch sử
      const updatedPosts = posts.map(post => {
        // Nếu bài viết đang nằm trong danh sách flaggedPosts
        if (flaggedPosts.some(fp => fp._id === post._id)) {
          return {
            ...post,
            reviewedAt: new Date().toISOString(), // Thêm thời gian xác nhận
            reviewStatus: 'reviewed' // Thêm trạng thái xác nhận
          };
        }
        return post;
      });
      
      // Cập nhật state post với thông tin mới
      setPosts(updatedPosts);
      
      // Xóa tất cả bài viết khỏi danh sách "cần kiểm duyệt"
      // Lưu ý: chúng vẫn giữ status là "flagged"
      setFlaggedPosts([]);
      
      // Chuyển sang chế độ xem lịch sử kiểm duyệt
      setViewMode("history");
      
    } catch (error) {
      console.error('Error confirming all flagged posts:', error);
      setError('Không thể xác nhận tất cả bài viết. Vui lòng thử lại.');
    } finally {
      setIsValidating(false);
    }
  };

  const displayPosts = getDisplayPosts();

  return (
    <div className="h-full w-full overflow-auto">
      {/* Moderation Controls */}
      <div className="bg-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewMode("normal")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === "normal" 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Bài viết thường ({posts.filter(post => post.status !== 'flagged').length})
            </button>
            <button 
              onClick={() => setViewMode("flagged")}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                viewMode === "flagged" 
                  ? "bg-red-600 text-white" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              <AiFillFlag />
              Cần kiểm duyệt ({flaggedPosts.length})
            </button>
            <button 
              onClick={() => setViewMode("history")}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 ${
                viewMode === "history" 
                  ? "bg-gray-800 text-white" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              <MdHistory />
              Lịch sử kiểm duyệt ({posts.filter(post => post.status === 'flagged').length})
            </button>
              
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                {sortOrder === 'newest' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                )}
              </svg>
              <span className="font-medium cursor-pointer">{sortOrder === 'newest' ? 'Mới nhất' : 'Cũ nhất'}</span>
            </button>

          </div>
          
          <button 
              onClick={flaggedPosts.length > 0 ? approveAllFlaggedPosts : validateAllPosts}
              disabled={isValidating}
              className={`px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 flex items-center gap-1 ${
                isValidating ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {flaggedPosts.length > 0 
                ? (isValidating ? "Đang xác nhận..." : "Xác nhận tất cả") 
                : (isValidating ? "Đang kiểm duyệt..." : "Kiểm duyệt tất cả bài viết")}
            </button>

        </div>
      </div>
      
      {/* Post Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="col-span-3 text-center py-8">Loading posts...</div>
        ) : error ? (
          <div className="col-span-3 text-center py-8 text-red-500">{error}</div>
        ) : displayPosts.length === 0 ? (
          <div className="col-span-3 text-center py-8 text-gray-500">
            {viewMode === "normal" && "Không có bài viết nào"}
            {viewMode === "flagged" && "Không có bài viết nào cần kiểm duyệt"}
            {viewMode === "history" && "Không có lịch sử kiểm duyệt"}
          </div>
        ) : (
          displayPosts.map((post, postIndex) => (
            <div key={post._id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative">
                {/* Post Image */}
                <div className="w-full h-44 relative">
                  <Image
                    src={post.media[currentImageIndices[post._id] || 0]?.media_url || "/img/placeholder.png"}
                    alt={post.author_name}
                    layout="fill"
                    objectFit="cover"
                    objectPosition="center"
                    className="rounded-t-lg"
                  />

                  {/* Image Navigation */}
                  {post.media.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          prevImage(post._id, postIndex);
                        }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-opacity-50 bg-black/50 text-white p-1 rounded-full hover:bg-black/90"
                      >
                        <IoIosArrowBack className="text-lg" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          nextImage(post._id, postIndex);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-opacity-50 bg-black/50 text-white p-1 rounded-full hover:bg-black/90"
                      >
                        <IoIosArrowForward className="text-lg" />
                      </button>
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/30 bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                        {(currentImageIndices[post._id] || 0) + 1} / {post.media.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Flag Badge */}
                {post.flagged && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                    {post.flaggedReason}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex gap-2">
                {(viewMode === "flagged"||viewMode === "history") && (
                      <>
                        <button
                          onClick={() => approvePost(post._id)}
                          className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
                          title="Bài viết không vi phạm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                          </svg>
                        </button>
                      </>
                    )}


                  <button
                    onClick={() => deletePost(post._id)}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    title="Xóa bài viết"
                  >
                    <AiOutlineDelete className="text-lg" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                {/* Author Info */}
                <div className="flex items-center gap-2">
                  <Image
                    src={post.author_avatar || "/img/VN.jpg"}
                    alt={post.author_name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{post.author_name}</p>
                    <p className="text-xs text-gray-500">{formatPostDate(post.timestamp)}</p>
                    {post.flaggedAt && viewMode !== "normal" && (
                      <p className="text-xs text-red-500">Đã đánh dấu: {formatPostDate(post.flaggedAt)}</p>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <div className="mt-2">
                  <p className={`text-xs text-gray-800 ${expandedPosts[post._id] ? '' : 'line-clamp-3'}`}>
                    {post.content}
                  </p>

                  {/* Nếu content dài thì mới show nút Xem thêm */}
                  {post.content.length > 100 && (
                    <button
                      onClick={() => setExpandedPosts(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                      className="mt-1 text-blue-500 text-xs underline"
                    >
                      {expandedPosts[post._id] ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                  )}
                </div>


                {/* Post Status */}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">{post.status}</span>
                  <div className="flex items-center gap-2">
                    {/* Like Button */}
                    <button className="flex items-center gap-1">
                      {post.likes > 0 ? (
                        <AiFillHeart className="text-red-500 text-lg" />
                      ) : (
                        <AiOutlineHeart className="text-gray-500 text-lg" />
                      )}
                      <span className="text-xs text-gray-600">{post.likes}</span>
                    </button>
                    {/* Comment Button */}
                    <div className="flex items-center gap-1">
                      <AiOutlineComment className="text-gray-500 text-lg" />
                      <span className="text-xs text-gray-600">{post.comments_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SpaceShare;