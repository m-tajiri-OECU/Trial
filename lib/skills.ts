import fs from "fs";
import path from "path";
import type { Skill } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "skills.json");

export function getAllSkills(): Skill[] {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as Skill[];
}

export function getEnabledSkills(): Skill[] {
  return getAllSkills().filter((skill) => skill.enabled);
}

export function getSkillById(id: string): Skill | undefined {
  return getAllSkills().find((skill) => skill.id === id);
}

export function saveSkills(skills: Skill[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(skills, null, 2) + "\n", "utf-8");
}

export function updateSkill(id: string, patch: Partial<Omit<Skill, "id">>): Skill[] {
  const skills = getAllSkills();
  const index = skills.findIndex((skill) => skill.id === id);
  if (index === -1) {
    throw new Error(`Skill not found: ${id}`);
  }
  skills[index] = {
    ...skills[index],
    ...patch,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
  saveSkills(skills);
  return skills;
}
