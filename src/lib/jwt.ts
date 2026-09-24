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
    },
  );
};

export const generateRefreshToken = (payload: TokenPayload) => {
  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: "7d",
    },
  );
};

// Verify access token
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET!,
  ) as TokenPayload;
};