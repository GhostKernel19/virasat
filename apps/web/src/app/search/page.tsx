"use client";

import React from "react";
import { Navbar, Footer, Badge, Button } from "@/components";
import { useLanguage } from "@/i18n";
import { Search, Filter, BookOpen } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-sand text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center items-center text-center">
        <div className="max-w-xl mx-auto p-8 rounded-lg border border-line bg-white/60 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-indigo/10 text-indigo flex items-center justify-center mx-auto mb-4">
            <Search className="w-6 h-6" />
          </div>

          <Badge variant="indigo" size="sm" className="mb-3">
            {t.routes.search.badge}
          </Badge>

          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink mb-3">
            {t.routes.search.title}
          </h1>

          <p className="text-sm text-ink/70 mb-6 leading-relaxed">
            {t.routes.search.subtitle}
          </p>

          {/* Search bar placeholder */}
          <div className="relative mb-6">
            <input
              type="text"
              readOnly
              placeholder={t.routes.search.placeholder}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-line bg-sand-50/80 text-xs text-ink/80 focus:outline-none cursor-not-allowed"
            />
            <Search className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="filter">{t.common.hasOcr}</Badge>
            <Badge variant="filter">{t.common.stepwells}</Badge>
            <Badge variant="filter">{t.common.forts}</Badge>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link href="/explore">
              <Button
                variant="outline"
                size="sm"
                icon={<Filter className="w-3.5 h-3.5" />}
              >
                {t.nav.explore}
              </Button>
            </Link>
            <Link href="/contribute">
              <Button
                variant="primary"
                size="sm"
                icon={<BookOpen className="w-3.5 h-3.5" />}
              >
                {t.nav.contribute}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer pageCode={t.footer.pageCodes.search} />
    </div>
  );
}
