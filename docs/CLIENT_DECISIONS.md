# Client decisions — Platera Jewellers

Received 2026-10-04. Each decision lists what the build does with it. Items marked
**OPEN** need an answer from the client before the related feature launches.

## 1. Pricing
Two modes per product:
- **Live rate**: `metal rate per gram × net weight + making charge + 3% GST`.
- **Fixed price**: owner-entered selling price, GST shown inside it.

The PDP Ledger shows the full breakdown for live-rate pieces and a simpler
"price · GST included" line for fixed-price pieces. "Rate as on {date}" appears
only next to live-rate prices.

## 2. Making charges
Per product: 10%, 15% or 20% of metal value. Admin offers exactly these three as
a dropdown, so it can't be mistyped. The Ledger shows it as its own line.

## 3. Returns and refunds
- Window: 7 days from delivery.
- Refund value = metal value at the **current** live rate on the day the return
  is accepted. Making charges, GST and other charges are not refunded.
- Return rejected if the piece is damaged, altered, incomplete or missing parts.

**Implementation:** the refund calculator in admin shows the recomputed figure
line by line, and the customer gets the same breakdown.

**OPEN 3a — fixed-price products.** "Current live rate" doesn't apply to them.
Proposed default: refund = price paid minus GST.

**OPEN 3b — refund cap.** If the rate rises within the 7 days, a customer could
get back more than they paid for the metal. Proposed default: refund =
`min(metal value at today's rate, metal value paid)`.

**OPEN 3c — earrings.** Many sets include earrings. Earrings are commonly
non-returnable for hygiene reasons. Proposed default: sets are returnable only
if the earrings' backs and seals are intact; standalone earrings aren't returnable.

**Legal note.** Under the Consumer Protection (E-Commerce) Rules 2020, a
defective, damaged-in-transit or wrongly sent item must still be accepted for
return. The policy drafts word "damaged/altered" as damage after delivery by the
customer. Have a lawyer review the final text.

## 4. Buyback and exchange
- Subject to Platera policy. Making charges, GST and other charges aren't
  considered. Same condition rules as returns.
- **OPEN 4a — buyback deduction %.** To be shared. Until then the PDP says
  "Buyback available — terms on request" and links to WhatsApp, rather than
  showing a number.

## 5. Weight
No tolerance. The listed weight is the actual weight. Consequences:
- Admin requires net and gross weight before a live-rate product can be
  published.
- The brief's weight-difference adjustment flow is **not built** (not needed).
- The PDP states that weight is measured per piece and is final.

## 6. After-sale services
Available and chargeable, depending on the work; minimum charges may apply. The
site lists the services (repair, resizing, alteration, polishing) with "quoted
on inspection". Service requests go through the customer account and WhatsApp.

## 7. COD
Not offered. Razorpay prepaid only (UPI, cards, netbanking, wallets, EMI if
enabled). The COD code path isn't built.

## 8. Shipping
Pan-India through a courier (Shiprocket integration). Checkout shows pincode
serviceability, the estimated delivery window and the shipping charge.
**OPEN 8a** — shipping charge (free above a threshold? flat?) and insured-value
handling for high-value parcels.

## 9. Made to order
Enquiry-only through WhatsApp/phone; no online payment for custom work. The PDP
and a /custom page have a "Made to order / custom enquiry" action that opens
WhatsApp with a prefilled message. The stated lead time is 15–20 days. The
brief's engraving and advance-payment flows are **not built**.

## 10. Store timings
10:00 AM – 2:00 PM and 4:00 PM – 9:00 PM. The appointment slots are built from these.
**OPEN 10a** — which days? Is there a weekly closed day?

## 11. Legal entity and wording
- Invoicing entity: **Bhairav Jewellers**, GSTIN `27AOIPR9516G1ZI`.
- Wording: "PLATERA JEWELLERS — presented in collaboration with Bhairav
  Jewellers, Gorai 1."
- Curation line (client-supplied) is used in the collaboration section.

**OPEN 11a — address mismatch.** The brief says *Plot No. 3, Shop No. 13, Chand
Ganga CHS, Shivkrupa CHS, Gorai 1, Borivali West, Mumbai 400091*. The client
document says *Shop No. 13, Chand Ganga Building, Plot No. 2, Gorai-1*. The
address must be identical everywhere (site, invoices, Google Business Profile,
schema), so we need the one exact version, with the PIN.

**OPEN 11b** — the legal name of the proprietor as registered on the GSTIN, for
tax invoices.

## A. Metal and materials
The current catalogue is **925 sterling silver, BIS hallmarked**. Gold and more
silver pieces will be added later. Consequences:
- The launch rate screen asks for one number: the 925 silver rate per gram. The
  `MetalRate` model already supports 22K/18K/14K gold and platinum, so gold
  pieces need no schema change when they arrive.
- Every PDP shows the BIS silver hallmark graphic (purity 925 plus the HUID
  where the piece carries one).
- The site's default metal accent is silver ("argent"). Champagne gold is applied
  per piece, so it appears only on gold pieces and gold-plated silver pieces.

**OPEN A1 — gold-tone pieces** (kundan, meenakari, peacock pendants): confirm
these are gold-plated 925 silver. They'll be labelled "925 silver, gold plated"
unless told otherwise.
**OPEN A2 — stones.** Confirm the white stones are cubic zirconia, and what the
coloured stones are. CZ will be disclosed as "cubic zirconia (CZ)" on every piece
that has it, and never called diamond.
