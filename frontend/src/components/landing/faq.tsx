"use client";

import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    q: "Ro'yxatdan o'tish bepulmi?",
    a: "Ha, ro'yxatdan o'tish va asosiy funksiyalar (qidiruv, ko'rish, asosiy chat) butunlay bepul. PRO obuna esa cheksiz imkoniyatlarni ochadi.",
  },
  {
    q: "HEMIS bilan qanday integratsiyalashasiz?",
    a: "Talaba HEMIS hisobi orqali kirsa, universitet, kurs va guruh ma'lumotlari avtomatik tasdiqlanadi. Soxta hisoblar yaratish mumkin emas.",
  },
  {
    q: "To'lov xavfsizmi?",
    a: "Ha. Biz Click, Payme, Uzum va Paynet kabi litsenziyalangan to'lov tizimlari bilan ishlaymiz. Bundan tashqari 24 soat ichida refund kafolati mavjud.",
  },
  {
    q: "Agar uy aytilganidek bo'lmasa nima qilaman?",
    a: "Joylashgandan keyin 24 soat ichida shikoyat qilishingiz mumkin — bizning kuratorlar holatni tekshiradi va to'lovni qaytarib beradi.",
  },
  {
    q: "Uy egasi sifatida qancha e'lon joylashim mumkin?",
    a: "Bepul rejada 1 ta e'lon joylash mumkin. PRO obuna bilan cheksiz e'lon, TOP'ga chiqarish va to'liq statistika ochiladi.",
  },
  {
    q: "PRO obunani qanday bekor qilish mumkin?",
    a: "Profil → Obuna sahifasidan istalgan vaqtda bekor qilish mumkin. Joriy davr tugaguncha PRO funksiyalardan foydalanasiz.",
  },
  {
    q: "Kuratorlar kim?",
    a: "Universitetlar tomonidan tayinlangan rasmiy xodimlar bo'lib, talabalar bilan bog'lanib turadi va har qanday muammoda yordam beradi.",
  },
  {
    q: "Telefon raqamim ko'rinadimi?",
    a: "PRO bo'lmagan foydalanuvchilar bir-birining telefonini ko'ra olmaydi — barchasi chat orqali bog'lanadi. PRO obuna kontaktni ochadi.",
  },
];

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="container mx-auto max-w-4xl px-4 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <HelpCircle className="h-3 w-3" /> Tez-tez so&apos;raladi
        </span>
        <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
          Savollaringizga <span className="text-gradient-brand">javob</span>
        </h2>
        <p className="mt-4 text-muted-foreground">
          Eng ko&apos;p so&apos;ralgan savollar. Boshqa savollar uchun bizga yozing.
        </p>
      </div>

      <div className="mt-12 space-y-3">
        {faqs.map((f, idx) => {
          const open = openIdx === idx;
          return (
            <div
              key={f.q}
              className={`overflow-hidden rounded-2xl border bg-card transition ${
                open ? "shadow-md ring-1 ring-primary/20" : "hover:shadow-sm"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : idx)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-base font-semibold">{f.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                    open ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="border-t px-5 py-4 text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
