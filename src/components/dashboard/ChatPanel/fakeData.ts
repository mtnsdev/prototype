/**
 * Dev-only fake data so you can see UX changes (recent chats, results panel, card/list view).
 * Only used when NODE_ENV === "development".
 */

import type { PlaceCard, Citation } from "./types";

export const FAKE_RECENT_CONVERSATIONS = [
  {
    id: 9001,
    title: "What is the commission rate for Rosewood Elite bookings?",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 9002,
    title: "What amenities does Four Seasons Abu Dhabi offer?",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 9003,
    title: "What are the 'Four Approaches' to designing itineraries?",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  { id: 9004, title: "Best overwater villas in the Maldives for families", created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 9005, title: "Virtuoso benefits for Aman Tokyo", created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 9006, title: "Monaco Grand Prix weekend packages 2026", created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 9007, title: "Wine tours Tuscany — private driver", created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 9008, title: "Passport validity for Bali and Indonesia", created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), updated_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() },
];

export const FAKE_PLACE_CARDS: PlaceCard[] = [
  {
    name: "Four Seasons Hotel Abu Dhabi",
    address: "Al Maryah Island",
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    google_maps_url: "https://maps.google.com/?q=Four+Seasons+Abu+Dhabi",
    google_rating: 4.8,
    google_types: ["lodging", "restaurant"],
    contact_phone: "+971 2 333 2222",
    website: "https://www.fourseasons.com/abudhabi",
    primary_image_url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=300&fit=crop",
  },
  {
    name: "Rosewood Abu Dhabi",
    address: "Al Maryah Island",
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    google_maps_url: "https://maps.google.com/?q=Rosewood+Abu+Dhabi",
    google_rating: 4.7,
    google_types: ["lodging"],
    contact_phone: "+971 2 813 5555",
    website: "https://www.rosewoodhotels.com/abu-dhabi",
    primary_image_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
  },
  {
    name: "Emirates Palace Mandarin Oriental",
    address: "West Corniche Road",
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    google_maps_url: "https://maps.google.com/?q=Emirates+Palace",
    google_rating: 4.9,
    google_types: ["lodging", "restaurant"],
    contact_phone: "",
    website: "https://www.mandarinoriental.com/abu-dhabi",
    primary_image_url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=300&fit=crop",
  },
  { name: "One&Only Reethi Rah", address: "North Malé Atoll", city: "Malé", country: "Maldives", google_maps_url: "https://maps.google.com/?q=One+Only+Reethi+Rah", google_rating: 4.9, google_types: ["lodging", "spa"], contact_phone: "", website: "https://www.oneandonlyresorts.com", primary_image_url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=300&fit=crop" },
  { name: "Hôtel de Paris Monte-Carlo", address: "Place du Casino", city: "Monaco", country: "Monaco", google_maps_url: "https://maps.google.com/?q=Hotel+de+Paris+Monte+Carlo", google_rating: 4.8, google_types: ["lodging", "restaurant"], contact_phone: "+377 98 06 30 00", website: "https://www.hoteldeparismontecarlo.com", primary_image_url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop" },
  { name: "Belmond Hotel Caruso", address: "Piazza San Giovanni del Toro", city: "Ravello", country: "Italy", google_maps_url: "https://maps.google.com/?q=Belmond+Hotel+Caruso", google_rating: 4.9, google_types: ["lodging"], contact_phone: "", website: "https://www.belmond.com/hotels/europe/italy/amalfi-coast/belmond-hotel-caruso", primary_image_url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop" },
];

export const FAKE_KB_CITATIONS: Citation[] = [
  {
    chunk_id: "fake-1",
    source: "claromentis",
    page_number: 12,
    excerpt: "Commission rates for Rosewood Elite tier start at 10% for qualifying bookings...",
    filename: "Commission_Guide_2024.pdf",
    pdf_path: "",
    source_label: "Claromentis (Intranet)",
  },
  {
    chunk_id: "fake-2",
    source: "google-drive",
    page_number: 1,
    excerpt: "Four Seasons Abu Dhabi offers butler service, private beach, and multiple dining venues.",
    filename: "Hotel_Amenities_Overview.pdf",
    pdf_path: "",
    source_label: "My Google Drive",
  },
  { chunk_id: "fake-3", source: "claromentis", page_number: 5, excerpt: "Maldives overwater villas: One&Only Reethi Rah and Four Seasons Landaa Giraavaru offer family villas with pool.", filename: "Maldives_Destination_Guide_2026.pdf", pdf_path: "", source_label: "Claromentis (Intranet)" },
  { chunk_id: "fake-4", source: "google-drive", page_number: 3, excerpt: "Virtuoso benefits at Aman properties include room upgrade, daily breakfast, and $100 credit.", filename: "Aman_Virtuoso_Benefits.pdf", pdf_path: "", source_label: "My Google Drive" },
  { chunk_id: "fake-5", source: "claromentis", page_number: 1, excerpt: "Monaco Grand Prix 2026: recommended hotels Hôtel de Paris, Hermitage, and Fairmont. Book 12 months ahead.", filename: "Monaco_GP_Guide.pdf", pdf_path: "", source_label: "Claromentis (Intranet)" },
];
