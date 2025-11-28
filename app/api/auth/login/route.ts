import { NextResponse } from "next/server";

console.log("ENV DEBUG", {
  id: process.env.SPOTIFY_CLIENT_ID,
  secret: process.env.SPOTIFY_CLIENT_SECRET,
  base: process.env.BASE_URL
});

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const BASE_URL = process.env.BASE_URL!;

const REDIRECT_URI = `${BASE_URL}/api/auth/callback`;

const SCOPES = [
  "playlist-modify-private",
  "playlist-modify-public",
  "user-read-email",
  "user-read-private",
  "user-library-read",
];

export function GET() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
  });

  const authorizeUrl =
    "https://accounts.spotify.com/authorize?" + params.toString();

  console.log("🚨 DEBUG LOGIN REDIRECT URI:", REDIRECT_URI);
  console.log("🚨 FULL AUTH URL:", authorizeUrl);

  return NextResponse.redirect(authorizeUrl);
}
