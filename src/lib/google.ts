import { OAuth2Client } from 'google-auth-library';

export const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL // cth: http://localhost:3000/api/auth/google/callback
);

// Helper untuk mendapatkan URL login
export const getGoogleAuthURL = () => {
  return googleClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
  });
};

// Helper untuk mendapatkan data user dari "code"
export const getGoogleUserFromCode = async (code: string) => {
  const { tokens } = await googleClient.getToken(code);
  googleClient.setCredentials(tokens);

  const userRes = await googleClient.request({
    url: 'https://www.googleapis.com/oauth2/v2/userinfo',
  });

  return userRes.data as {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
};