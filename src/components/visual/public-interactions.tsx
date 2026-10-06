"use client";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { Photo, Platform } from "./primitives";
export const demoTitles: Record<string, string[]> = {
  beauty: [
    "Facial Service Highlight",
    "Before & After",
    "Studio Tour Video",
    "Spring Promotion",
    "Skincare Tips",
    "Client Story",
    "Product Feature",
    "Treatment Process",
    "Education Post",
    "Lash Extensions",
    "Holiday Campaign",
    "Book Now Reminder",
  ],
  restaurant: [
    "Signature Dish",
    "New Menu Item",
    "Behind the Scenes",
    "Promotion",
    "Restaurant Atmosphere",
    "Customer Favourite",
    "Chef Story",
    "Customer Story",
    "Happy Hour",
    "Menu Highlight",
    "Spring Ambiance",
    "Seasonal Drinks",
  ],
  contractor: [
    "Before & After",
    "Quick Tips Video",
    "Kitchen Renovation",
    "Spring Promotion",
    "Roof Repair Process",
    "Deck Transformation",
    "Home Maintenance Tips",
    "Customer Testimonial",
    "Project Highlight",
    "Educational Post",
    "Service Showcase",
    "Client Story Video",
  ],
};
export function DemoGallery({ industry }: { industry: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<number | null>(null);
  const titles = demoTitles[industry] || demoTitles.beauty;
  const platforms = [
    "instagram",
    "instagram",
    "tiktok",
    "instagram",
    "tiktok",
    "facebook",
    "instagram",
    "tiktok",
    "instagram",
    "instagram",
    "facebook",
    "instagram",
  ];
  return (
    <>
      <div className="ps-gallery-heading">
        <div>
          <span className="ps-eyebrow">CONTENT EXAMPLES</span>
          <h2>12 Pieces of Content This Month</h2>
          <p>
            A mix of photos, short videos, graphics and captions — all designed
            for your {industry === "restaurant" ? "restaurant" : "business"}.
          </p>
        </div>
        <div
          className="ps-filter"
          role="group"
          aria-label="Content platform filter"
        >
          {[
            "All",
            "Instagram",
            "TikTok",
            "Facebook",
            "Stories",
            "Graphics",
          ].map((t) => (
            <button
              key={t}
              aria-pressed={filter === t}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="ps-demo-gallery">
        {titles.map((title, i) => {
          if (
            filter !== "All" &&
            !(filter === "Graphics"
              ? [3, 8, 10].includes(i)
              : filter === "Stories"
                ? [5, 11].includes(i)
                : platforms[i] === filter.toLowerCase())
          )
            return null;
          return (
            <button
              className="ps-demo-post"
              key={title}
              onClick={() => {
                setSelected(i);
                dialog.current?.showModal();
              }}
            >
              <div className="ps-demo-post-image">
                <Photo name={`${industry}-${i + 1}`} alt={title} />
                <Platform name={platforms[i]} size={25} />
                {platforms[i] === "tiktok" && (
                  <span className="ps-play">
                    <Play fill="white" />
                  </span>
                )}
              </div>
              <span className="ps-demo-post-meta">
                <small>
                  Mar {[1, 3, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28][i]}
                </small>
                <strong>{title}</strong>
              </span>
            </button>
          );
        })}
      </div>
      <dialog
        ref={dialog}
        className="ps-dialog"
        aria-label={titles[selected ?? 0]}
      >
        <button
          className="ps-modal-close"
          aria-label="Close content"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        {selected !== null && (
          <>
            <Photo
              name={`${industry}-${selected + 1}`}
              alt={titles[selected]}
            />
            <h2>{titles[selected]}</h2>
          </>
        )}
        <p>
          Example content for the {industry} social media demo. Video artwork is
          a still preview; no video file was supplied.
        </p>
        <button className="ps-button" onClick={() => dialog.current?.close()}>
          Close preview
        </button>
      </dialog>
    </>
  );
}
export function SampleCalendar({
  industry = "beauty",
  compact = false,
}: {
  industry?: string;
  compact?: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const date = new Date(Date.UTC(2026, 2 + offset, 1));
  const count = new Date(Date.UTC(2026, 3 + offset, 0)).getUTCDate();
  const start = (date.getUTCDay() + 6) % 7;
  const titles = demoTitles[industry] || demoTitles.beauty;
  return (
    <div
      className={`ps-sample-calendar ${compact ? "ps-calendar-compact" : ""}`}
    >
      <div className="ps-calendar-toolbar">
        <button
          aria-label="Previous sample month"
          onClick={() => {
            setOffset(offset - 1);
            setChosen(null);
          }}
        >
          <ChevronLeft size={15} />
        </button>
        <strong>
          {date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          })}
        </strong>
        <span />
        <button
          aria-label="Next sample month"
          onClick={() => {
            setOffset(offset + 1);
            setChosen(null);
          }}
        >
          <ChevronRight size={15} />
        </button>
        <button
          onClick={() => {
            setOffset(0);
            setChosen(null);
          }}
        >
          Month⌄
        </button>
      </div>
      <div className="ps-sample-days">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="ps-sample-cells">
        {Array.from({ length: Math.ceil((count + start) / 7) * 7 }, (_, i) => {
          const n = i - start + 1;
          const post = [1, 3, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28].indexOf(n);
          return (
            <div key={i}>
              <small>{n > 0 && n <= count ? n : ""}</small>
              {offset === 0 && post >= 0 && (
                <button
                  className={`ps-calendar-event ps-event-${post % 4}`}
                  onClick={() => setChosen(post)}
                >
                  <Platform
                    name={
                      post % 3 === 0
                        ? "instagram"
                        : post % 3 === 1
                          ? "facebook"
                          : "tiktok"
                    }
                    size={19}
                  />
                  <span>
                    {titles[post]}
                    <small>
                      {post % 3 === 0
                        ? "Instagram"
                        : post % 3 === 1
                          ? "Facebook"
                          : "TikTok"}
                    </small>
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
      {chosen !== null && (
        <div className="ps-sample-detail" role="status">
          <strong>{titles[chosen]}</strong>
          <span>Sample content · March 2026</span>
          <button
            onClick={() => setChosen(null)}
            aria-label="Close sample detail"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
