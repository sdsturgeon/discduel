import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
  const REDIRECT_URI = "http://127.0.0.1:3000/api/auth/callback";

  const tokenEndpoint = "https://accounts.spotify.com/api/token";

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  try {
    const res = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await res.json();

    if (data.error) {
      console.error("TOKEN EXCHANGE ERROR:", data);
      return NextResponse.json(data, { status: 500 });
    }

    // -------------------------------------
    // Save tokens into cookies (temporary)
    // -------------------------------------
    const response = NextResponse.redirect("http://127.0.0.1:3000/select-artist");

    response.cookies.set("spotify_access_token", data.access_token, {
      httpOnly: true,
      secure: false,
      path: "/",
    });

    response.cookies.set("spotify_refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: false,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("SPOTIFY CALLBACK ERROR:", err);
    return NextResponse.json(
      { error: "Callback failed" },
      { status: 500 }
    );
  }
}
