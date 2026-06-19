import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Image src="/logo.png" alt="TTJ" width={36} height={36} />
              <span>TTJ Platforma</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              O&apos;zbekistondagi talabalar uchun xavfsiz va qulay ijara platformasi.
            </p>
            <div className="mt-4 flex gap-2">
              {["Click", "Payme", "Uzum", "Paynet"].map((p) => (
                <span
                  key={p}
                  className="rounded-md border bg-background px-2 py-1 text-[11px] font-semibold"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>

          <FooterCol
            title="Talabalar uchun"
            links={[
              { label: "Uylarni ko'rish", href: "/houses" },
              { label: "HEMIS orqali kirish", href: "/login" },
              { label: "Bron qilish", href: "/houses" },
              { label: "PRO obuna", href: "/#pricing" },
            ]}
          />
          <FooterCol
            title="Uy egalari uchun"
            links={[
              { label: "E'lon joylash", href: "/register" },
              { label: "Daromad hisoblash", href: "/#pricing" },
              { label: "Uy egasi PRO", href: "/#pricing" },
              { label: "Yordam", href: "#" },
            ]}
          />
          <FooterCol
            title="Aloqa"
            customContent={
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> +998 99 999 99 99
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> info@ttj-platforma.uz
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4" />
                  <span>Toshkent sh., Mirzo Ulug&apos;bek tumani</span>
                </li>
              </ul>
            }
          />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} TTJ Platforma. Barcha huquqlar himoyalangan.</p>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-foreground">Maxfiylik siyosati</Link>
            <Link href="#" className="hover:text-foreground">Foydalanish shartlari</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
  customContent,
}: {
  title: string;
  links?: { label: string; href: string }[];
  customContent?: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-semibold">{title}</h4>
      {customContent ?? (
        <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
          {links?.map((l) => (
            <li key={l.label}>
              <Link href={l.href} className="hover:text-foreground">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
