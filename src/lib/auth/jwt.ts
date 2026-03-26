import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default";
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");

export type SessionPayload = {
    sub: string; // user id
    email: string;
};

export function signSession(payload: SessionPayload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string): SessionPayload {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
}
