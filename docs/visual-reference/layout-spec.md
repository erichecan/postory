# PoStory reference layout specification

Sources: 15 current page references in preview/visual-reference; the early Services image is auxiliary. All measurements below are reference pixels estimated from visible edges, except actual canvas dimensions in references.json. Photographic asset crops are exact pixel coordinates recorded in assets.json.

## Shared appearance

Ink approximately #0C174F; body text #4D659C; primary pink #FF0086 with pink-to-orange gradients on key hero text. White cards sit on extremely pale pink or cool gray backgrounds, borders around #EDF0F6, rounded corners 6–12 px, very soft shadows. Inter is an assumption: original font files are unavailable. Use weight 700–750 for headings, 400–500 for body, 600 for buttons. Typical public body 14–17 px / 1.38 and customer body 11–14 px / 1.4; hero headings 38–49 px / 1.03. Logo is the supplied transparent wordmark, with CSS clipping of the source sheet; it is not typeset text.

Public V2 header: 49 px tall, outer edges around x40 and x985 at width1024, logo left, navigation center, pink CTA right. Original work/examples headers have Client Login and different nav ordering; preserved per-page via shared component options. Public older pages use no Home link; revised service/process/industry/about pages include Home. Header controls collapse below700 px.

Customer header: 59 px at1536 and48 px on narrow long references. Final requirement uses one top navigation (Dashboard / My Campaign / Marketing Calendar / My Brand). The duplicate sidebar seen in references is omitted, and the same reference content is recentered with a1320 px max width for wide pages and a1100 px max for long pages. This intentionally changes the reference left alignment. Sample business shown only on /demo routes, visibly labeled; protected routes render owner-scoped real data and empty states.

## Homepage — 801 ×1962

40px header → pink hero about274px high, x50–751 content edges, roughly51/49 columns → platform strip82px → photo/problem block roughly214px → business-to-content flow178px → three industry cards around280px section → pink sample calendar section282px, 61/39 columns → five-step process200px → testimonial/examples strip120px → FAQ146px → CTA58px → footer70px. Hero title28px with three lines as supplied, body12px. Problem photo about352×180. Industry card photos224×79, seven platform marks distributed evenly. Process cards roughly127×118. Original independent owner photo unavailable; a clean photo-only crop from the supplied problem scene is used. Example testimonial is labeled illustrative. The original sample calendar contains inconsistent date numerals; implementation uses valid calendar dates.

## Our Work —1536 ×1024

57px header → pink hero295px: left title52px, three-line heading and body19px; right overlapping sample social photo cards/calendar plan → centered section heading90px → three industry cards approx450×330 each with icon/title/description, eight-position photo mosaic and broad tinted button → pink lower sample-calendar region roughly235px with three columns (intro / calendar / theme list). Content x86–1450. All picture mosaics use individual photo/poster crops; header and card copy are HTML. Footer absent in the supplied image, so no extra footer is appended.

## Three Demo pages —1024 ×1536

49px header → split hero314–328px: heading38px, description15px, three mini metric blocks, assessment/demo buttons; right post mockups and March plan (example photo areas are separate assets) → strategy panel260px with intro60/40 split and four week cards → content section approx440px with title26px and filter control,6-column×2-row grid; each photo145×115 and caption strip40px → tinted calendar section420px with a roughly73/27 calendar/CTA column split. Beauty pink theme, Restaurant peach, Contractor light blue. Narrow screens use2-column post grid and1-column strategy/calendar. Supplied short video artwork has no video file; playback opens a clearly stated still preview.

## Services V2 —1024 ×1536

49px header → hero373px, equal columns, headline44px / three lines, p17px; photographic owner with floating HTML post cards → included-services section460px, intro55/45 columns and five cards around190×330, photographs160×140 → benefits165px split intro+4 icon columns → five-step process265px → CTA170px. Cards have11–15px side padding, title14px, body13px. Photo scene is recropped from a supplied clean owner portrait because a separate full hero photograph is unavailable; floating cards, text and chart are HTML.

## How It Works V2 —1024 ×1536

49px header → owner hero370px, headline49px /2 lines, body17px → heading/process section560px, h2 44px, five cards with large icons/numbers and161px square photographic crops → hands-off block270px: left60% copy, right owner portrait+three small HTML benefit cards → pale-blue CTA235px with overlapping sample posts. Public buttons go to assessment; process pictures preserve source typography printed in notebook/chart photo because it belongs to the scene.

## Who We Help V2 —1024 ×1536

49px header → owner hero360px, title47px /2 lines → popular industries660px: title34px, body17px;3×2 cards, image307×120; circular icons overlap picture bottom, caption/button areas about130px → more industries210px with8 icon tiles → CTA180px. First three demo links go to exact demo routes; remaining industries go to assessment, no fabricated extra demos.

## About V2 —1024 ×1536

49px header → owner hero360px, h1 42px /3 lines → why-started180px, left paragraph/right handwritten-style local-business note → human/AI combination280px, approx40/30/30 columns with team photo253×236 → principles240px,4 icon/text columns → team section200px,50/50 copy and431×156 photo → CTA180px. Team photos and related copy originate from design, but images explicitly called illustrative.

## Assessment —1024 ×1536

49px header → hero327px, text42%/photo collage58%, title38px /3 lines, three benefit hints → main form area740px with left explanation/cards/industry examples and right tinted form container (approx55/45). Form uses actual select/input/textarea. Fields from image: Business Type*, Business Name*, Business Location*, optional Website/Social, Main Goals*, optional Tell Us More500chars. Add optional email so staff can reply; this is a material documented deviation. Bottom FAQ approx400px, left60% four open accordions, right40% meeting photo/contact card. Submission uses existing mail gateway only when a real delivery key is configured; no fake success. Browser verification never sends live email.

## Dashboard V2 —1536 ×1024

59px header → heading/note100px → upper active campaign/progress two columns (~61/39) → upcoming posts/platform overview row → recent content/messages row. Campaign photo276×246, h2 25px, four cards per content grid. Progress16px bar with four small metric cards. Posts77–100px photo height. Header/top nav replaces sidebar per final requirement; original reference includes conflicting March/September dates. The demo preserves those example dates where visible; actual client pages use saved content timestamps.

## My Campaign V2 —1536 ×1024

59px header → heading/note100px → wide campaign hero213px,22% photograph/35% title+copy/43% counts+CTA → upcoming/focus row285px,72/28 columns → recent/upcoming/past row290px,46/28/26 columns. Body12–14px, campaign title23px. All cards and detail links work. Upcoming/past query filters change visible campaign list; published link selects real published content. No independent campaign model currently exists: real campaigns are grouped from owner-scoped existing campaign-template/CalendarSlot relations, not invented demo data.

## Campaign Detail V2 —1024 ×1536

48px header → split campaign hero225px →4 tabs45px → main75%/aside25% columns. Main strategy cards195px, progress175px,4×3 content grid660px; aside campaign status, platform counts, metrics, notes. Bottom feedback105px. Photos142×92, title11px, status chips9px. The original generated collage contains duplicated cards/data and an unavailable analytics claim; protected page uses genuine publication counts and marks social reach/engagement analytics unavailable. Demo explicitly labels sample results. Tabs render actual overview/content/schedule/results views. Native dialogs show plan and content details.

## Marketing Calendar V2.1 —1536 ×1024

59px header → heading/date control → 4 summary cards100px → left grid roughly72%/right modules28%. Grid7 columns×5 rows, each130px tall, image108×43; simple category chips. Right upcoming posts350px, strategy mix190px, platform counts135px, focus160px. Reference headline40px; body21px. Final design top nav replaces duplicate sidebar. Correct month/day math is used. Original summary18 differs from19 visible dated events, so counts are derived consistently from rendered entries. Month controls, platform filter, Month/List switch and event details operate. Mobile switches to real schedule list instead of shrinking desktop.

## My Brand V2 —1024 ×1536

48px header → heading/note100px → business/about panels270px,60/40 split → identity+photo195px → services238px (4 photo cards+Add) → promotions250px (3 cards+Add) → media200px (6 thumbnails+upload) → connections170px (3 accounts+connect). Typography11–15px and17px panel headings. Services158×94, promotions~200×96, media104×94. Demo shows sample assets. Real editor reuses existing saveProfileAction/ProfileForm and SocialAccountsPanel; current schema supports brand description/logo/industry/location/contact but not structured services, promotions, palette or multi-photo library. Those additional sections accurately show missing data rather than pretending persistence exists.

## Responsive assumptions

No mobile references supplied. Below700px:16px outer margin, readable typography, navigation disclosure,44px primary controls, hero text before imagery, sections preserve reading order; cards reduce to1–2 columns. Calendars become a real list on mobile. At701–900px maintain2-column where readable, reduce customer side modules to lower rows. Wide reference sizes are checked at801/1024/1536px plus1440/1280/768/390/375.
