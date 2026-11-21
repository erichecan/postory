import { industrySupportsPromotion, type IndustrySlug } from "./industry-registry";

/** All publishable pricing and limitations come from merchant-confirmed facts.
 * An offer draft can be rendered for review but never approved while invalid.
 */
export type OfferChannels = "dine_in" | "pickup" | "delivery" | "online" | "in_store";
export type OfferFacts = {
  type: string;
  title: string;
  items: string[];
  currency?: "CAD" | "EUR" | "GBP" | "USD";
  price?: number;
  regularPrice?: number;
  percentOff?: number;
  startDate?: string;
  endDate?: string;
  timezone?: string;
  channels: OfferChannels[];
  eligibility?: string;
  limitations?: string;
  memberOnly?: boolean;
  confirmedByMerchant: boolean;
};

export type OfferCheck = { valid: boolean; blockers: string[]; imageLabel: string | null; fullDisclosure: string };

function isoDate(date: string | undefined): boolean {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const check=new Date(date+"T00:00:00Z");
  return Number.isFinite(check.valueOf()) && check.toISOString().slice(0,10)===date;
}
function money(n: number, currency: NonNullable<OfferFacts["currency"]>): string {
  return new Intl.NumberFormat("en-CA",{style:"currency",currency,maximumFractionDigits:2}).format(n);
}

export function validateOffer(industry: IndustrySlug, offer: OfferFacts): OfferCheck {
  const blockers:string[]=[];
  if (!industrySupportsPromotion(industry, offer.type)) blockers.push("promotion_not_supported_for_industry");
  if (!offer.title.trim() || offer.title.length>120) blockers.push("invalid_title");
  if (offer.type!=="none" && !offer.items.length) blockers.push("missing_items");
  if (offer.items.length>12 || offer.items.some(s=>!s.trim() || s.length>120)) blockers.push("invalid_items");
  if (!offer.channels.length) blockers.push("missing_channels");
  if (offer.channels.some(c=>!["dine_in","pickup","delivery","online","in_store"].includes(c))) blockers.push("invalid_channels");
  if (offer.startDate || offer.endDate) {
    if (!isoDate(offer.startDate) || !isoDate(offer.endDate) ||
       (offer.startDate && offer.endDate && offer.startDate>offer.endDate)) blockers.push("invalid_dates");
    if (!offer.timezone || !/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(offer.timezone))
      blockers.push("missing_timezone");
  }
  if (offer.price!==undefined && (!Number.isFinite(offer.price)||offer.price<0)) blockers.push("invalid_price");
  if (offer.regularPrice!==undefined && (!Number.isFinite(offer.regularPrice)||offer.regularPrice<=0)) blockers.push("invalid_regular_price");
  if (offer.percentOff!==undefined && (!Number.isFinite(offer.percentOff)||offer.percentOff<=0||offer.percentOff>=100))
    blockers.push("invalid_percentage");
  if (["fixed_price","bundle"].includes(offer.type) &&
      (offer.price===undefined || !offer.currency)) blockers.push("missing_price");
  if (offer.type==="percent_off" && offer.percentOff===undefined) blockers.push("missing_percentage");
  if (offer.type==="member_event" && !offer.eligibility?.trim()) blockers.push("missing_member_eligibility");
  if (offer.memberOnly && !offer.eligibility?.trim()) blockers.push("missing_member_eligibility");
  if (offer.regularPrice!==undefined && offer.price!==undefined && offer.regularPrice<=offer.price)
    blockers.push("regular_price_not_higher");
  if (offer.regularPrice!==undefined && !offer.confirmedByMerchant) blockers.push("unverified_comparison_price");
  if (offer.type==="time_slot" && (!offer.startDate || !offer.endDate)) blockers.push("missing_time_slot_dates");
  if (offer.type!=="none" && !offer.confirmedByMerchant) blockers.push("unconfirmed_offer");
  const valid=blockers.length===0;
  const imageLabel= !valid ? null :
    offer.type==="percent_off" ? `${offer.percentOff}% OFF` :
    offer.price!==undefined && offer.currency ? money(offer.price,offer.currency) : null;
  const disclosure=[
    offer.title.trim(),
    offer.items.length ? `Items: ${offer.items.join(", ")}`:null,
    imageLabel ? `Offer: ${imageLabel}`:null,
    offer.startDate && offer.endDate ? `Dates: ${offer.startDate} to ${offer.endDate}${offer.timezone?` (${offer.timezone})`:""}`:null,
    offer.channels.length ? `Channels: ${offer.channels.join(", ")}`:null,
    offer.eligibility?.trim() ? `Eligibility: ${offer.eligibility.trim()}`:null,
    offer.limitations?.trim() ? `Restrictions: ${offer.limitations.trim()}`:null,
  ].filter(Boolean).join("\n");
  return {valid,blockers:[...new Set(blockers)],imageLabel,fullDisclosure:disclosure};
}
