// utils/userUtils.ts

interface UserStats {
	postsCount: number;
	commentsCount: number;
  }
  
  // Define badge types
  export type BadgeType = 'expert' | 'creator' | 'connector' | 'rookie';
  
  export interface Badge {
	type: BadgeType;
	label: string;
  }
  
  export async function getUserBadges(userId: string): Promise<Badge[]> {
	try {
	  // Fetch user stats from API
	  const response = await fetch(`/api/posts/user_stats?userId=${userId}`);
	 
	  if (!response.ok) {
		throw new Error(`API responded with status: ${response.status}`);
	  }
	 
	  const data: UserStats = await response.json();
	  console.log("Fetched user stats:", data); // Log data for debugging
	 
	  // Return a single badge based on user activity
	  let badge: Badge | null = null;
	 
	  // Logic for badge assignment based on the count
	  if (data.postsCount >= 5 && data.commentsCount > 15) {
		badge = {
		  type: "expert",
		  label: "Chuyên Gia Tương Tác"
		};
	  } else if (data.postsCount >= 5) {
		badge = {
		  type: "creator",
		  label: "Người Sáng Tạo"
		};
	  } else if (data.commentsCount > 15) {
		badge = {
		  type: "connector",
		  label: "Người Kết Nối"
		};
	  } else if (data.postsCount >= 0) {
		badge = {
		  type: "rookie",
		  label: "Tân Binh"
		};
	  }
	 
	  return badge ? [badge] : [];
	} catch (error) {
	  console.error("Error fetching badges:", error);
	  return []; // Return empty array on error
	}
  }