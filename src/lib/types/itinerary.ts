// Updated TypeScript interfaces

// First, let's update the interfaces to match the database structure
export interface Activity {
	description: string;
	cost: number;
	_id: string;
  }
  
  export interface ActivitiesGroup {
	activities: Activity[];
  }
  
  export interface ItineraryDay {
	day: number;
	morning: ActivitiesGroup;
	afternoon: ActivitiesGroup;
	evening: ActivitiesGroup;
	_id: string;
  }
  
  export interface Itinerary {
	_id: string;
	user: string;       // userId dưới dạng string
	destination: string;
	duration: string;
	startDate?: string; // Optional since it appears in the UI but not in the sample data
	itinerary: ItineraryDay[];
  }