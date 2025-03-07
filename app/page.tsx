"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  BarChart3,
  Building2,
  ChartSpline,
  Clock,
  DollarSign,
  Users2,
  Warehouse,
  Zap,
  Rocket,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createContext, useState } from "react";
import { SiteHeader } from "@/components/home/site-header";
import { type Language, translations } from "@/lib/i18n/translations";
import { MessagesSquare } from "lucide-react";

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const t = translations[language];

  return (
    <main className="flex-1">
      <SiteHeader language={language} onLanguageChange={setLanguage} t={t} />
      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 z-0">
          <Image
            src="/placeholder.svg"
            alt="Business Management"
            fill
            className="object-cover brightness-[0.7]"
            priority
          />
        </div>
        <div className="relative z-10 flex min-h-[80vh] items-center justify-center">
          <div className="container px-6 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none max-w-3xl mx-auto">
                  {t.hero.title}
                </h1>
                <p className="max-w-[600px] md:text-xl mx-auto">
                  {t.hero.subtitle}
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg" className="w-full min-[400px]:w-auto">
                  <Link href="/sign-up">
                    {t.hero.cta.try}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-[400px]:w-auto bg-white/10 hover:bg-white/20"
                >
                  <Link href="#demo">{t.hero.cta.demo}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/50 dark:bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                {t.features.title}
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl">
                {t.features.subtitle}
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-3">
            {[
              { icon: <DollarSign />, key: "sales" },
              { icon: <Warehouse />, key: "inventory" },
              { icon: <Users2 />, key: "clients" },
              { icon: <Clock />, key: "staff" },
              { icon: <BarChart3 />, key: "analytics" },
              { icon: <Building2 />, key: "multistore" },
            ].map(({ icon, key }) => (
              <div
                key={key}
                className="relative overflow-hidden rounded-lg border bg-card p-2"
              >
                <div className="flex h-[180px] flex-col justify-between rounded-md p-6">
                  <div className="h-10 w-10 text-primary">{icon}</div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold">
                      {
                        t.features.items[key as keyof typeof t.features.items]
                          .title
                      }
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {
                        t.features.items[key as keyof typeof t.features.items]
                          .description
                      }
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background dark:bg-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-4">
            <div className="flex flex-col items-center justify-center space-y-2 gap-4">
              <Rocket className="lg:w-12 lg:h-12 w-10 h-10" />
              <h4 className="lg:text-lg text-sm text-center font-bold">
                {t.stats.companies.label}
              </h4>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 gap-4">
              <ChartSpline className="lg:w-12 lg:h-12 w-10 h-10" />
              <h4 className="lg:text-lg text-sm text-center font-bold">
                {t.stats.uptime.label}
              </h4>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 gap-4">
              <MessagesSquare className="lg:w-12 lg:h-12 w-10 h-10" />
              <h4 className="lg:text-lg text-sm text-center font-bold">
                {t.stats.users.label}
              </h4>
            </div>
            <div className="flex flex-col items-center justify-center space-y-2 gap-4">
              <Zap className="lg:w-12 lg:h-12 w-10 h-10" />
              <h4 className="lg:text-lg text-sm text-center font-bold">
                {t.stats.support.label}
              </h4>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 border-t bg-secondary/50 dark:bg-secondary">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                {t.cta.title}
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl">
                {t.cta.subtitle}
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">{t.cta.start}</Link>
              </Button>
              <Button variant="outline" size="lg">
                <Link href="#contacto">{t.cta.contact}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
