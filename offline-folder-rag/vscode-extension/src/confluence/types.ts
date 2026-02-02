export interface ConfluencePageRequest {
    space_key: string;
    title: string;
    content_blocks: Array<{ type: string; content?: string }>;
    mode: "create" | "update";
    parent_page_id?: string;
}

export interface ConfluencePageResponse {
    page_id?: string;
    url?: string;
    status: string;
    error?: string;
}

export interface ConfluenceHealthResponse {
    status: string;
    config_present: boolean;
}
