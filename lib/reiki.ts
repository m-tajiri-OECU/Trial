import { getReikiFileContent, listReikiFiles, type DriveFile } from "./google-drive";
import type { ReikiArticle, ReikiDocument, ReikiSearchHit, ReikiSearchMatch } from "./types";

// 例規JSONは kisoku-json-converter スキルによって e-Gov 法令標準XMLスキーマ
// (Article / ArticleTitle / ArticleCaption / LawTitle 等) に準拠した構造で
// 保存される想定だが、想定外の形でも検索・閲覧が破綻しないよう汎用的に走査する。
const ARTICLE_ARRAY_KEY_PATTERN = /article/i;
const TITLE_KEY_CANDIDATES = ["lawtitle", "title", "件名", "法令名", "規程名"];
const LAWNUM_KEY_CANDIDATES = ["lawnum", "lawnumber", "規程番号"];
const ARTICLE_LABEL_KEYS = ["articletitle", "num", "number", "条番号"];
const ARTICLE_CAPTION_KEYS = ["articlecaption", "caption", "見出し"];

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9ぁ-んァ-ヶ一-龠]/g, "");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findStringByKeys(node: unknown, candidates: string[], depth = 0): string | undefined {
  if (depth > 12) return undefined;

  if (isPlainObject(node)) {
    const normalizedEntries = Object.entries(node).map(
      ([key, value]) => [normalizeKey(key), value] as const
    );
    for (const candidate of candidates) {
      const match = normalizedEntries.find(
        ([key, value]) => key === candidate && typeof value === "string" && value.trim().length > 0
      );
      if (match) return (match[1] as string).trim();
    }
    for (const value of Object.values(node)) {
      const found = findStringByKeys(value, candidates, depth + 1);
      if (found) return found;
    }
  } else if (Array.isArray(node)) {
    for (const item of node) {
      const found = findStringByKeys(item, candidates, depth + 1);
      if (found) return found;
    }
  }

  return undefined;
}

function collectStrings(node: unknown, out: string[], depth = 0): void {
  if (depth > 20 || out.length > 5000) return;

  if (typeof node === "string") {
    const trimmed = node.trim();
    if (trimmed) out.push(trimmed);
  } else if (Array.isArray(node)) {
    for (const item of node) collectStrings(item, out, depth + 1);
  } else if (isPlainObject(node)) {
    for (const value of Object.values(node)) collectStrings(value, out, depth + 1);
  }
}

function collectArticles(node: unknown, out: ReikiArticle[], depth = 0): void {
  if (depth > 12) return;

  if (isPlainObject(node)) {
    for (const [key, value] of Object.entries(node)) {
      if (ARTICLE_ARRAY_KEY_PATTERN.test(key) && (isPlainObject(value) || Array.isArray(value))) {
        const items = Array.isArray(value) ? value : [value];
        for (const item of items) {
          if (!isPlainObject(item)) continue;
          const label = findStringByKeys(item, ARTICLE_LABEL_KEYS) ?? "(見出しなし)";
          const caption = findStringByKeys(item, ARTICLE_CAPTION_KEYS);
          const texts: string[] = [];
          collectStrings(item, texts);
          out.push({ label, caption, text: texts.join(" ") });
        }
      } else {
        collectArticles(value, out, depth + 1);
      }
    }
  } else if (Array.isArray(node)) {
    for (const item of node) collectArticles(item, out, depth + 1);
  }
}

export function parseReikiDocument(file: DriveFile, json: unknown): ReikiDocument {
  const title = findStringByKeys(json, TITLE_KEY_CANDIDATES) ?? file.name.replace(/\.json$/i, "");
  const lawNum = findStringByKeys(json, LAWNUM_KEY_CANDIDATES);

  const articles: ReikiArticle[] = [];
  collectArticles(json, articles);

  const rawTextParts: string[] = [];
  collectStrings(json, rawTextParts);

  return {
    fileId: file.id,
    fileName: file.name,
    title,
    lawNum,
    articles,
    rawText: rawTextParts.join(" "),
  };
}

export async function getAllReikiDocuments(): Promise<ReikiDocument[]> {
  const files = await listReikiFiles();
  return Promise.all(
    files.map(async (file) => parseReikiDocument(file, await getReikiFileContent(file.id)))
  );
}

export async function getReikiDocument(fileId: string): Promise<ReikiDocument | undefined> {
  const files = await listReikiFiles();
  const file = files.find((f) => f.id === fileId);
  if (!file) return undefined;
  return parseReikiDocument(file, await getReikiFileContent(file.id));
}

const SNIPPET_RADIUS = 40;
const MAX_MATCHES_PER_DOCUMENT = 5;

function buildSnippet(text: string, query: string): string {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return text.slice(0, SNIPPET_RADIUS * 2);

  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(text.length, index + query.length + SNIPPET_RADIUS);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}

export async function searchReiki(query: string): Promise<ReikiSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const needle = trimmed.toLowerCase();
  const documents = await getAllReikiDocuments();
  const hits: ReikiSearchHit[] = [];

  for (const doc of documents) {
    const matches: ReikiSearchMatch[] = [];

    if (doc.title.toLowerCase().includes(needle)) {
      matches.push({ snippet: buildSnippet(doc.title, trimmed) });
    }

    for (const article of doc.articles) {
      if (
        article.text.toLowerCase().includes(needle) ||
        article.label.toLowerCase().includes(needle) ||
        article.caption?.toLowerCase().includes(needle)
      ) {
        matches.push({
          articleLabel: article.caption ? `${article.label} ${article.caption}` : article.label,
          snippet: buildSnippet(article.text, trimmed),
        });
      }
    }

    if (matches.length === 0 && doc.rawText.toLowerCase().includes(needle)) {
      matches.push({ snippet: buildSnippet(doc.rawText, trimmed) });
    }

    if (matches.length > 0) {
      hits.push({
        fileId: doc.fileId,
        fileName: doc.fileName,
        title: doc.title,
        lawNum: doc.lawNum,
        matches: matches.slice(0, MAX_MATCHES_PER_DOCUMENT),
      });
    }
  }

  return hits;
}
