import { NextResponse } from "next/server";

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = "http://127.0.0.1:3000/api/auth/callback";

const SCOPES = [
  "playlist-modify-private",
  "playlist-modify-public",
  "user-read-email",
  "user-read-private",
  "user-library-read"
];

export function GET() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: SCOPES.join(" "),
  });

  return NextResponse.redirect(
    "https://accounts.spotify.com/authorize?" + params.toString()
  );
}
