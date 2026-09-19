import { createSign } from "crypto";

const DRIVE_FILES_ENDPOINT = "https://www.googleapis.com/drive/v3/files";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

interface ServiceAccountConfig {
  clientEmail: string;
  privateKey: string;
  folderId: string;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function isGoogleDriveConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY &&
      process.env.GOOGLE_DRIVE_REIKI_FOLDER_ID
  );
}

function getConfig(): ServiceAccountConfig {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_REIKI_FOLDER_ID;

  if (!clientEmail || !privateKeyRaw || !folderId) {
    throw new Error(
      "Google Drive連携が未設定です。環境変数 GOOGLE_SERVICE_ACCOUNT_EMAIL / " +
        "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY / GOOGLE_DRIVE_REIKI_FOLDER_ID を設定してください。"
    );
  }

  return {
    clientEmail,
    // .env に改行を直接書けないため \n でエスケープされている前提で復元する。
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
    folderId,
  };
}

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.accessToken;
  }

  const { clientEmail, privateKey } = getConfig();
  const nowSeconds = Math.floor(Date.now() / 1000);

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: clientEmail,
      scope: DRIVE_READONLY_SCOPE,
      aud: TOKEN_ENDPOINT,
      iat: nowSeconds,
      exp: nowSeconds + 3600,
    })
  );
  const signatureInput = `${header}.${claims}`;
  const signature = base64url(createSign("RSA-SHA256").update(signatureInput).sign(privateKey));
  const assertion = `${signatureInput}.${signature}`;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google認証トークンの取得に失敗しました (status: ${response.status})`);
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.accessToken;
}

const LIST_CACHE_TTL_MS = 60_000;
let cachedList: { files: DriveFile[]; fetchedAt: number } | null = null;

export async function listReikiFiles(): Promise<DriveFile[]> {
  if (cachedList && cachedList.fetchedAt + LIST_CACHE_TTL_MS > Date.now()) {
    return cachedList.files;
  }

  const { folderId } = getConfig();
  const accessToken = await getAccessToken();

  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and mimeType = 'application/json' and trashed = false`,
      fields: "nextPageToken, files(id, name, modifiedTime)",
      pageSize: "1000",
      orderBy: "name",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`${DRIVE_FILES_ENDPOINT}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Google Driveのファイル一覧取得に失敗しました (status: ${response.status})`);
    }

    const data = (await response.json()) as { files: DriveFile[]; nextPageToken?: string };
    files.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  cachedList = { files, fetchedAt: Date.now() };
  return files;
}

const CONTENT_CACHE_TTL_MS = 5 * 60_000;
const contentCache = new Map<string, { data: unknown; fetchedAt: number }>();

export async function getReikiFileContent(fileId: string): Promise<unknown> {
  const cached = contentCache.get(fileId);
  if (cached && cached.fetchedAt + CONTENT_CACHE_TTL_MS > Date.now()) {
    return cached.data;
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${DRIVE_FILES_ENDPOINT}/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Google Driveのファイル取得に失敗しました (status: ${response.status}, fileId: ${fileId})`);
  }

  const data = (await response.json()) as unknown;
  contentCache.set(fileId, { data, fetchedAt: Date.now() });
  return data;
}
