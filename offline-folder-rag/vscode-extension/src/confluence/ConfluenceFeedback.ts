/** Feedback payload (plain object, no React). */
export interface ConfluenceFeedbackPayload {
    page_id: string;
    rating?: number;
    comment?: string;
}

export function buildFeedbackPayload(pageId: string, rating?: number, comment?: string): ConfluenceFeedbackPayload {
    return { page_id: pageId, rating, comment };
}
