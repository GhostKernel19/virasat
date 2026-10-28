"use client";

import React from "react";
import { Navbar, Footer, Badge, Button } from "@/components";
import { useLanguage } from "@/i18n";
import { PlusCircle, UploadCloud, MapPin } from "lucide-react";
import Link from "next/link";

export default function ContributePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col bg-sand text-ink">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col justify-center items-center text-center">
        <div className="max-w-xl mx-auto p-8 rounded-lg border border-line bg-white/60 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-green/10 text-green flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="w-6 h-6" />
          </div>

          <Badge variant="ocr" size="sm" className="mb-3">
            {t.routes.contribute.badge}
          </Badge>

          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink mb-3">
            {t.routes.contribute.title}
          </h1>

          <p className="text-sm text-ink/70 mb-6 leading-relaxed">
            {t.routes.contribute.subtitle}
          </p>

          <div className="border border-dashed border-line-dark rounded-lg p-6 bg-sand-50/50 mb-6 flex flex-col items-center justify-center">
            <UploadCloud className="w-8 h-8 text-ink/40 mb-2" />
            <span className="text-xs font-medium text-ink/70">
              Contribution pipeline placeholder
            </span>
            <span className="text-[11px] text-ink/50 mt-1">
              Supports GeoTIFF, archival imagery, and OCR transcriptions in next milestone.
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Link href="/explore">
              <Button
                variant="outline"
                size="sm"
                icon={<MapPin className="w-3.5 h-3.5" />}
              >
                {t.nav.explore}
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              disabled
              icon={<PlusCircle className="w-3.5 h-3.5" />}
            >
              {t.routes.contribute.cta}
            </Button>
          </div>
        </div>
      </main>

      <Footer pageCode={t.footer.pageCodes.contribute} />
    </div>
  );
}
