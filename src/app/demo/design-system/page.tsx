import { VisualHeader, VisualFooter } from "@/components/visual/shell";
import { CTA, Checks, SectionTitle, Tag } from "@/components/visual/primitives";
export default function DesignSystemPage() {
  return (
    <div className="ps ps-public ps-design-system">
      <VisualHeader />
      <section>
        <Tag>POSTORY DESIGN SYSTEM · V1</Tag>
        <h1>
          One brand.
          <br />
          One consistent system.
        </h1>
        <p className="ds-guide-intro">
          统一字体、颜色、间距和组件。所有业务页面从同一套语义规格取值，不再为单张参考图单独缩放字号。
        </p>
      </section>
      <section>
        <SectionTitle
          title="Typography / 字体层级"
          body="营销与客户工作区使用明确的角色，响应式在统一断点调整。"
        />
        <div className="ds-guide-grid">
          <article>
            <span>Marketing H1 · 48 / 40 / 36 px</span>
            <h1>Your business. Our story.</h1>
          </article>
          <article>
            <span>Section H2 · 32 / 28 px</span>
            <h2>Social media made simple.</h2>
          </article>
          <article>
            <span>Card title · 18 px</span>
            <h3>A plan for your business</h3>
            <p>
              正文 16 px，行高
              1.6。让页面更容易阅读，也让不同页面的文字保持一致。
            </p>
            <small>辅助信息 12 px，保持清楚可读。</small>
          </article>
          <article className="ps-customer">
            <span>Workspace H1 / Panel H2 · 32 / 20 px</span>
            <h1>My Campaign</h1>
            <h2>Campaign Progress</h2>
            <p>工作区正文 14 px，适用于较紧凑的数据与操作区域。</p>
          </article>
        </div>
      </section>
      <section>
        <SectionTitle
          title="Color / 颜色"
          body="粉色与橙色延续品牌；中性色承担阅读层级，状态色表达含义。"
        />
        <div className="ds-guide-colors">
          {[
            ["Brand Pink", "--ds-brand", "#FF0086"],
            ["Orange", "--ds-orange", "#FF7A00"],
            ["Ink", "--ds-ink", "#101A44"],
            ["Muted", "--ds-muted", "#53617E"],
            ["Canvas", "--ds-canvas", "#F6F8FC"],
            ["Border", "--ds-border", "#E4E8F1"],
          ].map(([name, token, hex]) => (
            <article key={name}>
              <i style={{ background: `var(${token})` }} />
              <h3>{name}</h3>
              <small>{hex}</small>
            </article>
          ))}
        </div>
      </section>
      <section>
        <SectionTitle
          title="Components / 共用组件"
          body="按钮、标签、表单、卡片使用统一规格，包含悬停、焦点、禁用和错误状态。"
        />
        <div className="ds-guide-grid">
          <article>
            <h3>Buttons</h3>
            <div className="ps-actions">
              <CTA href="/assessment">Get Started</CTA>
              <CTA secondary href="/our-work">
                See Our Work
              </CTA>
              <button className="ps-button" disabled>
                Disabled
              </button>
            </div>
          </article>
          <article>
            <h3>Statuses</h3>
            <div className="ds-guide-statuses">
              <span className="ps-status ps-status-published">Published</span>
              <span className="ps-status ps-status-scheduled">Scheduled</span>
              <span className="ps-status ps-status-in-progress">
                In Progress
              </span>
            </div>
            <Checks
              items={["统一的状态色", "统一的 12 px 标签", "统一的圆角和留白"]}
            />
          </article>
          <article>
            <h3>Form controls</h3>
            <div className="ps-form">
              <label>
                Business Name
                <input placeholder="Your business name" />
              </label>
              <label>
                Business Type
                <select defaultValue="beauty">
                  <option value="beauty">Beauty & Wellness</option>
                  <option value="restaurant">Restaurant & Food</option>
                </select>
              </label>
            </div>
          </article>
          <article>
            <h3>Error state</h3>
            <div className="ps-form">
              <label>
                Email Address
                <input
                  aria-invalid="true"
                  type="email"
                  defaultValue="invalid-email"
                  aria-describedby="ds-error-example"
                />
              </label>
              <p id="ds-error-example" className="ps-error">
                Enter a valid email address.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section>
        <SectionTitle
          title="Spacing & Layout / 间距与布局"
          body="4 px 基础网格；主容器 1200 px，客户工作区 1280 px；手机边距 16 px。"
        />
        <div className="ds-guide-spaces">
          {[4, 8, 12, 16, 24, 32, 40, 48, 64].map((n) => (
            <div key={n}>
              <i style={{ width: n, height: 16 }} />
              <small>{n} px</small>
            </div>
          ))}
        </div>
        <div className="ps-actions">
          <CTA href="/">View Website</CTA>
          <CTA secondary href="/demo/dashboard">
            View Workspace
          </CTA>
        </div>
      </section>
      <VisualFooter />
    </div>
  );
}
