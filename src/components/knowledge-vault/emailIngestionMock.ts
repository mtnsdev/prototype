import type { EmailAttachment, EmailIngestion } from "@/types/email-ingestion";
import { TEAM_EVERYONE_ID } from "@/types/teams";

function withParentRefs(emails: EmailIngestion[]): EmailIngestion[] {
  return emails.map((e) => ({
    ...e,
    attachments: e.attachments.map((a) => ({
      ...a,
      parentEmailId: e.id,
    })),
  }));
}

const RAW: EmailIngestion[] = [
  {
    id: "email-001",
    subject: "Aman Tokyo — Preferred Partner Rates 2026",
    senderEmail: "reservations@aman.com",
    senderName: "Aman Reservations",
    receivedAt: "2026-03-16T14:30:00Z",
    forwardedBy: "user-hana",
    forwardedByName: "Hana Yoshida",
    ownerId: "user-hana",
    bodyText:
      "Dear Hana,\n\nPlease find attached the updated 2026 preferred partner rates for Aman Tokyo. Key highlights:\n\n- Suite rates reduced 12% for shoulder season (April, November)\n- New 4th night free promotion for bookings of 7+ nights\n- Complimentary airport transfer for all Virtuoso bookings\n\nPlease don't hesitate to reach out with any questions.\n\nBest regards,\nAman Reservations Team",
    attachments: [
      {
        id: "att-001",
        filename: "Aman_Tokyo_Partner_Rates_2026.pdf",
        mimeType: "application/pdf",
        size: 245000,
        url: "/mock/aman-rates-2026.pdf",
        scope: "private",
      },
    ],
    scope: "private",
    tags: ["unprocessed"],
    status: "unprocessed",
  },
  {
    id: "email-002",
    subject: "Re: Booking Confirmation — Camille & Marc, Four Seasons Bora Bora",
    senderEmail: "bookings@fourseasons.com",
    senderName: "Four Seasons Reservations",
    receivedAt: "2026-03-15T09:15:00Z",
    forwardedBy: "user-janet",
    forwardedByName: "Janet",
    ownerId: "user-janet",
    bodyText:
      "Dear Janet,\n\nThis confirms the following reservation:\n\nGuests: Camille & Marc Dubois\nProperty: Four Seasons Resort Bora Bora\nDates: June 14–21, 2026 (7 nights)\nRoom: Overwater Bungalow Suite\nRate: $2,850/night (Virtuoso rate)\n\nIncludes:\n- Daily breakfast for two\n- $100 resort credit per stay\n- Room upgrade at check-in (subject to availability)\n- Early check-in / late checkout\n\nConfirmation #: FS-BOR-2026-44821\n\nPlease see attached confirmation document and cancellation policy.",
    attachments: [
      {
        id: "att-002",
        filename: "FS_BoraBora_Confirmation_Signoles.pdf",
        mimeType: "application/pdf",
        size: 180000,
        url: "/mock/fs-borabora-confirmation.pdf",
        scope: "private",
      },
      {
        id: "att-003",
        filename: "Cancellation_Policy_2026.pdf",
        mimeType: "application/pdf",
        size: 52000,
        url: "/mock/fs-cancellation-policy.pdf",
        scope: "private",
      },
    ],
    scope: "private",
    tags: ["booking", "four-seasons"],
    status: "processed",
    processedAt: "2026-03-15T10:00:00Z",
  },
  {
    id: "email-003",
    subject: "Virtuoso Travel Week 2026 — Updated Agenda",
    senderEmail: "events@virtuoso.com",
    senderName: "Virtuoso Events",
    receivedAt: "2026-03-12T16:45:00Z",
    forwardedBy: "user-kristin",
    forwardedByName: "Kristin Summers",
    ownerId: "user-kristin",
    bodyText:
      "Hi Kristin,\n\nAttached is the updated agenda for Virtuoso Travel Week 2026 in Las Vegas (August 10-14).\n\nKey sessions to note:\n- Luxury Trends Keynote (Monday 9am)\n- New Member Orientation (Monday 2pm)\n- Partner Speed Dating (Tuesday all day)\n- Gala Dinner (Wednesday 7pm)\n\nPlease distribute to your team.",
    attachments: [
      {
        id: "att-004",
        filename: "VTW_2026_Agenda.pdf",
        mimeType: "application/pdf",
        size: 890000,
        url: "/mock/vtw-agenda-2026.pdf",
        scope: TEAM_EVERYONE_ID,
      },
      {
        id: "att-005",
        filename: "VTW_2026_Hotel_Options.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        size: 124000,
        url: "/mock/vtw-hotels.xlsx",
        scope: TEAM_EVERYONE_ID,
      },
    ],
    scope: TEAM_EVERYONE_ID,
    tags: ["virtuoso", "events", "2026"],
    status: "processed",
    processedAt: "2026-03-12T17:00:00Z",
  },
  {
    id: "email-004",
    subject: "Client Request — Eric Tournier, December Ski Trip",
    senderEmail: "eric.tournier@gmail.com",
    senderName: "Eric Tournier",
    receivedAt: "2026-03-17T11:20:00Z",
    forwardedBy: "user-claire",
    forwardedByName: "Claire Dubois",
    ownerId: "user-claire",
    bodyText:
      "Hi Claire,\n\nAs discussed, Marie and I would love to plan a ski trip for December 2026. Our preferences:\n\n- Courchevel or Verbier (open to suggestions)\n- 5-7 nights over Christmas / New Year\n- Ski-in/ski-out if possible\n- The kids (ages 8, 12) will need ski school\n- Budget: flexible but let's keep it under €30k total\n\nWe loved the chalet you found us last year in Megève. Something similar would be perfect.\n\nThanks!\nEric",
    attachments: [],
    scope: "private",
    tags: ["unprocessed"],
    status: "unprocessed",
  },
  {
    id: "email-005",
    subject: "FW: Archived supplier contract (reference)",
    senderEmail: "contracts@supplier.example",
    senderName: "Supplier Contracts",
    receivedAt: "2026-03-08T08:00:00Z",
    forwardedBy: "user-alex-former",
    forwardedByName: "Alex Rivera",
    forwarder_departed: true,
    ownerId: "1",
    bodyText:
      "Please see attached for reference. Forwarded into the vault while Alex was still active; forwarder account is now inactive — access and retention follow your agency policy.",
    attachments: [],
    scope: TEAM_EVERYONE_ID,
    tags: ["reference"],
    status: "processed",
    processedAt: "2026-03-08T09:00:00Z",
  },
];

export const MOCK_EMAIL_INGESTIONS: EmailIngestion[] = withParentRefs(RAW);

export function getUnprocessedEmailCount(): number {
  return MOCK_EMAIL_INGESTIONS.filter((e) => e.status === "unprocessed").length;
}

export function getEmailById(id: string): EmailIngestion | undefined {
  return MOCK_EMAIL_INGESTIONS.find((e) => e.id === id);
}

export function getAttachmentById(attId: string): { email: EmailIngestion; attachment: EmailAttachment } | undefined {
  for (const email of MOCK_EMAIL_INGESTIONS) {
    const attachment = email.attachments.find((a) => a.id === attId);
    if (attachment) return { email, attachment };
  }
  return undefined;
}
