import * as z from 'zod';

export const ThreadValidation = z.object({
    thread: z.string().min(3, "Profile photo url cannot be empty"),
    accountId: z.string(),
})

export const CommentValidation = z.object({
    thread: z.string().min(3, "Profile photo url cannot be empty"),
    // accountId: z.string(),
})