import qs from "querystring";

let cachedToken: { access_token: string; expires_at: number } | null = null;

export async function getSpotifyToken() {
  const now = Date.now();
  
  // If cached and not expired
  if (cachedToken && cachedToken.expires_at > now) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const authString = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authString}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: qs.stringify({ grant_type: "client_credentials" }),
  });

  const data = await response.json();

  cachedToken = {
    access_token: data.access_token,
    expires_at: now + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}
