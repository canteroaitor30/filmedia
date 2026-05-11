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
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      invitation_codes: {
        Row: {
          id: string;
          code: string;
          created_by: string;
          used_by: string | null;
          used_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["invitation_codes"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["invitation_codes"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["user_media"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["user_media"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      review_likes: {
        Row: {
          review_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["review_likes"]["Row"], "created_at">;
        Update: never;
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
        Insert: Omit<Database["public"]["Tables"]["review_comments"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["review_comments"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["custom_lists"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["custom_lists"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["custom_list_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["custom_list_items"]["Insert"]>;
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["follows"]["Row"], "created_at">;
        Update: never;
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
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
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
