import fs from "fs";
import path from "path";
import type { BudgetAccount, ProcurementRules, StandardItem } from "./types";

function load<T>(file: string): T {
  const p = path.join(process.cwd(), "data", "procurement", file);
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

export const getRules = () => load<ProcurementRules>("rules.json");
export const getStandardItems = () => load<StandardItem[]>("standard-items.json");
export const getBudgets = () => load<BudgetAccount[]>("budgets.json");
