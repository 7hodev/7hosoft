"use client";

import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Building2,
  CheckCircle,
  ChevronRight,
  Clock,
  Cloud,
  CreditCard,
  Globe,
  Layers,
  LayoutDashboard,
  Smartphone,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/home/site-header";
import { type Language, translations } from "@/lib/i18n/translations";

export default function Home() {
  const [language, setLanguage] = useState<Language>("es");
  const t = translations[language];

  return (
    <div>
      <SiteHeader language={language} onLanguageChange={setLanguage} t={t} />
      <main className="flex-1">
        {/* Añadir el componente de fondo animado al hero section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background z-0 opacity-90"></div>
          <div className="absolute inset-0 z-0">
            <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-secondary/5 rounded-full blur-2xl"></div>
            <div className="absolute top-1/3 left-1/4 w-24 h-24 bg-accent/10 rounded-full blur-xl"></div>
            <div className="hidden md:block absolute top-1/4 right-1/3 w-64 h-64 border border-primary/20 rounded-full"></div>
            <div className="hidden md:block absolute bottom-1/4 left-1/3 w-40 h-40 border border-secondary/10 rounded-full"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMTEiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
          </div>
          <div className="container relative z-10">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-6xl/none">
                  La solución <span className="gradient-text">completa</span>{" "}
                  para la gestión de tu empresa
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-base md:text-xl">
                  Accede desde cualquier dispositivo, en cualquier momento y
                  lugar. Todo lo que necesitas para hacer crecer tu negocio en
                  una sola plataforma.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white w-full sm:w-auto"
                    >
                      Comenzar ahora
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    size="lg"
                    variant="outline"
                    className="hidden lg:block border-primary/20 hover:bg-primary/5 w-full sm:w-auto"
                  >
                    Ver demostración
                  </Button>
                </div>
              </div>
              <div className="relative mt-8 lg:mt-0 hidden lg:block">
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-70 blur"></div>
                <div className="relative rounded-xl border bg-background p-1 shadow-xl">
                  <Image
                    src="/placeholder.svg?height=600&width=600"
                    width={600}
                    height={600}
                    alt="Dashboard de 7hoSoft"
                    className="rounded-lg"
                  />
                </div>
              </div>
              {/* Versión móvil de la imagen */}
              <div className="relative mt-8 lg:hidden">
                <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary to-secondary opacity-70 blur"></div>
                <div className="relative rounded-xl border bg-background p-1 shadow-xl">
                  <Image
                    src="/placeholder.svg?height=400&width=400"
                    width={400}
                    height={300}
                    alt="Dashboard de 7hoSoft"
                    className="rounded-lg w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
        >
          <div className="container">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Una suite completa de herramientas
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Diseñada para hacer crecer tu negocio con todas las
                  funcionalidades que necesitas en un solo lugar.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {[
                {
                  icon: <LayoutDashboard className="h-10 w-10 text-primary" />,
                  title: "Dashboard intuitivo",
                  description:
                    "Visualiza todos los datos importantes de tu negocio en un solo lugar con gráficos interactivos.",
                },
                {
                  icon: <CreditCard className="h-10 w-10 text-primary" />,
                  title: "Gestión financiera",
                  description:
                    "Controla tus ingresos, gastos, facturas y pagos de forma sencilla y eficiente.",
                },
                {
                  icon: <Users className="h-10 w-10 text-primary" />,
                  title: "Gestión de clientes",
                  description:
                    "Administra tu cartera de clientes, historial de compras y comunicaciones en un solo lugar.",
                },
                {
                  icon: <BarChart3 className="h-10 w-10 text-primary" />,
                  title: "Informes avanzados",
                  description:
                    "Genera informes detallados y personalizables para tomar decisiones basadas en datos.",
                },
                {
                  icon: <Clock className="h-10 w-10 text-primary" />,
                  title: "Automatización",
                  description:
                    "Automatiza tareas repetitivas y flujos de trabajo para ahorrar tiempo y reducir errores.",
                },
                {
                  icon: <Building2 className="h-10 w-10 text-primary" />,
                  title: "Gestión de inventario",
                  description:
                    "Controla tu stock, proveedores y pedidos con un sistema completo de gestión de inventario.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="feature-card group relative overflow-hidden rounded-lg border bg-background p-6 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                >
                  <div className="absolute top-0 right-0 h-20 w-20 bg-primary/10 rounded-bl-full transform translate-x-10 -translate-y-10 group-hover:translate-x-8 group-hover:-translate-y-8 transition-transform duration-300"></div>
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="benefits"
          className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tl from-primary/10 via-background to-background z-0"></div>
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMTEiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-accent/5 rounded-full blur-xl"></div>
            <div className="hidden lg:block absolute top-20 left-20 w-72 h-72 border border-primary/10 rounded-full"></div>
          </div>
          <div className="container relative z-10 px-4 sm:px-6">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl md:text-4xl lg:text-5xl">
                  ¿Por qué elegir <span className="gradient-text">7hoSoft</span>
                  ?
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      icon: <Globe className="h-5 w-5 text-primary" />,
                      title: "Acceso desde cualquier lugar",
                      description:
                        "Trabaja desde donde quieras, cuando quieras, con acceso completo a todos tus datos.",
                    },
                    {
                      icon: <Cloud className="h-5 w-5 text-primary" />,
                      title: "En la nube",
                      description:
                        "Sin instalaciones complicadas. Tus datos siempre seguros y actualizados en la nube.",
                    },
                    {
                      icon: <Smartphone className="h-5 w-5 text-primary" />,
                      title: "Multiplataforma",
                      description:
                        "Disponible en todos tus dispositivos: ordenador, tablet y móvil.",
                    },
                    {
                      icon: <CheckCircle className="h-5 w-5 text-primary" />,
                      title: "Fácil de usar",
                      description:
                        "Interfaz intuitiva diseñada para que puedas empezar a trabajar sin complicaciones.",
                    },
                  ].map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 sm:gap-4"
                    >
                      <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                        {benefit.icon}
                      </div>
                      <div>
                        <h3 className="font-bold text-base sm:text-lg">
                          {benefit.title}
                        </h3>
                        <p className="text-muted-foreground text-sm sm:text-base">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative mt-8 lg:mt-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 to-secondary/20 opacity-70 blur-xl"></div>
                <div className="relative rounded-xl border bg-background p-2 shadow-xl">
                  <Image
                    src="/placeholder.svg?height=600&width=800"
                    width={800}
                    height={600}
                    alt="7hoSoft en diferentes dispositivos"
                    className="rounded-lg w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="testimonials"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/30"
        >
          <div className="container">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  ¿Cómo 7hoSoft ayuda a tu negocio?
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Descubre cómo nuestra plataforma simplifica la gestión y
                  mejora la eficiencia en diferentes escenarios.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {[
                {
                  escenario: "Emprendedores y Freelancers",
                  beneficio:
                    "Menos caos, más productividad. Lleva tus clientes, tareas y facturación en un solo lugar",
                },
                {
                  escenario: "Pequeñas y Medianas Empresas",
                  beneficio:
                    "Optimiza tu negocio sin esfuerzo. Gestiona equipos, ventas e inventarios con total control.",
                },
                {
                  escenario: "Tiendas y Comercios",
                  beneficio:
                    "Vende más, administra mejor. Controla stock, pagos y fideliza clientes fácilmente.",
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="relative rounded-xl border bg-background p-6 shadow-sm"
                >
                  <div className="absolute top-0 right-0 -mt-2 -mr-2">
                    <div className="rounded-full bg-primary/10 p-2">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="text-primary"
                      >
                        <path
                          d="M9.17 6C9.58 6 9.95 6.15 10.24 6.44C10.54 6.73 10.69 7.1 10.69 7.5C10.69 7.9 10.54 8.27 10.24 8.56C9.95 8.86 9.58 9 9.17 9C8.77 9 8.4 8.86 8.1 8.56C7.81 8.27 7.67 7.9 7.67 7.5C7.67 7.1 7.81 6.73 8.1 6.44C8.4 6.15 8.77 6 9.17 6ZM14.83 6C15.23 6 15.6 6.15 15.9 6.44C16.19 6.73 16.33 7.1 16.33 7.5C16.33 7.9 16.19 8.27 15.9 8.56C15.6 8.86 15.23 9 14.83 9C14.43 9 14.06 8.86 13.77 8.56C13.48 8.27 13.33 7.9 13.33 7.5C13.33 7.1 13.48 6.73 13.77 6.44C14.06 6.15 14.43 6 14.83 6ZM9.17 15C9.58 15 9.95 15.15 10.24 15.44C10.54 15.73 10.69 16.1 10.69 16.5C10.69 16.9 10.54 17.27 10.24 17.56C9.95 17.86 9.58 18 9.17 18C8.77 18 8.4 17.86 8.1 17.56C7.81 17.27 7.67 16.9 7.67 16.5C7.67 16.1 7.81 15.73 8.1 15.44C8.4 15.15 8.77 15 9.17 15ZM14.83 15C15.23 15 15.6 15.15 15.9 15.44C16.19 15.73 16.33 16.1 16.33 16.5C16.33 16.9 16.19 17.27 15.9 17.56C15.6 17.86 15.23 18 14.83 18C14.43 18 14.06 17.86 13.77 17.56C13.48 17.27 13.33 16.9 13.33 16.5C13.33 16.1 13.48 15.73 13.77 15.44C14.06 15.15 14.43 15 14.83 15Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl mb-4 font-bold">
                    {testimonial.escenario}
                  </h3>
                  <p className="italic text-muted-foreground">
                    {testimonial.beneficio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0"></div>
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-0 w-full h-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 1200 1200"
                className="opacity-10"
              >
                <defs>
                  <linearGradient
                    id="grad1"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--primary)"
                      stopOpacity="0.1"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--primary)"
                      stopOpacity="0.05"
                    />
                  </linearGradient>
                </defs>
                <path
                  d="M0,800 C300,683 400,650 500,450 C600,250 700,100 1200,100 L1200,1200 L0,1200 Z"
                  fill="url(#grad1)"
                />
                <path
                  d="M0,1000 C200,900 400,850 550,700 C700,550 750,400 1200,400 L1200,1200 L0,1200 Z"
                  fill="url(#grad1)"
                  opacity="0.5"
                />
              </svg>
            </div>
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          </div>
          <div className="container relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Elige el plan que mejor se adapte a tu negocio
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Ofrecemos diferentes planes para adaptarnos a las necesidades
                  de cada empresa.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {[
                {
                  name: "Básico",
                  price: "Free",
                  description: "Ideal para autónomos, contadores y pequeñas empresas",
                  features: [
                    "Gestión de finanzas",
                    "Registro básico de ingresos y gastos",
                    "Una sucursal",
                    "Generación de facturas",
                    "Presupuestos personalizados",
                    "Gráficos y estadísticas",
                  ],
                  cta: "Comenzar gratis",
                  popular: false,
                },
                {
                  name: "Profesional",
                  price: "$19.99",
                  description: "Perfecto para empresas en crecimiento y contadores avanzados",
                  features: [
                    "Todas las funciones del plan Básico",
                    "5 sucursales",
                    "Gestión de clientes",
                    "Escaneo de facturas, 100 facturas/mes",
                    "Exportación e importación de reportes",
                    "Análisis básico de datos",
                  ],
                  cta: "Comenzar ahora",
                  popular: true,
                },
                {
                  name: "Empresarial",
                  price: "$39.99",
                  description: "Para empresas con necesidades avanzadas",
                  features: [
                    "Todas las funciones del plan Profesional",
                    "10 Sucursales",
                    "Gestión de inventario",
                    "Gestión de personal",
                    "Escaneo de facturas, 500 facturas/mes",
                    "Insights y predicciones avanzada con IA",
                  ],
                  cta: "Comenzar ahora",
                  popular: false,
                },
              ].map((plan, index) => (
                <div
                  key={index}
                  className={`flex flex-col justify-between relative rounded-xl border ${plan.popular ? "border-primary" : "border-border"} bg-background p-6 shadow-sm ${plan.popular ? "ring-2 ring-primary" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 -mt-3 -mr-3">
                      <div className="rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground">
                        Más popular
                      </div>
                    </div>
                  )}
                  <div className="">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                      <p className="text-muted-foreground">
                        {plan.description}
                      </p>
                    </div>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/mes</span>
                    </div>
                    <ul className="mb-6 space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-primary mr-2" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className={`w-full ${plan.popular ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 relative overflow-hidden animated-gradient">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-background z-0"></div>
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMxMTEiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-background to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-12 left-12 w-48 h-48 bg-primary/5 rounded-full blur-xl"></div>
          </div>
          <div className="container relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Listo para transformar tu negocio
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Únete a miles de empresas que ya confían en <span className="text-primary">7hoSoft</span> para
                  gestionar su día a día.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    Comenzar ahora
                  </Button>
                </Link>
                <Button size="lg" variant="outline">
                  Contactar con ventas
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4 md:h-24">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">7hoSoft</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            <Link
              href="#"
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
            >
              Términos y condiciones
            </Link>
            <Link
              href="#"
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
            >
              Política de privacidad
            </Link>
            <Link
              href="#"
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
            >
              Contacto
            </Link>
            <Link
              href="#"
              className="text-xs md:text-sm text-muted-foreground hover:text-foreground"
            >
              Blog
            </Link>
          </div>
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} 7hoSoft. Todos los derechos
            reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
