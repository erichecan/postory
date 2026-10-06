"use client";
import { useActionState, useRef, useState, type ChangeEvent } from "react";
import { ArrowRight, Mail, X } from "lucide-react";
import { submitAssessment, submitFeedback } from "@/lib/actions/assessment";
import { ProfileForm } from "@/components/profile/profile-form";
import type { AgencyData } from "@/lib/agency/types";
export function AssessmentForm() {
  const [state, action, pending] = useActionState(submitAssessment, undefined);
  const [count, setCount] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({
    businessType: "",
    shopName: "",
    location: "",
    email: "",
    website: "",
    goal: "",
    details: "",
  });
  function update(
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    if (name === "details") setCount(value.length);
  }

  return (
    <form action={action} className="ps-form">
      {state?.ok ? (
        <div className="ps-form-success" role="status">
          <h3>Thank you for telling us about your business.</h3>
          <p>
            Your assessment request has been delivered. We’ll get back to you
            using the contact details you provided.
          </p>
        </div>
      ) : (
        <>
          <label>
            Business Type <em>*</em>
            <select
              required
              name="businessType"
              value={values.businessType}
              onChange={update}
              aria-invalid={!!state?.fields?.businessType}
            >
              <option value="" disabled>
                Select a business type
              </option>
              {[
                "Beauty & Wellness",
                "Restaurant & Food",
                "Home Services & Contractors",
                "Fitness & Health",
                "Retail & Boutiques",
                "Professional Services",
                "Other",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {state?.fields?.businessType && (
              <small className="ps-error">{state.fields.businessType}</small>
            )}
          </label>
          <label>
            Business Name <em>*</em>
            <input
              required
              name="shopName"
              value={values.shopName}
              onChange={update}
              maxLength={128}
              placeholder="Your business name"
              aria-invalid={!!state?.fields?.shopName}
            />
            {state?.fields?.shopName && (
              <small className="ps-error">{state.fields.shopName}</small>
            )}
          </label>
          <label>
            Business Location <em>*</em>
            <input
              required
              name="location"
              value={values.location}
              onChange={update}
              maxLength={255}
              placeholder="City, Province"
              aria-invalid={!!state?.fields?.location}
            />
            {state?.fields?.location && (
              <small className="ps-error">{state.fields.location}</small>
            )}
          </label>
          <label>
            Email Address <span>(optional)</span>
            <input
              name="email"
              value={values.email}
              onChange={update}
              type="email"
              maxLength={254}
              placeholder="you@yourbusiness.com"
              aria-invalid={!!state?.fields?.email}
            />
            {state?.fields?.email && (
              <small className="ps-error">{state.fields.email}</small>
            )}
          </label>
          <label>
            Website or Social Media <span>(optional)</span>
            <input
              type="url"
              name="website"
              value={values.website}
              onChange={update}
              placeholder="https://"
              maxLength={500}
              aria-invalid={!!state?.fields?.website}
            />
            {state?.fields?.website && (
              <small className="ps-error">{state.fields.website}</small>
            )}
          </label>
          <label>
            Main Goals <em>*</em>
            <select
              required
              name="goal"
              value={values.goal}
              onChange={update}
              aria-invalid={!!state?.fields?.goal}
            >
              <option value="" disabled>
                Select your main goal
              </option>
              {[
                "Attract more customers",
                "Increase bookings",
                "Build brand awareness",
                "Improve social media consistency",
                "Promote services or products",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Tell Us More <span>(optional)</span>
            <textarea
              name="details"
              value={values.details}
              onChange={update}
              maxLength={500}
              rows={4}
              placeholder="Share any additional information about your business, target audience or specific needs."
            />
            <small className="ps-char-count">{count}/500</small>
          </label>
          {state?.error && (
            <p className="ps-error" role="alert">
              {state.error}
            </p>
          )}
          <button type="submit" className="ps-button" disabled={pending}>
            {pending ? "Submitting…" : "Submit Assessment"}
            <ArrowRight size={16} />
          </button>
        </>
      )}
    </form>
  );
}
export function ContactDialog() {
  return (
    <a className="ps-button ps-button-secondary" href="/assessment#contact">
      <Mail size={17} />
      Contact Us
    </a>
  );
}
export function BrandEditor({
  data,
  children,
}: {
  data: AgencyData;
  children?: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        className="ps-small-button"
        onClick={() => dialog.current?.showModal()}
      >
        {children || "✎ Edit"}
      </button>
      <dialog ref={dialog} className="ps-dialog ps-brand-editor">
        <button
          className="ps-modal-close"
          aria-label="Close brand editor"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        <h2>Update Your Brand</h2>
        {data.demo ? (
          <DemoBrandEditor />
        ) : (
          <ProfileForm initial={data.profile} />
        )}
      </dialog>
    </>
  );
}
function DemoBrandEditor() {
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="ps-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSaved(true);
      }}
    >
      <p>This is a design demo. Changes below are only a local preview.</p>
      <label>
        Business name
        <input
          defaultValue="Sophie Chen Beauty Studio"
          required
          maxLength={64}
        />
      </label>
      <label>
        About your brand
        <textarea
          defaultValue="Personalized skincare treatments and professional care."
          rows={4}
        />
      </label>
      <button className="ps-button">Preview Changes</button>
      {saved && (
        <p role="status">
          Preview updated in this dialog. No customer data has been saved.
        </p>
      )}
    </form>
  );
}
export function FeedbackDialog({
  demo = false,
  subject,
}: {
  demo?: boolean;
  subject: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(submitFeedback, undefined);
  const [preview, setPreview] = useState(false);
  return (
    <>
      <button className="ps-button" onClick={() => dialog.current?.showModal()}>
        Send Us a Message
        <ArrowRight size={16} />
      </button>
      <dialog ref={dialog} className="ps-dialog">
        <button
          className="ps-modal-close"
          aria-label="Close feedback"
          onClick={() => dialog.current?.close()}
        >
          <X />
        </button>
        <h2>Share Your Feedback</h2>
        <p>{subject}</p>
        <form
          className="ps-form"
          action={demo ? undefined : action}
          onSubmit={
            demo
              ? (e) => {
                  e.preventDefault();
                  setPreview(true);
                }
              : undefined
          }
        >
          <input type="hidden" name="subject" value={subject} />
          <label>
            Message <em>*</em>
            <textarea
              name="message"
              required
              maxLength={2000}
              rows={5}
              placeholder="Tell us what you’d like to adjust or ask your team."
            />
          </label>
          {demo && (
            <p>This is a design demo. Messages are only a local preview.</p>
          )}
          {state?.error && (
            <p className="ps-error" role="alert">
              {state.error}
            </p>
          )}
          {(state?.ok || preview) && (
            <p role="status">
              {demo
                ? "Preview received. No message has been sent."
                : "Your message has been delivered to the PoStory team."}
            </p>
          )}
          <button className="ps-button" disabled={pending}>
            {pending ? "Sending…" : demo ? "Preview Feedback" : "Send Message"}
          </button>
        </form>
      </dialog>
    </>
  );
}
