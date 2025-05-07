//src\app\api\posts\user_stats\route.ts
import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';

// MongoDB connection
const uri = process.env.MONGODB_URI!;
const dbName = "Vintellitour"; 
const postsCollection = "posts"; 

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json(
      { message: 'UserId là bắt buộc và phải là string' }, 
      { status: 400 }
    );
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(userId);
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid userId format' }, 
        { status: 400 }
      );
    }
    
    // Query user's posts
    const posts = await db
      .collection(postsCollection)
      .find({ author_id: objectId })
      .toArray();
    
    // Calculate posts in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPosts = posts.filter(post => 
      post.timestamp && new Date(post.timestamp) > thirtyDaysAgo
    );
    
    // Count comments in the last 30 days
    const commentsInLast30Days = posts.reduce((acc, post) => {
      if (!post.comments || !Array.isArray(post.comments)) return acc;
      
      const recentComments = post.comments.filter(comment =>
        comment && comment.created_at && new Date(comment.created_at) > thirtyDaysAgo
      );
      
      return acc + recentComments.length;
    }, 0);
    
    // Return the stats
    return NextResponse.json({
      postsCount: recentPosts.length,
      commentsCount: commentsInLast30Days,
    });
    
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { message: 'Error while fetching data', error: String(error) }, 
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}