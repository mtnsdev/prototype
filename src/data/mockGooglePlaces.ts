/**
 * Prototype-only mock data standing in for a real Google Places API response.
 *
 * Each entry mirrors the subset of the Places "Place" resource we want to
 * surface in the Add Product flow. When the real backend integration lands,
 * the `/api/places/search` and `/api/places/photo` route handlers should be
 * the only things that change — consumers in the UI can keep this shape.
 */

export type MockPlaceResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  /** Google Places "types" array — feeds the directory-category mapper. */
  types: string[];
  city: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
  /**
   * Pretend "official" photo. In the real flow this is a placeId we resolve
   * via `/api/places/photo`; here we hard-code a URL so the demo just works.
   */
  photo_url: string;
  /** Optional richer detail for prefill demos. */
  website?: string;
  phone?: string;
};

export const MOCK_PLACES: MockPlaceResult[] = [
  {
    place_id: "place_aman_tokyo",
    name: "Aman Tokyo",
    formatted_address: "1-5-6 Otemachi, Chiyoda City, Tokyo 100-0004, Japan",
    types: ["lodging", "hotel", "spa"],
    city: "Tokyo",
    country: "Japan",
    region: "Kanto",
    latitude: 35.6862,
    longitude: 139.7654,
    photo_url:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=70&auto=format&fit=crop",
    website: "https://www.aman.com/hotels/aman-tokyo",
  },
  {
    place_id: "place_le_bristol_paris",
    name: "Le Bristol Paris",
    formatted_address: "112 Rue du Faubourg Saint-Honoré, 75008 Paris, France",
    types: ["lodging", "hotel"],
    city: "Paris",
    country: "France",
    region: "Île-de-France",
    latitude: 48.8718,
    longitude: 2.3155,
    photo_url:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=70&auto=format&fit=crop",
    website: "https://www.oetkercollection.com/destinations/le-bristol-paris/",
  },
  {
    place_id: "place_belmond_splendido",
    name: "Belmond Hotel Splendido",
    formatted_address: "Salita Baratta 16, 16034 Portofino GE, Italy",
    types: ["lodging", "hotel", "resort_hotel"],
    city: "Portofino",
    country: "Italy",
    region: "Liguria",
    latitude: 44.3038,
    longitude: 9.2096,
    photo_url:
      "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&q=70&auto=format&fit=crop",
    website: "https://www.belmond.com/hotels/europe/italy/portofino/belmond-hotel-splendido/",
  },
  {
    place_id: "place_amangiri",
    name: "Amangiri",
    formatted_address: "1 Kayenta Rd, Canyon Point, UT 84741, United States",
    types: ["lodging", "resort_hotel", "spa"],
    city: "Canyon Point",
    country: "United States",
    region: "Utah",
    latitude: 37.0214,
    longitude: -111.8722,
    photo_url:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=70&auto=format&fit=crop",
  },
  {
    place_id: "place_grand_resort_lagonissi",
    name: "Grand Resort Lagonissi",
    formatted_address: "40th km Athens-Sounio Avenue, 190 10 Lagonissi, Greece",
    types: ["lodging", "resort_hotel"],
    city: "Lagonissi",
    country: "Greece",
    region: "Attica",
    latitude: 37.7338,
    longitude: 23.9697,
    photo_url:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=70&auto=format&fit=crop",
  },
  {
    place_id: "place_noma",
    name: "Noma",
    formatted_address: "Refshalevej 96, 1432 København, Denmark",
    types: ["restaurant", "food"],
    city: "Copenhagen",
    country: "Denmark",
    latitude: 55.6839,
    longitude: 12.6107,
    photo_url:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=70&auto=format&fit=crop",
    website: "https://noma.dk",
  },
  {
    place_id: "place_septime_paris",
    name: "Septime",
    formatted_address: "80 Rue de Charonne, 75011 Paris, France",
    types: ["restaurant", "food"],
    city: "Paris",
    country: "France",
    region: "Île-de-France",
    latitude: 48.8526,
    longitude: 2.3793,
    photo_url:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=70&auto=format&fit=crop",
  },
  {
    place_id: "place_louvre",
    name: "Musée du Louvre",
    formatted_address: "Rue de Rivoli, 75001 Paris, France",
    types: ["tourist_attraction", "museum"],
    city: "Paris",
    country: "France",
    region: "Île-de-France",
    latitude: 48.8606,
    longitude: 2.3376,
    photo_url:
      "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&q=70&auto=format&fit=crop",
  },
  {
    place_id: "place_acropolis",
    name: "Acropolis of Athens",
    formatted_address: "Athens 105 58, Greece",
    types: ["tourist_attraction", "park"],
    city: "Athens",
    country: "Greece",
    region: "Attica",
    latitude: 37.9715,
    longitude: 23.7257,
    photo_url:
      "https://images.unsplash.com/photo-1555993539-1732b0258235?w=1200&q=70&auto=format&fit=crop",
  },
  {
    place_id: "place_abercrombie_kent",
    name: "Abercrombie & Kent",
    formatted_address: "1411 Opus Pl, Downers Grove, IL 60515, United States",
    types: ["travel_agency"],
    city: "Downers Grove",
    country: "United States",
    region: "Illinois",
    latitude: 41.7913,
    longitude: -88.0142,
    photo_url:
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=70&auto=format&fit=crop",
    website: "https://www.abercrombiekent.com",
  },
];
