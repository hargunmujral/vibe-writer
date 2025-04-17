// API data types for the Vibe Writer application

export interface ProjectInfo {
  project_name: string;
  description?: string;
  created_at?: string;
  last_updated?: string;
}

export interface TextContent {
  content: string;
  project_name: string;
  cursor_position?: number;
}

export interface EditResponse {
  success: boolean;
  message: string;
  content?: string;
}

export interface Edit {
  timestamp: string;
  edit_type: string;
  diff: {
    change_size: number;
    change_ratio: number;
  };
  location?: {
    cursor_position?: number;
  };
  context: {
    before: string;
    after: string;
  };
}

export interface Deletion {
  timestamp: string;
  deleted_text: string;
  location?: {
    cursor_position?: number;
  };
  context: string;
}

export interface DeletedTextInfo {
  deleted_text: string;
  project_name: string;
}

export interface EditHistoryResponse {
  success: boolean;
  edits: Edit[];
}

export interface DeletionHistoryResponse {
  success: boolean;
  deletions: Deletion[];
}

export interface ContentResponse {
  success: boolean;
  content: string;
  last_updated: string;
}

export interface ApiError {
  detail: string;
}
