'use client';

import Image from 'next/image';
import { useState, useEffect, useCallback,ChangeEvent, FormEvent } from 'react';

import { useParams } from "next/navigation";
import { AiOutlineHeart, AiOutlineComment, AiFillHeart, AiOutlinePlus} from 'react-icons/ai';
import { useSearchParams } from 'next/navigation';
import { Dialog } from '@headlessui/react';
import jwt from "jsonwebtoken";
import { getUserBadges, Badge as BadgeType } from '@/utils/userUtils';
import UltraBadge from '@components/Badge/Badge'; // Import the Ultra Badge component

interface MediaItem {
  media_url: string;
  media_type?: string;
}

interface Comment {
  _id: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface CommentModalProps {
  onClose: () => void;
  postId: string;
  postMedia?: MediaItem[];
  author_name: string;
  author_avatar: string;
  author_id: string;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  timestamp: string;
  author_name: string;
  author_avatar: string;
  author_id: string;
  media: MediaItem[];
  tags: string[];
  likes: number;
  comments_count: number;
  usersLiked?: string[];
}

function CommentModal({ onClose, postId, postMedia = [],author_name, author_avatar,author_id }: CommentModalProps) {
  const [comment, setComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorBadges, setAuthorBadges] = useState<BadgeType[]>([]);
  const [loadingBadges, setLoadingBadges] = useState(false);
  // Default media if none is provided
  const media = postMedia.length > 0 ? postMedia : [{ media_url: '/img/placeholder.png' }];
///Huy hieu
  useEffect(() => {
      const fetchAuthorBadges = async () => {
        if (author_id) {
          setLoadingBadges(true);
          try {
            const badges = await getUserBadges(author_id);
            setAuthorBadges(badges);
          } catch (error) {
            console.error(`Error fetching badges for author ${author_id}:`, error);
          } finally {
            setLoadingBadges(false);
          }
        }
      };
  
      fetchAuthorBadges();
    }, [author_id]);

  // Fetch comments from the database
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setComments(data);
      } else {
        throw new Error('Invalid comment data structure');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle submitting a comment
  const handleSubmit = async () => {
    if (!comment.trim()) return;
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('Bạn cần đăng nhập để bình luận.');
      setTimeout(() => {
        window.location.href = '/login'; // Redirect to the login page after a short delay
      }, 1000); // Delay in milliseconds (2000ms = 2 seconds)
      return;
    }
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, text: comment, userId }),
      });
      if (!response.ok) throw new Error('Failed to post comment');
      setComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Không thể gửi bình luận.');
    }
  };

  // Format timestamp to a more readable format
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w`;
    return `${Math.floor(diffInSeconds / 2592000)}mo`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center min-h-screen">
    <div className="bg-white text-black w-full max-w-4xl h-auto rounded-lg flex overflow-hidden relative">
      {/* Left - Images Section */}
      <div className="w-1/2 bg-black flex items-center justify-center overflow-hidden rounded-l-lg relative">
        <div className="w-full h-[600px] relative">
          <Image
            src={media[currentImageIndex].media_url}
            alt="post"
            layout="fill"
            objectFit="cover"
            className="rounded-l-lg"
          />
        </div>
        {media.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentImageIndex(prevIndex => (prevIndex - 1 + media.length) % media.length)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
            >
              &#10094;
            </button>
            <button 
              onClick={() => setCurrentImageIndex(prevIndex => (prevIndex + 1) % media.length)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
            >
              &#10095;
            </button>
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
              {media.map((_, idx) => (
                <div 
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-2 h-2 rounded-full cursor-pointer ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
  
      {/* Right - Comments */}
      <div className="w-1/2 p-4 flex flex-col h-[600px]">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-700 pb-2 relative">
          <Image src={author_avatar} alt="avatar" width={32} height={32} className="rounded-full" />
          <p className="font-semibold">{author_name}</p>

          {authorBadges.length > 0 && (
                          <div className="flex items-center gap-1 scale-90 transform-origin-left">
                            {authorBadges.map((badge, idx) => (
                              <UltraBadge 
                                key={idx} 
                                type={badge.type} 
                                label={badge.label} 
                              />
                            ))}
                          </div>
                        )}

          <button 
            onClick={onClose} 
            className="absolute top-2 right-2 text-black/50 hover:text-indigo-700 cursor-pointer font-bold">
            ✕
          </button>
        </div>
  
        {/* Comments */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-sm">
          {isLoading ? (
            <p className="text-center py-4">Loading comments...</p>
          ) : error ? (
            <p className="text-center py-4 text-red-500">{error}</p>
          ) : comments.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((commentItem) => (
              <div key={commentItem._id} className="flex items-start gap-3">
                <Image
                  src={commentItem.avatar}
                  alt={commentItem.username}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div>
                  <p className="text-gray-800">
                    <span className="font-bold">{commentItem.username}</span> {commentItem.text}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatTimeAgo(commentItem.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
  
        {/* Footer */}
        <div className="border-t border-gray-700 pt-3 mt-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add a comment..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-black placeholder-gray-400"
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
            <button
              className="text-sm text-blue-500 font-semibold"
              onClick={handleSubmit}
              disabled={!comment.trim()}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  );
}


export default function SpaceShare(req: Request) {
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<string, number>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const params = useParams<{ id: string }>();
  const locationId = params?.id ?? null;
  // Thêm vào danh sách các state ở đầu component
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  const filteredPosts = selectedTag
  ? posts.filter(post => post.tags.includes(selectedTag))
  : posts;

  const id = params?.id;  
    useEffect(() => {
      const fetchPostsByLocation = async () => {
        try {
          const res = await fetch(`/api/posts?location_id=${id} `);
          const data = await res.json();
          setPosts(data);
        } catch (error) {
          console.error("Lỗi khi fetch posts theo địa điểm:", error);
        }
      };
  
      if (id) {
        fetchPostsByLocation();
      }
    }, [id]);
    
    useEffect(() => {
      const fetchPosts = async () => {
        setIsLoading(true);
        try {
          // Thêm location_id vào URL nếu có
          const url = locationId 
            ? `/api/posts?location_id=${locationId}`
            : "/api/posts";
            
          const res = await fetch(url);
          
          if (!res.ok) {
            throw new Error('Failed to fetch posts');
          }
          
          const data = await res.json();
          setPosts(data);
          
          // Nếu có location_id, lấy thêm thông tin về địa điểm
          if (locationId) {
            fetchLocationInfo(locationId);
          }
        } catch (error) {
          console.error("Error fetching posts:", error);
          setError('Failed to load posts. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };
    const fetchLocationInfo = async (locId: string) => {
      try {
        const res = await fetch(`/api/locations/${locId}`);
        if (res.ok) {
          const data = await res.json();
          setLocationName(data.name);
        }
      } catch (error) {
        console.error("Error fetching location info:", error);
      }
    };

    fetchPosts();
  }, [locationId]);
////////////////// Like

  useEffect(() => {
    // Lấy thông tin người dùng từ sessionStorage hoặc localStorage
    const userId = localStorage.getItem("userId"); // Giả sử bạn đã lưu userId ở đây khi người dùng đăng nhập

    if (userId) {
      setCurrentUserId(userId);
    }
  }, []);

  useEffect(() => {
    // Lấy likedPosts từ localStorage
    const storedLikedPosts = localStorage.getItem("likedPosts");
    
    if (storedLikedPosts) {
      setLikedPosts(JSON.parse(storedLikedPosts)); // Cập nhật trạng thái likedPosts
    }
  }, []);
  

// Toggle like for a post
const toggleLike = async (postId: string) => {
  if (!currentUserId) {
    setError('Bạn cần đăng nhập để bình luận.');
      setTimeout(() => {
        window.location.href = '/login'; // Redirect to the login page after a short delay
      }, 1000); // Delay in milliseconds (2000ms = 2 seconds)
    return;
  }
  try {
    const response = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserId }),
    });

    if (!response.ok) {
      throw new Error("Failed to update like");
    }

    const data = await response.json();

    if (data.success) {
      setLikedPosts((prev) => ({
        ...prev,
        [postId]: data.liked,
      }));

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post._id === postId) {
            const updatedUsersLiked = post.usersLiked ? [...post.usersLiked] : [];

            if (data.liked) {
              // Nếu đã like
              if (!updatedUsersLiked.includes(currentUserId!)) {
                updatedUsersLiked.push(currentUserId!);
              }
            } else {
              // Nếu đã unlike
              const index = updatedUsersLiked.indexOf(currentUserId!);
              if (index !== -1) {
                updatedUsersLiked.splice(index, 1);
              }
            }

            return {
              ...post,
              usersLiked: updatedUsersLiked,
            };
          }
          return post;
        })
      );
    }
  } catch (error) {
    console.error("Error updating like:", error);
  }
};

/////////////////////// Like
  // Format the post date
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



  useEffect(() => {
    if (posts.length > 0) {
      const initialIndices: Record<string, number> = {};
      posts.forEach(post => {
        initialIndices[post._id] = 0; // Đặt index mặc định là 0 cho mỗi post
      });
      setCurrentImageIndices(initialIndices);
    }
  }, [posts]);

  const [authorBadges, setAuthorBadges] = useState<Record<string, BadgeType[]>>({});
   // Add this useEffect to fetch badges for each post author
        useEffect(() => {
          const fetchBadgesForPosts = async () => {
            if (posts.length > 0) {
              const badgeMap: Record<string, BadgeType[]> = {};
              
              for (const post of posts) {
                if (post.author_id) {
                  try {
                    const authorBadges = await getUserBadges(post.author_id);
                    badgeMap[post.author_id] = authorBadges;
                  } catch (error) {
                    console.error(`Error fetching badges for author ${post.author_id}:`, error);
                  }
                }
              }
              
              // Store the badges in state
              setAuthorBadges(badgeMap);
            }
          };
  
    fetchBadgesForPosts();
  }, [posts]);

  // Navigation functions for post images
  const nextImage = (postId: string, postIndex: number) => {
    const post = posts[postIndex];
    if (post && post.media.length > 1) {
      setCurrentImageIndices((prevIndices) => {
        const currentIndex = prevIndices[postId] !== undefined ? prevIndices[postId] : 0;
        const newIndices = { ...prevIndices };
        newIndices[postId] = (currentIndex + 1) % post.media.length;
        return newIndices;
      });
    }
  };
  
  const prevImage = (postId: string, postIndex: number) => {
    const post = posts[postIndex];
    if (post && post.media.length > 1) {
      setCurrentImageIndices((prevIndices) => {
        const currentIndex = prevIndices[postId] !== undefined ? prevIndices[postId] : 0;
        const newIndices = { ...prevIndices };
        newIndices[postId] = (currentIndex - 1 + post.media.length) % post.media.length;
        return newIndices;
      });
    }
  };
  

  // Open comment modal for a specific post
  const openCommentModal = (post: Post) => {
    setSelectedPost(post);
    setShowCommentModal(true);
  };

  return (
    <div className="flex flex-col md:flex-row px-4 md:px-16 py-8 gap-8">
      {/* LEFT COLUMN */}
      <div className="flex-1">
      <h2 className="text-xl text-gray-700 font-semibold border-b pb-2 border-gray-300 mb-6">
          {locationName ? `Bài viết tại: ${locationName}` : 
           selectedTag ? `Tỉnh: ${selectedTag}` : "Tất cả tỉnh"}
        <div className="w-25 h-1 bg-purple-500 mt-1 rounded-full" />
      </h2>
      {locationId && (
          <div className="mb-4 text-sm text-gray-600">
            <button
              onClick={() => window.location.href = '/'}
              className="text-blue-500 underline text-[14px] cursor-pointer"
            >
              ← Quay lại
            </button>
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-8">Loading posts...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No posts available</div>
        ) : (
          <>
            {selectedTag && (
                  <div className="mb-4 text-sm text-gray-600">
                    Đang lọc theo tag: <strong className="text-purple-600">#{selectedTag}</strong>
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="ml-2 text-blue-500 underline text-[14px] cursor-pointer"
                    >
                      Xoá lọc
                    </button>
                  </div>
                )}
          {filteredPosts.map((post, index) => (
            <div key={post._id} className="mb-12">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-2">
                <Image 
                  src={post.author_avatar || "/img/VN.jpg"} 
                  alt={post.author_name} 
                  width={50} 
                  height={50} 
                  className="rounded-full" 
                />
                <div>
                  <p className="text-sm font-bold text-orange-600">{post.author_name || "Hello World"}</p>
                   {/* Display badge if available */}
               {/* Display badge if available */}
                              {post.author_id && authorBadges[post.author_id]?.length > 0 && (
                                <div className="flex items-center gap-1 mt-1">
                                  {authorBadges[post.author_id].map((badge, idx) => (
                                    <div className="scale-80 transform-origin-right ml-[-12px]"> {/* Thu nhỏ xuống còn 75% */}
                                    <UltraBadge 
                                      key={idx} 
                                      type={badge.type} 
                                      label={badge.label} 
                                    />
                                  </div>
                                  ))}
                                </div>
                              )}
                  <p className="text-xs text-gray-500">{formatPostDate(post.timestamp)}</p>
                  <p className="text-xs text-gray-400">đã đăng 1 bài</p>
                </div>
              </div>

              {/* Content */}
              <div className="mt-2">
                    <p className={`text-gray-500 mb-3 ${expandedPosts[post._id] ? '' : 'line-clamp-3'}`}>
                      {post.content}
                    </p>

                    {/* Nếu content dài thì mới show nút Xem thêm */}
                    {post.content.length > 100 && (
                      <button
                        onClick={() => setExpandedPosts(prev => ({ ...prev, [post._id]: !prev[post._id] }))}
                        className="mb-3 text-blue-500 text-xs underline rounded-full px-3 py-1 border border-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-300 flex items-center gap-1"
                      >
                        <span>
                          {expandedPosts[post._id] ? 'Thu gọn' : 'Xem thêm'}
                        </span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-3 w-3 transition-transform duration-300 ${expandedPosts[post._id] ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>


              {/* Show media if available */}
              {post.media && post.media.length > 0 && (
                <div className="mb-4 w-[600px] h-[700px] relative">
                  {/* Main displayed image */}
                  <div className="w-[600px] h-full relative">
                    <Image
                      src={post.media[currentImageIndices[post._id] || 0]?.media_url || "/img/placeholder.png"}
                      alt={`Image of post by ${post.author_name}`}
                      layout="fill"
                      objectFit="cover"
                      className="rounded-md"
                    />
                  </div>

                  {/* Navigation controls - only show if there are multiple images */}
                  {post.media.length > 1 && (
                    <>
                      {/* Left arrow */}
                      <button
                        onClick={() => prevImage(post._id, index)}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        &#10094;
                      </button>

                      {/* Right arrow */}
                      <button
                        onClick={() => nextImage(post._id, index)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                      >
                        &#10095;
                      </button>

                      {/* Image thumbnails/indicators */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
                          {post.media.map((_, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setCurrentImageIndices((prevIndices) => {
                                  const newIndices = { ...prevIndices };
                                  newIndices[post._id] = idx; // Set the index for this specific post
                                  return newIndices;
                                });
                              }}
                              className={`w-2 h-2 rounded-full cursor-pointer ${idx === currentImageIndices[post._id] ? 'bg-white' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                    </>
                  )}
                </div>
              )}

              {/* Reactions */}
              <div className="flex gap-6 mt-3 text-gray-700">
              <div
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => toggleLike(post._id)}
                >
                  {likedPosts[post._id] ? (
                    <AiFillHeart className="text-2xl text-red-500" />
                  ) : (
                    <AiOutlineHeart className="text-2xl" />
                  )}
                  <span>{post.usersLiked?.length ?? post.likes ?? 0}</span>
              </div>
                <div
                  onClick={() => openCommentModal(post)}
                  className="flex items-center gap-1 cursor-pointer"
                >
                  <AiOutlineComment className="text-2xl" />
                  <span>{post.comments_count}</span>
                </div>
              </div>
            </div>
          ))}
          </>  
        )}
      </div>

      <div className="hidden md:block w-px bg-gray-300"></div> 
      {/* Comment Modal */}
      {showCommentModal && selectedPost && (
        <CommentModal 
          onClose={() => setShowCommentModal(false)} 
          postId={selectedPost._id}
          postMedia={selectedPost.media} 
          author_name={selectedPost.author_name}
          author_avatar={selectedPost.author_avatar}
          author_id={selectedPost.author_id}
        />
      )}
      <PostCreationButton />
    </div>
  );
}
function PostCreationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [user, setUser] = useState<{ userId: string | null; userName: string | null }>({
    userId: null,
    userName: null,
  });
  const params = useParams<{ id: string }>();
  const locationId = params?.id ?? null;
  // Get provinceGid from the URL
  const searchParams = useSearchParams();
  const provinceGid = searchParams ? searchParams.get("provinceGid") : null;

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      try {
        const decodedToken = jwt.decode(token) as { userId: string; userName: string };
        setUser({
          userId: decodedToken.userId,
          userName: decodedToken.userName,
        });
      } catch (error) {
        console.error("Lỗi giải mã token:", error);
      }
    }
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setImages(fileArray);

      const previews = fileArray.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImage = (index: number) => {
    const newPreviews = [...imagePreviews];
    const newFiles = [...images];
    newPreviews.splice(index, 1);
    newFiles.splice(index, 1);
    setImagePreviews(newPreviews);
    setImages(newFiles);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!user.userId) {
      window.location.href = '/login';
      return;
    }

    const formData = new FormData();
    formData.append("title", "Bài viết mới"); // Có thể cập nhật thêm field title nếu muốn
    formData.append("content", postContent);
    formData.append("author_id", user.userId);
    if (locationId) {
      formData.append("location", locationId); // ✅ Chỉ chuỗi, không stringify object
    }
    if (provinceGid) {
      formData.append("provinceGid", provinceGid);
    }
    formData.append("tags", ""); // Có thể thêm tags nếu muốn
    images.forEach((img) => formData.append("image", img));

    const res = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      console.log("Bài viết đã được đăng:", data);
      setPostContent("");
      setImages([]);
      setImagePreviews([]);
      setIsOpen(false);
      window.location.reload();
    } else {
      console.error("Lỗi khi đăng bài viết");
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-xl z-50"
      >
        <AiOutlinePlus className="w-7 h-7" />
      </button>

      <Dialog open={isOpen} onClose={() => setIsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white w-full max-w-md rounded-xl shadow-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl font-semibold">Tạo bài viết</Dialog.Title>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 text-xl">
                &times;
              </button>
            </div>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Đừng ngại chia sẻ khoảnh khắc du lịch của bạn..."
              rows={4}
              className="w-full p-3 border rounded-md text-sm focus:outline-none focus:ring focus:border-blue-300"
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hình ảnh</label>
              <div className="relative inline-block">
                <label className="cursor-pointer">
                  <span className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-100">
                    Chọn tệp
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="absolute left-0 top-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </label>
              </div>

              {/* Image previews */}
              {imagePreviews.length > 0 && (
                <div className="flex gap-3 overflow-x-auto mt-3">
                  {imagePreviews.map((src, idx) => (
                    <div key={idx} className="relative group">
                      <Image
                        src={src}
                        alt={`preview-${idx}`}
                        width={120}
                        height={120}
                        className="rounded-md border object-cover h-28"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-4">
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                onClick={handleSubmit}
              >
                Đăng
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
}
