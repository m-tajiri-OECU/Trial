import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkillById } from "@/lib/skills";

// 管理者設定の変更を即時に反映するため、静的プリレンダリングを行わない。
export const dynamic = "force-dynamic";

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const skill = getSkillById(id);

  if (!skill || !skill.enabled) {
    notFound();
  }

  return (
    <div>
      <Link href="/" className="text-sm text-oecu-teal hover:underline">
        ← スキル一覧に戻る
      </Link>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-oecu-mint px-3 py-1 text-xs font-medium text-oecu-navy">
            {skill.category}
          </span>
          <span className="text-xs text-slate-400">更新日: {skill.updatedAt}</span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-oecu-navy">{skill.name}</h1>
        <p className="mb-6 text-sm text-slate-500">担当部署: {skill.department}</p>

        <p className="mb-6 leading-relaxed text-slate-700">{skill.description}</p>

        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">利用手順</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600">
            {skill.howToUse.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-700">
            必要な入力
          </h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            {skill.inputs.map((input, index) => (
              <li key={index}>{input}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-2">
          {skill.tags.map((tag) => (
            <span
              key={tag}
              className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
