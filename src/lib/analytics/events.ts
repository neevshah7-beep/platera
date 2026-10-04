/**
 * The event dictionary. Every analytics event the site sends is listed here with
 * what it means; docs/ANALYTICS_EVENTS.md is generated from the same list.
 * GA4 ecommerce events use Google's standard names and parameters.
 */
export const EVENTS = {
  // GA4 ecommerce
  view_item_list: 'A collection or category tray was shown.',
  select_item: 'A piece was opened from a tray.',
  view_item: 'A product page was viewed.',
  add_to_cart: 'A piece was added to the bag.',
  begin_checkout: 'The checkout page was opened with a valid bag.',
  add_payment_info: 'The customer submitted checkout details and reached payment.',
  purchase: 'Payment was captured and the order confirmed (sent from the order page once, deduplicated by order number).',
  // Intent signals specific to this business
  whatsapp_enquiry: 'A WhatsApp enquiry link was opened. Carries the SKU when it came from a piece.',
  appointment_booked: 'A store visit or video call was requested.',
  ledger_expanded: 'The price breakdown was scrolled into view or opened.',
  size_guide_opened: 'The size guide was opened.',
  certificate_viewed: 'A certificate was opened.',
  hallmark_explained: 'The hallmark explainer was opened.',
  rate_page_viewed: 'The silver rate page was viewed.',
  light_mood_changed: 'A Light Mood (daylight, diya, evening, mandap) was chosen on a piece.',
  piece_picked_in_3d: 'A piece was chosen from a tray inside the 3D house.',
  // Phase 2 and 3, listed now so the dictionary is complete
  loupe_used: 'The loupe was used on a photograph (Phase 2).',
  vault_shared: 'A saved shortlist was shared (Phase 3).',
  rate_alert_set: 'A rate alert was set (Phase 3).',
} as const

export type EventName = keyof typeof EVENTS
