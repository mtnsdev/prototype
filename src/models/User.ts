import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true, index: true },
        passwordHash: { type: String, required: true, select: false },
    },
    { timestamps: true },
);

export const User = models.User || model("User", UserSchema);
