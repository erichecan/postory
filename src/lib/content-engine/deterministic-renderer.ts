import sharp from "sharp";
import { createHash } from "node:crypto";
import type { BrandProfileDraft } from "./brand-profile";
import { checkBrandProfileForApproval, confirmedBrandFacts } from "./brand-profile";
import { type OfferFacts, validateOffer } from "./offers";

/**
 * Deterministic media renderer. Only a genuine merchant photo + approved facts
 * are used. NO external AI call, no mocked Facebook/iPhone shell in exported image.
 * Visual designs here are production ENGINE foundations, not approved design library assets.
 */
export const CONTENT_FORMATS={
  square:{width:1080,height:1080},
  portrait:{width:1080,height:1350},
  story:{width:1080,height:1920},
} as const;
export type ContentFormat=keyof typeof CONTENT_FORMATS;
export type ContentTemplate="food-editorial" | "product-feature" | "local-story";
export type RenderMode="preview" | "publish";

export type RenderRequest={
  profile:BrandProfileDraft;
  photo:Buffer;
  sourceAssetId?:string;
  template:ContentTemplate;
  format:ContentFormat;
  headline:string;
  subheadline?:string;
  cta?:string;
  offer?:OfferFacts;
  mode:RenderMode;
};

export class ContentRenderError extends Error {
  constructor(public readonly reason:string){super(reason);this.name="ContentRenderError";}
}
function xml(v:string):string {
  return v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c] || c));
}
function lines(value:string,maxCharacters=25,maxLines=3):string[] {
  const raw=value.trim().replace(/\s+/g," ");
  if (!raw || Array.from(raw).length>80) throw new ContentRenderError("invalid_headline_length");
  const words=raw.split(/\s+/);
  const out:string[]=[];let current="";
  for(const word of words){
    for(const cp of Array.from(word)){
      if(Array.from(current).length>=maxCharacters){
        out.push(current);current="";
        if(out.length>=maxLines) throw new ContentRenderError("headline_overflow");
      }
      current+=cp;
    }
    if(Array.from(current).length<maxCharacters)current+=" ";
    else{out.push(current);current="";if(out.length>=maxLines)throw new ContentRenderError("headline_overflow");}
  }
  if(current.trim())out.push(current.trim());
  if(out.length>maxLines)throw new ContentRenderError("headline_overflow");
  return out.map(x=>x.trim()).filter(Boolean);
}
function color(value:string):string {
  return /^#[\da-fA-F]{6}$/.test(value)?value:"#214639";
}
function textBlock(content:string,x:number,y:number,size:number,ink:string,maxChars:number,maxLines:number):string {
  return lines(content,maxChars,maxLines).map((line,i)=>
    `<text x="${x}" y="${y+i*size*1.14}" font-size="${size}" font-family="Arial,Helvetica,sans-serif" font-weight="750" fill="${ink}">${xml(line)}</text>`
  ).join("");
}
function overlaySvg(input:{
  width:number;height:number;name:string;headline:string;subheadline:string;
  cta:string;offerLabel:string|null;brandColor:string;template:ContentTemplate;mode:RenderMode;
}) {
  const {width:w,height:h}=input;const brandColor=color(input.brandColor);
  const fontHeader=Math.round(w*.075);const white="#ffffff",ink="#142e28",cream="#f7f4ea";
  let layers="";
  if(input.template==="food-editorial"){
    const panelTop=Math.round(h*.695);
    layers=`<rect x="0" y="${panelTop}" width="${w}" height="${h-panelTop}" fill="${cream}"/>
      <rect x="0" y="${panelTop}" width="11" height="${h-panelTop}" fill="${brandColor}"/>
      <text x="72" y="${panelTop+54}" font-size="21" letter-spacing="4" font-family="Arial" font-weight="800" fill="${brandColor}">${xml(input.name.toUpperCase())}</text>
      ${textBlock(input.headline,72,panelTop+138,fontHeader,ink,26,2)}
      <text x="72" y="${h-95}" font-size="27" font-family="Arial" fill="${ink}">${xml(input.subheadline.slice(0,72))}</text>
      <text x="72" y="${h-40}" font-size="23" font-family="Arial" font-weight="700" fill="${brandColor}">${xml(input.cta.toUpperCase().slice(0,38))}</text>`;
  } else if(input.template==="product-feature"){
    const darkTop=Math.round(h*.44);
    layers=`<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop stop-color="#101d18" stop-opacity="0" offset="0"/>
      <stop stop-color="#101d18" stop-opacity=".84" offset=".65"/>
      <stop stop-color="#101d18" stop-opacity=".96" offset="1"/></linearGradient></defs>
      <rect x="0" y="${darkTop}" width="${w}" height="${h-darkTop}" fill="url(#shade)"/>
      <text x="70" y="100" font-size="26" font-family="Arial" font-weight="800" letter-spacing="4" fill="${white}">${xml(input.name.toUpperCase())}</text>
      ${textBlock(input.headline,70,Math.round(h*.70),Math.round(w*.083),white,24,2)}
      <text x="70" y="${h-158}" font-size="26" fill="${white}" font-family="Arial">${xml(input.subheadline.slice(0,70))}</text>
      <rect x="70" y="${h-120}" width="320" height="64" rx="6" fill="${cream}"/>
      <text x="93" y="${h-77}" font-size="25" font-family="Arial" font-weight="750" fill="${ink}">${xml(input.cta.slice(0,28))}</text>`;
  }else{
    const photoEnd=Math.round(h*.76);
    layers=`<rect x="0" y="0" width="${w}" height="${Math.round(h*.24)}" fill="${cream}"/>
      <text x="65" y="80" font-size="23" letter-spacing="4" font-family="Arial" font-weight="800" fill="${brandColor}">${xml(input.name.toUpperCase())}</text>
      ${textBlock(input.headline,65,170,Math.round(w*.065),ink,27,2)}
      <rect x="0" y="${photoEnd}" width="${w}" height="${h-photoEnd}" fill="${brandColor}"/>
      <text x="68" y="${photoEnd+80}" font-size="31" font-family="Arial" fill="${white}">${xml(input.subheadline.slice(0,62))}</text>
      <text x="68" y="${h-55}" font-size="24" font-family="Arial" font-weight="800" fill="${white}">${xml(input.cta.slice(0,38))}</text>`;
  }
  if(input.offerLabel)layers+=`<rect x="${w-350}" y="130" width="295" height="86" rx="5" fill="${cream}"/><text x="${w-330}" y="190" font-size="37" font-family="Arial" font-weight="800" fill="${ink}">${xml(input.offerLabel.slice(0,18))}</text>`;
  if(input.mode==="preview")layers+=`<g transform="translate(${w/2} ${h/2}) rotate(-24)"><text x="0" y="0" text-anchor="middle" font-family="Arial" font-size="82" font-weight="800" opacity=".20" fill="${white}">DRAFT · NOT FOR POSTING</text></g>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${layers}</svg>`);
}

export async function renderContentMedia(input:RenderRequest):Promise<{
  bytes:Buffer;mime:"image/png";width:number;height:number;preview:boolean;
}> {
  const fmt=CONTENT_FORMATS[input.format];
  if(!fmt) throw new ContentRenderError("unsupported_format");
  const templates:ContentTemplate[]=["food-editorial","product-feature","local-story"];
  if(!templates.includes(input.template)) throw new ContentRenderError("unsupported_template");
  if(input.photo.length>6*1024*1024)throw new ContentRenderError("photo_too_large");
  if(input.mode==="publish"){
    if(input.profile.status!=="approved" || !checkBrandProfileForApproval(input.profile).canApprove)
      throw new ContentRenderError("profile_not_approved");
    const asset=input.profile.assets.find(a=>a.assetId===input.sourceAssetId);
    if(!asset || asset.sourcePermission==="needs_confirmation" || !asset.approvedForPublishing)
      throw new ContentRenderError("unapproved_source_asset");
    const sha=createHash("sha256").update(input.photo).digest("hex");
    if(sha!==asset.sha256)throw new ContentRenderError("asset_hash_mismatch");
  }
  const offerCheck=input.offer?validateOffer(input.profile.industry,input.offer):null;
  if(input.mode==="publish" && offerCheck && !offerCheck.valid)
    throw new ContentRenderError("offer_not_confirmed");
  const verified=confirmedBrandFacts(input.profile);
  const name=input.mode==="publish"?verified.businessName:input.profile.businessName.value;
  if(!name || name.length>55)throw new ContentRenderError("invalid_brand_name");
  const tone=input.profile.brandColors;
  const brandColor=tone && ["merchant_confirmed","designer_selected"].includes(tone.status)?
    tone.value[0]:"#214639";
  const h=fmt.height,w=fmt.width;
  try{
    const photo=await sharp(input.photo,{failOn:"error",limitInputPixels:16_000_000})
      .rotate().resize(w,h,{fit:"cover",position:sharp.strategy.attention}).png().toBuffer();
    const overlay=overlaySvg({width:w,height:h,name,headline:input.headline,
      subheadline:input.subheadline||"",cta:input.cta||"Learn more",
      offerLabel:offerCheck?.valid?offerCheck.imageLabel:null,
      brandColor,template:input.template,mode:input.mode});
    const bytes=await sharp(photo).composite([{input:overlay,top:0,left:0}]).png().toBuffer();
    return {bytes,mime:"image/png",width:w,height:h,preview:input.mode==="preview"};
  }catch(error){
    if(error instanceof ContentRenderError)throw error;
    throw new ContentRenderError("render_failed");
  }
}
