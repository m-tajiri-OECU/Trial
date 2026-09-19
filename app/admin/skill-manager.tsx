"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Skill } from "@/lib/types";

type EditableSkill = Skill & {
  tagsInput: string;
  howToUseInput: string;
  inputsInput: string;
};

function toEditable(skill: Skill): EditableSkill {
  return {
    ...skill,
    tagsInput: skill.tags.join(", "),
    howToUseInput: skill.howToUse.join("\n"),
    inputsInput: skill.inputs.join("\n"),
  };
}

export default function AdminSkillManager({
  initialSkills,
}: {
  initialSkills: Skill[];
}) {
  const router = useRouter();
  const [skills, setSkills] = useState<EditableSkill[]>(
    initialSkills.map(toEditable)
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function updateField(
    id: string,
    field: keyof EditableSkill,
    value: string
  ) {
    setSkills((prev) =>
      prev.map((skill) => (skill.id === id ? { ...skill, [field]: value } : skill))
    );
  }

  async function persist(id: string, patch: Partial<Skill>) {
    setSavingId(id);
    setMessage(null);

    const response = await fetch("/api/admin/skills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, patch }),
    });

    setSavingId(null);

    if (!response.ok) {
      setMessage("保存に失敗しました。再ログインが必要な可能性があります。");
      return;
    }

    const data = await response.json();
    setSkills((data.skills as Skill[]).map(toEditable));
    setMessage("保存しました。");
  }

  function handleToggle(skill: EditableSkill) {
    persist(skill.id, { enabled: !skill.enabled });
  }

  function handleSave(skill: EditableSkill) {
    persist(skill.id, {
      name: skill.name,
      category: skill.category,
      department: skill.department,
      summary: skill.summary,
      description: skill.description,
      tags: skill.tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      howToUse: skill.howToUseInput
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      inputs: skill.inputsInput
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    });
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-oecu-navy">スキル公開設定</h1>
          <p className="text-sm text-slate-600">
            一般利用者に公開するスキルの有効/無効や内容を管理します。
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          ログアウト
        </button>
      </div>

      {message && <p className="mb-4 text-sm text-oecu-teal">{message}</p>}

      <div className="space-y-6">
        {skills.map((skill) => (
          <div
            key={skill.id}
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    skill.enabled ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                <span className="font-mono text-xs text-slate-400">{skill.id}</span>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={skill.enabled}
                  onChange={() => handleToggle(skill)}
                  disabled={savingId === skill.id}
                />
                公開する
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm">
                スキル名
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={skill.name}
                  onChange={(e) => updateField(skill.id, "name", e.target.value)}
                />
              </label>
              <label className="text-sm">
                カテゴリ
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={skill.category}
                  onChange={(e) => updateField(skill.id, "category", e.target.value)}
                />
              </label>
              <label className="text-sm">
                担当部署
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={skill.department}
                  onChange={(e) => updateField(skill.id, "department", e.target.value)}
                />
              </label>
              <label className="text-sm">
                タグ(カンマ区切り)
                <input
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                  value={skill.tagsInput}
                  onChange={(e) => updateField(skill.id, "tagsInput", e.target.value)}
                />
              </label>
            </div>

            <label className="mt-4 block text-sm">
              概要
              <textarea
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                rows={2}
                value={skill.summary}
                onChange={(e) => updateField(skill.id, "summary", e.target.value)}
              />
            </label>

            <label className="mt-4 block text-sm">
              詳細説明
              <textarea
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                rows={3}
                value={skill.description}
                onChange={(e) => updateField(skill.id, "description", e.target.value)}
              />
            </label>

            <label className="mt-4 block text-sm">
              利用手順(1行1ステップ)
              <textarea
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                rows={3}
                value={skill.howToUseInput}
                onChange={(e) =>
                  updateField(skill.id, "howToUseInput", e.target.value)
                }
              />
            </label>

            <label className="mt-4 block text-sm">
              必要な入力(1行1項目)
              <textarea
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                rows={2}
                value={skill.inputsInput}
                onChange={(e) =>
                  updateField(skill.id, "inputsInput", e.target.value)
                }
              />
            </label>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleSave(skill)}
                disabled={savingId === skill.id}
                className="rounded bg-oecu-navy px-4 py-1.5 text-sm font-medium text-white hover:bg-oecu-teal disabled:opacity-60"
              >
                {savingId === skill.id ? "保存中..." : "内容を保存"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
