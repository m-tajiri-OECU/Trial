import Link from "next/link";

export default function NavBar() {
  return (
    <header className="border-b border-oecu-mint bg-oecu-navy text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-wide">
          OECU スキル共有ポータル
        </Link>
        <nav className="flex gap-6 text-sm">
          <Link href="/" className="hover:text-oecu-mint">
            スキル一覧
          </Link>
          <Link href="/admin" className="hover:text-oecu-mint">
            管理者設定
          </Link>
        </nav>
      </div>
    </header>
  );
}
