import { z } from "zod";
import validator from "validator";

export const signupSchema = z.object({
    email: z
        .string()
        .min(3)
        .refine((v) => validator.isEmail(v), "Invalid email"),
    password: z
        .string()
        .min(8, "Password must be at least 8 chars")
        .refine(
            (v) => validator.isStrongPassword(v, { minSymbols: 0 }),
            "Weak password",
        ),
});

export const loginSchema = z.object({
    email: z.string().refine((v) => validator.isEmail(v), "Invalid email"),
    password: z.string().min(1),
});
