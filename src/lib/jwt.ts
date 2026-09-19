import jwt from "jsonwebtoken";

interface TokenPayload {
  id: string;
}

export const generateAccessToken = (payload: TokenPayload) => {
  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "15m",
    }
  );
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: "7d",
    }
  );
};