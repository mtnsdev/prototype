export type DriveStatus = {
    connected: boolean;
    connection_id?: number;
    connection_type: string;
    folder_id?: string | null;
    folder_name?: string | null;
    status?: string | null;
    sync_status?: string | null;
    last_synced_at?: string | null;
    sync_error?: string | null;
    files_indexed: number;
    files_pending: number;
};

export type DriveFile = {
    id: number;
    drive_file_id: string;
    filename?: string;
    mime_type?: string;
    drive_path?: string;
    is_folder: boolean;
    sync_status: string;
    index_status: string;
    file_size_bytes?: number;
    access_level?: string; // agency only: "public" | "admin_only" | "user_specific" | "role_restricted"
};
