"use client";

import React from "react";
import { Navbar, Footer, Badge, Button } from "@/components";
import { useLanguage } from "@/i18n";
import { Compass, MapPin, Layers } from "lucide-react";
import Link from "next/link";

export default function ExplorePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-sand text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center items-center text-center">
        <div className="max-w-xl mx-auto p-8 rounded-lg border border-line bg-white/60 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center mx-auto mb-4">
            <Compass className="w-6 h-6" />
          </div>

          <Badge variant="terracotta" size="sm" className="mb-3">
            {t.routes.explore.badge}
          </Badge>

          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink mb-3">
            {t.routes.explore.title}
          </h1>

          <p className="text-sm text-ink/70 mb-6 leading-relaxed">
            {t.routes.explore.subtitle}
          </p>

          <div className="p-3.5 rounded-lg border border-line bg-sand-50 text-xs text-ink/65 mb-6 flex items-center justify-center gap-2">
            <Layers className="w-4 h-4 text-terracotta shrink-0" />
            <span>{t.routes.explore.status}</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link href="/">
              <Button variant="outline" size="sm">
                ← {t.common.all}
              </Button>
            </Link>
            <Link href="/place/rani-ki-vav">
              <Button
                variant="primary"
                size="sm"
                icon={<MapPin className="w-3.5 h-3.5" />}
              >
                {t.common.viewDetails} (Rani ki Vav)
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer pageCode={t.footer.pageCodes.explore} />
    </div>
  );
}
