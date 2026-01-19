export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      edges: {
        Row: {
          animated: boolean | null
          id: string
          marker_end: Json | null
          source: string | null
          source_handle: string | null
          target: string | null
          target_handle: string | null
          type: string | null
        }
        Insert: {
          animated?: boolean | null
          id: string
          marker_end?: Json | null
          source?: string | null
          source_handle?: string | null
          target?: string | null
          target_handle?: string | null
          type?: string | null
        }
        Update: {
          animated?: boolean | null
          id?: string
          marker_end?: Json | null
          source?: string | null
          source_handle?: string | null
          target?: string | null
          target_handle?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edges_source_fkey"
            columns: ["source"]
            isOneToOne: false
            referencedRelation: "active_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_source_fkey"
            columns: ["source"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_target_fkey"
            columns: ["target"]
            isOneToOne: false
            referencedRelation: "active_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_target_fkey"
            columns: ["target"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      nodes: {
        Row: {
          comments: Json | null
          deleted: boolean | null
          description: string | null
          details: string | null
          handle_labels: Json | null
          height: number | null
          id: string
          node_type: string | null
          package_version: string | null
          position_x: number
          position_y: number
          status: string | null
          title: string
          type: string
          upvotes: number | null
          width: number | null
        }
        Insert: {
          comments?: Json | null
          deleted?: boolean | null
          description?: string | null
          details?: string | null
          handle_labels?: Json | null
          height?: number | null
          id: string
          node_type?: string | null
          package_version?: string | null
          position_x: number
          position_y: number
          status?: string | null
          title: string
          type: string
          upvotes?: number | null
          width?: number | null
        }
        Update: {
          comments?: Json | null
          deleted?: boolean | null
          description?: string | null
          details?: string | null
          handle_labels?: Json | null
          height?: number | null
          id?: string
          node_type?: string | null
          package_version?: string | null
          position_x?: number
          position_y?: number
          status?: string | null
          title?: string
          type?: string
          upvotes?: number | null
          width?: number | null
        }
        Relationships: []
      }
      todos: {
        Row: {
          category: string
          completed: boolean | null
          created_at: string | null
          date: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          completed?: boolean | null
          created_at?: string | null
          date: string
          id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          completed?: boolean | null
          created_at?: string | null
          date?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      active_nodes: {
        Row: {
          comments: Json | null
          deleted: boolean | null
          description: string | null
          details: string | null
          id: string | null
          position_x: number | null
          position_y: number | null
          status: string | null
          title: string | null
          type: string | null
          upvotes: number | null
        }
        Insert: {
          comments?: Json | null
          deleted?: boolean | null
          description?: string | null
          details?: string | null
          id?: string | null
          position_x?: number | null
          position_y?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
          upvotes?: number | null
        }
        Update: {
          comments?: Json | null
          deleted?: boolean | null
          description?: string | null
          details?: string | null
          id?: string | null
          position_x?: number | null
          position_y?: number | null
          status?: string | null
          title?: string | null
          type?: string | null
          upvotes?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_active_edges: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          source: string
          source_handle: string
          target: string
          target_handle: string
          type: string
          animated: boolean
          marker_end: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
