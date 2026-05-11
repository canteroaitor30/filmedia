export type MediaType = "movie" | "series" | "anime";
export type MediaStatus = "watched" | "pending";
export type PrivacyLevel = "private" | "followers" | "public";
export type Platform =
  | "Netflix"
  | "HBO Max"
  | "Prime"
  | "Disney+"
  | "Apple TV+"
  | "Filmin"
  | "Movistar+"
  | "Crunchyroll"
  | "Cine"
  | "Otro";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          privacy_profile: PrivacyLevel;
          privacy_watchlist: PrivacyLevel;
          privacy_reviews: PrivacyLevel;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          privacy_profile?: PrivacyLevel;
          privacy_watchlist?: PrivacyLevel;
          privacy_reviews?: PrivacyLevel;
          onboarding_completed?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      invitation_codes: {
        Row: {
          id: string;
          code: string;
          created_by: string | null;
          used_by: string | null;
          used_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          code: string;
          created_by?: string | null;
          used_by?: string | null;
          used_at?: string | null;
          expires_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["invitation_codes"]["Insert"]>;
        Relationships: [];
      };
      user_media: {
        Row: {
          id: string;
          user_id: string;
          media_type: MediaType;
          external_id: number;
          status: MediaStatus;
          rating: number | null;
          platform: Platform | null;
          watched_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          media_type: MediaType;
          external_id: number;
          status: MediaStatus;
          rating?: number | null;
          platform?: Platform | null;
          watched_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["user_media"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          media_type: MediaType;
          external_id: number;
          content: string;
          has_spoilers: boolean;
          privacy: PrivacyLevel;
          edited_at: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          media_type: MediaType;
          external_id: number;
          content: string;
          has_spoilers?: boolean;
          privacy?: PrivacyLevel;
          edited_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
      review_likes: {
        Row: {
          review_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          review_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_likes"]["Insert"]>;
        Relationships: [];
      };
      review_comments: {
        Row: {
          id: string;
          review_id: string;
          user_id: string;
          parent_id: string | null;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          review_id: string;
          user_id: string;
          parent_id?: string | null;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_comments"]["Insert"]>;
        Relationships: [];
      };
      custom_lists: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          privacy: PrivacyLevel;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          description?: string | null;
          privacy?: PrivacyLevel;
        };
        Update: Partial<Database["public"]["Tables"]["custom_lists"]["Insert"]>;
        Relationships: [];
      };
      custom_list_items: {
        Row: {
          id: string;
          list_id: string;
          media_type: MediaType;
          external_id: number;
          position: number;
          created_at: string;
        };
        Insert: {
          list_id: string;
          media_type: MediaType;
          external_id: number;
          position: number;
        };
        Update: Partial<Database["public"]["Tables"]["custom_list_items"]["Insert"]>;
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["follows"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "new_follower" | "friend_reviewed_watchlist" | "friend_rated_same" | "comment_on_review";
          actor_id: string;
          review_id: string | null;
          media_type: MediaType | null;
          external_id: number | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          type: "new_follower" | "friend_reviewed_watchlist" | "friend_rated_same" | "comment_on_review";
          actor_id: string;
          review_id?: string | null;
          media_type?: MediaType | null;
          external_id?: number | null;
          read?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      media_cache: {
        Row: {
          media_type: string;
          external_id: number;
          title: string;
          genres: string[];
          runtime_minutes: number | null;
          year: number | null;
          cached_at: string;
        };
        Insert: {
          media_type: string;
          external_id: number;
          title: string;
          genres?: string[];
          runtime_minutes?: number | null;
          year?: number | null;
          cached_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_cache"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      media_type: MediaType;
      media_status: MediaStatus;
      privacy_level: PrivacyLevel;
      platform: Platform;
    };
  };
}
