import "@/styles/globals.css";
import type { ReactNode } from "react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { cookies, headers } from "next/headers";

const SUPPORTED = ["en", "ja", "es", "it"] as const;
type Supported = (typeof SUPPORTED)[number];

function pickLocale(cookieLocale?: string, acceptLanguage?: string): Supported {
  const list = SUPPORTED as readonly string[];

  const fromCookie =
    cookieLocale && list.includes(cookieLocale)
      ? (cookieLocale as Supported)
      : undefined;

  const lang2 = acceptLanguage?.split(",")[0]?.slice(0, 2);
  const fromHeader =
    lang2 && list.includes(lang2) ? (lang2 as Supported) : undefined;

  return fromCookie ?? fromHeader ?? "en";
}

export default async function SigninLayout({
  children,
}: {
  children: ReactNode;
}) {
  const jar = await cookies();
  const hdrs = await headers();

  const cookieLoc = jar.get("NEXT_LOCALE")?.value;
  const accept = hdrs.get("accept-language") ?? "";
  const locale = pickLocale(cookieLoc, accept);

  let messages: AbstractIntlMessages;
  if (locale === "ja") {
    messages = (await import("@/messages/ja.json")).default;
  } else if (locale === "es") {
    messages = (await import("@/messages/es.json")).default;
  } else if (locale === "it") {
    messages = (await import("@/messages/it.json")).default;
  } else {
    messages = (await import("@/messages/en.json")).default;
  }

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
