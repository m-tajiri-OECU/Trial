import Link from "next/link";
import { isGoogleDriveConfigured } from "@/lib/google-drive";
import { getAllReikiDocuments, searchReiki } from "@/lib/reiki";
import type { ReikiDocument, ReikiSearchHit } from "@/lib/types";

// Google Drive上のJSONの更新を即時に反映するため、静的プリレンダリングを行わない。
export const dynamic = "force-dynamic";

function DocumentList({ documents }: { documents: ReikiDocument[] }) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Google Driveのフォルダに例規JSONが見つかりません。
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {documents.map((doc) => (
        <li key={doc.fileId}>
          <Link
            href={`/reiki/${doc.fileId}`}
            className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-oecu-teal hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-oecu-navy">{doc.title}</h3>
            <p className="mt-1 text-xs text-slate-400">
              {doc.lawNum ? `${doc.lawNum} ・ ` : ""}
              {doc.fileName} ・ 条文数: {doc.articles.length}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SearchResults({ query, hits }: { query: string; hits: ReikiSearchHit[] }) {
  if (hits.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        「{query}」に一致する例規は見つかりませんでした。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        「{query}」に一致する例規が {hits.length} 件見つかりました。
      </p>
      <ul className="space-y-3">
        {hits.map((hit) => (
          <li key={hit.fileId} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <Link
              href={`/reiki/${hit.fileId}`}
              className="text-base font-semibold text-oecu-navy hover:underline"
            >
              {hit.title}
            </Link>
            <p className="mt-1 text-xs text-slate-400">
              {hit.lawNum ? `${hit.lawNum} ・ ` : ""}
              {hit.fileName}
            </p>
            <ul className="mt-2 space-y-1">
              {hit.matches.map((match, index) => (
                <li key={index} className="text-sm text-slate-600">
                  {match.articleLabel && (
                    <span className="mr-2 font-medium text-oecu-teal">{match.articleLabel}</span>
                  )}
                  {match.snippet}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ReikiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  if (!isGoogleDriveConfigured()) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-oecu-navy">例規検索</h1>
        <p className="text-sm text-slate-600">
          Google Drive連携が未設定です。管理者に環境変数(GOOGLE_SERVICE_ACCOUNT_EMAIL /
          GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY / GOOGLE_DRIVE_REIKI_FOLDER_ID)の設定を依頼してください。
        </p>
      </div>
    );
  }

  let errorMessage: string | null = null;
  let hits: ReikiSearchHit[] = [];
  let documents: ReikiDocument[] = [];

  try {
    if (query) {
      hits = await searchReiki(query);
    } else {
      documents = await getAllReikiDocuments();
    }
  } catch (error) {
    errorMessage = (error as Error).message;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-oecu-navy">例規検索</h1>
        <p className="text-sm text-slate-600">
          Google Driveに保存されている例規JSON(規則・規程・細則・要綱)を条文単位で閲覧・検索できます。
        </p>
      </div>

      <form action="/reiki" method="get" className="mb-8 flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="例規名・条文キーワードを入力"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-oecu-navy px-4 py-2 text-sm font-medium text-white hover:bg-oecu-teal"
        >
          検索
        </button>
      </form>

      {errorMessage && (
        <p className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {query ? <SearchResults query={query} hits={hits} /> : <DocumentList documents={documents} />}
    </div>
  );
}
