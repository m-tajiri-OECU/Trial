import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isAuthorized } from "@/lib/admin-auth";
import { getAllSkills, updateSkill } from "@/lib/skills";

function checkAuth(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return isAuthorized(token);
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "認証が必要です。" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, skills: getAllSkills() });
}

export async function PATCH(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ ok: false, error: "認証が必要です。" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id;
  const patch = body?.patch;

  if (typeof id !== "string" || typeof patch !== "object" || patch === null) {
    return NextResponse.json({ ok: false, error: "不正なリクエストです。" }, { status: 400 });
  }

  try {
    const skills = updateSkill(id, patch);
    return NextResponse.json({ ok: true, skills });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 404 }
    );
  }
}
