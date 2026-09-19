import Link from "next/link";
import { notFound } from "next/navigation";
import { getReikiDocument } from "@/lib/reiki";

// Google Drive上のJSONの更新を即時に反映するため、静的プリレンダリングを行わない。
export const dynamic = "force-dynamic";

export default async function ReikiDetailPage({
  params,
}: {
  params: Promise<{ fileId: string }>;
}) {
  const { fileId } = await params;

  let document;
  try {
    document = await getReikiDocument(fileId);
  } catch (error) {
    return (
      <div>
        <Link href="/reiki" className="text-sm text-oecu-teal hover:underline">
          ← 例規検索に戻る
        </Link>
        <p className="mt-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {(error as Error).message}
        </p>
      </div>
    );
  }

  if (!document) {
    notFound();
  }

  return (
    <div>
      <Link href="/reiki" className="text-sm text-oecu-teal hover:underline">
        ← 例規検索に戻る
      </Link>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-oecu-navy">{document.title}</h1>
        <p className="mb-6 text-xs text-slate-400">
          {document.lawNum ? `${document.lawNum} ・ ` : ""}
          {document.fileName}
        </p>

        {document.articles.length === 0 ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {document.rawText}
          </p>
        ) : (
          <div className="space-y-6">
            {document.articles.map((article, index) => (
              <div
                key={index}
                className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0"
              >
                <h2 className="text-sm font-semibold text-oecu-navy">
                  {article.label}
                  {article.caption ? ` ${article.caption}` : ""}
                </h2>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {article.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
