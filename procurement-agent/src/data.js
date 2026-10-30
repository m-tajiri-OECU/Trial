import { readFileSync } from "node:fs";

const dataDir = new URL("../data/", import.meta.url);
const load = (file) => JSON.parse(readFileSync(new URL(file, dataDir), "utf-8"));

// ファイルを編集すれば再起動なしで反映されるよう、毎回読み込む。
export const getRules = () => load("rules.json");
export const getStandardItems = () => load("standard-items.json");
export const getBudgets = () => load("budgets.json");
