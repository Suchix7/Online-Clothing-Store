import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Shirt,
  ShieldCheck,
  Truck,
  Leaf,
  Sparkles,
  Users,
  Recycle,
} from "lucide-react";
import Navbar from "../components/navbar";

export default function AboutUs() {
  const features = [
    {
      icon: <Shirt className="h-6 w-6" />,
      title: "Everyday Style",
      text: "Clothing that combines comfort and style for every occasion.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6" />,
      title: "Quality First",
      text: "Premium fabrics and craftsmanship designed to last.",
    },
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Fast Delivery",
      text: "Quick shipping with easy returns and exchanges.",
    },
    {
      icon: <Leaf className="h-6 w-6" />,
      title: "Eco-Friendly",
      text: "Sustainable sourcing and packaging to reduce impact.",
    },
  ];

  const values = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: "Design with Purpose",
      text: "We create versatile pieces that blend seamlessly into your wardrobe.",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Community First",
      text: "We value strong relationships with our customers and partners.",
    },
    {
      icon: <Recycle className="h-5 w-5" />,
      title: "Sustainability",
      text: "Constantly improving our environmental footprint with better practices.",
    },
  ];

  const milestones = [
    {
      year: "2015",
      title: "The Beginning",
      body: "Started as a boutique drop of tees and hoodies—fewer, better pieces.",
    },
    {
      year: "2018",
      title: "Scaling Essentials",
      body: "Expanded core fits based on customer feedback and repeat demand.",
    },
    {
      year: "2021",
      title: "Better Materials",
      body: "Shifted to heavier cotton blends and introduced recycled packaging.",
    },
    {
      year: "2024",
      title: "Community-Led",
      body: "Launched size guides, restock alerts, and improved support.",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white">
      <Navbar />
      {/* Spacer for fixed navbar */}
      <div className="mt-16 lg:mt-16" />

      {/* HERO — brighter, on-brand yellow/orange block */}
      <section className="relative overflow-hidden">
        {/* Solid background with subtle pattern accents */}
        <div className="absolute inset-0 -z-10 bg-amber-100" />
        {/* floating shapes */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-amber-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-orange-300/20 blur-2xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-5xl px-6 pt-10 pb-12 md:px-8 lg:px-12 lg:pt-14"
        >
          <Badge className="rounded-full px-3 py-1 text-xs bg-orange-600 hover:bg-orange-600 text-white">
            About Us
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-orange-900">
            Our Story in Fashion
          </h1>
          <p className="mt-4 max-w-2xl text-orange-950/80">
            Born from a passion for fashion and sustainability, we started as a
            small boutique in 2015 with one goal: to make everyday clothing that
            balances comfort, durability, and style. Today, we continue to
            deliver collections that speak to individuality while caring for our
            planet.
          </p>

          {/* quick stats bar */}
          <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
            {[
              { k: "+200k", v: "Orders Shipped" },
              { k: "50+", v: "Styles/Year" },
              { k: "2015", v: "Since" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-xl border border-orange-200/70 bg-amber-50 px-4 py-3 text-sm text-orange-900 shadow-sm"
              >
                <p className="text-base font-semibold">{s.k}</p>
                <p className="opacity-80">{s.v}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-6xl px-6 py-8 md:px-8 lg:px-12 lg:py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="h-full rounded-2xl border-orange-100 bg-white">
                <CardHeader className="flex flex-row items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-orange-700">
                    {f.icon}
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-zinc-600">
                  {f.text}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* VALUES */}
      <section className="mx-auto max-w-6xl px-6 pb-8 md:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-orange-100">
            <CardHeader>
              <CardTitle>What We Believe In</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {values.map((v, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-orange-700">
                    {v.icon}
                  </div>
                  <div>
                    <p className="font-medium">{v.title}</p>
                    <p className="text-sm text-zinc-600">{v.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Support/Assurance card to balance the grid */}
          <Card className="rounded-2xl border-orange-100">
            <CardHeader>
              <CardTitle>Our Promise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-700">
              <p>
                Easy 7-day exchanges • 1-year quality support • Ethical
                suppliers
              </p>
              <p>
                Transparent pricing • Locally-packed orders • Responsive chat
                support
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* HISTORY — moved to its own full-width timeline section */}
      <section id="history" className="relative py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 " />
        <div className="mx-auto max-w-5xl px-6 md:px-8 lg:px-12">
          <div className="mb-8 flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-orange-600 px-3 py-1 text-xs font-medium text-white">
              Timeline
            </span>
            <h2 className="text-2xl font-semibold text-orange-900">
              History & Milestones
            </h2>
          </div>

          <ol className="relative ms-3 border-s-2 border-orange-200 ps-6">
            {milestones.map((m, idx) => (
              <motion.li
                key={m.year}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className="mb-8"
              >
                <div className="absolute -start-[11px] mt-1 h-4 w-4 rounded-full border-2 border-orange-400 bg-white" />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-orange-600 px-2 py-0.5 text-xs font-medium text-white">
                    {m.year}
                  </span>
                  <p className="text-sm font-semibold text-orange-900">
                    {m.title}
                  </p>
                </div>
                <p className="mt-1 text-sm text-zinc-700">{m.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
