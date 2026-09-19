import { getEnabledSkills } from "@/lib/skills";
import SkillCard from "@/components/SkillCard";
import type { Skill } from "@/lib/types";

// 管理者設定の変更を即時に反映するため、静的プリレンダリングを行わない。
export const dynamic = "force-dynamic";

function groupByCategory(skills: Skill[]): Map<string, Skill[]> {
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) {
    const list = groups.get(skill.category) ?? [];
    list.push(skill);
    groups.set(skill.category, list);
  }
  return groups;
}

export default function HomePage() {
  const skills = getEnabledSkills();
  const groups = groupByCategory(skills);

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-oecu-navy">
          組織内共有スキル一覧
        </h1>
        <p className="text-sm text-slate-600">
          法人事務局が整備した業務支援スキルのカタログです。利用したいスキルを選択し、詳細ページの手順に沿って呼び出してください。
        </p>
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-slate-500">
          現在公開されているスキルはありません。管理者設定から公開してください。
        </p>
      ) : (
        Array.from(groups.entries()).map(([category, items]) => (
          <section key={category} className="mb-10">
            <h2 className="mb-4 text-lg font-semibold text-slate-700">
              {category}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
