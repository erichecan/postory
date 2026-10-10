import Link from "next/link";
import { REFERENCE_PAGES } from "@/components/demo/fidelity/pages";
import "@/components/demo/fidelity/fidelity.css";

export default function DemoReview() {
  return <main className="fd-demo-index">
    <h1>PoStory · 19 页设计对照</h1>
    <p>左侧为原稿，右侧为浏览器实际截图。点击页面名称打开可操作演示。所有工作室、账号和发布记录均为演示数据。</p>
    <div className="fd-demo-index-grid">
      {REFERENCE_PAGES.map(r => <article className="fd-review-card" key={r.id}>
        <Link href={`/demo/${r.industry}${r.page === "landing" ? "" : `/${r.page}`}?reference=1`}>{String(r.id).padStart(2, "0")} · {r.label} →</Link>
        <div className="fd-review-pair">
          <figure><figcaption>设计稿</figcaption>{/* eslint-disable-next-line @next/next/no-img-element */}<img loading="lazy" src={`/demo/review/${String(r.id).padStart(2,"0")}-reference.webp`} alt={`${r.label}原稿`} /></figure>
          <figure><figcaption>实际页面</figcaption>{/* eslint-disable-next-line @next/next/no-img-element */}<img loading="lazy" src={`/demo/review/${String(r.id).padStart(2,"0")}-current.webp`} alt={`${r.label}实际页面截图`} /></figure>
        </div>
        <details><summary>查看透明叠加对照</summary>{/* eslint-disable-next-line @next/next/no-img-element */}<img loading="lazy" src={`/demo/review/${String(r.id).padStart(2,"0")}-overlay.jpg`} alt={`${r.label}透明叠加对照`} /></details>
      </article>)}
    </div>
  </main>;
}
