import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ImagePlus, Sparkles } from "lucide-react";
import styles from "./demo-index.module.css";

export const metadata = {
  title: "选择行业体验 | PoStory",
  description: "免费体验 PoStory 的美甲与寿司行业社媒内容创作流程。",
};

const demos = [
  {
    href: "/demo/nails",
    name: "美甲工作室",
    english: "NAIL STUDIO",
    description: "上传美甲作品，填写预约档期，生成社媒图片。",
    image: "/demo/photos/nail-3.jpg",
    imageAlt: "秋日猫眼美甲作品",
    className: styles.nails,
  },
  {
    href: "/demo/sushi",
    name: "寿司餐厅",
    english: "SUSHI RESTAURANT",
    description: "上传寿司照片，编辑菜单文案，生成餐厅推广图片。",
    image: "/demo/photos/sushi-salmon-nigiri.png",
    imageAlt: "三文鱼寿司料理",
    className: styles.sushi,
  },
];

export default function DemoIndexPage() {
  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <Image
            src="/brand/postory-website-logo-480.png"
            alt="PoStory"
            width={240}
            height={80}
            priority
            className={styles.logo}
          />
          <span className={styles.demoTag}>免费体验</span>
        </header>

        <section className={styles.intro}>
          <p className={styles.eyebrow}>POSTORY INDUSTRY DEMOS</p>
          <h1>选择一个行业开始体验</h1>
          <p className={styles.lede}>
            亲自走一遍从上传作品到生成社媒图片的流程。
            <br className={styles.desktopBreak} />
            无需注册，几分钟即可完成。
          </p>
        </section>

        <section className={styles.grid} aria-label="选择行业">
          {demos.map((demo) => (
            <Link
              href={demo.href}
              className={`${styles.card} ${demo.className}`}
              key={demo.href}
            >
              <div className={styles.photo}>
                <Image
                  src={demo.image}
                  alt={demo.imageAlt}
                  fill
                  sizes="(max-width: 680px) 100vw, 50vw"
                  className={styles.photoImage}
                />
                <span className={styles.industryTag}>{demo.english}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardCopy}>
                  <h2>{demo.name}</h2>
                  <p>{demo.description}</p>
                </div>
                <span className={styles.action} aria-hidden="true">
                  开始体验 <ArrowRight size={18} />
                </span>
              </div>
            </Link>
          ))}
        </section>

        <div className={styles.steps}>
          <span><ImagePlus size={16} /> 上传作品</span>
          <i />
          <span><CalendarDays size={16} /> 填写内容</span>
          <i />
          <span><Sparkles size={16} /> 生成图片</span>
        </div>
      </div>
    </main>
  );
}
