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
];
