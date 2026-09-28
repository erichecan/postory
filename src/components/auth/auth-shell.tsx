import Image from "next/image";
import { Logo } from "@/components/brand/logo";

const SHOWCASE = [
  "/assets/templates/orshot/orshot-2444-1.png",
  "/assets/templates/orshot/orshot-2427-1.png",
  "/assets/templates/orshot/orshot-2439-1.png",
  "/assets/templates/orshot/orshot-2354-1.png",
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col p-6 sm:p-10">
        <Logo href="/" />
        <div className="flex flex-1 items-center justify-center py-10">{children}</div>
      </div>
      <div className="relative hidden overflow-hidden bg-sidebar lg:block">
        <div className="absolute inset-0 grid grid-cols-2 gap-4 p-10 opacity-90">
          {SHOWCASE.map((src, i) => (
            <div key={src} className={`relative overflow-hidden rounded-2xl ${i % 2 ? "mt-16" : ""}`}>
              <Image src={src} alt="" fill sizes="25vw" className="object-cover" priority={i < 2} />
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-sidebar via-sidebar/90 to-transparent p-10 pt-32">
          <p className="text-2xl font-semibold">167 套社交媒体模板，改几个字就能发。</p>
          <p className="mt-2 text-muted-foreground">Instagram、小红书、朋友圈、YouTube 封面，一个地方搞定。</p>
        </div>
      </div>
    </div>
  );
}
