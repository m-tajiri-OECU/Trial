import Link from "next/link";
import type { Skill } from "@/lib/types";

export default function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link
      href={`/skills/${skill.id}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-oecu-teal hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-oecu-mint px-3 py-1 text-xs font-medium text-oecu-navy">
          {skill.category}
        </span>
        <span className="text-xs text-slate-400">更新日: {skill.updatedAt}</span>
      </div>
      <h3 className="mb-1 text-lg font-semibold text-oecu-navy">{skill.name}</h3>
      <p className="mb-3 text-sm text-slate-600">{skill.summary}</p>
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
    </Link>
  );
}
