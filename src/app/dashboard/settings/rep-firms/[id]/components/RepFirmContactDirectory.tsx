"use client";

import { Mail, Phone, Users } from "lucide-react";

interface Contact {
  name: string;
  email: string;
  phone?: string;
  roles: string[];
  notes?: string;
}

interface RepFirmContactDirectoryProps {
  contacts: Contact[];
}

export function RepFirmContactDirectory({ contacts }: RepFirmContactDirectoryProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#161616] p-6">
      <div className="mb-4 flex items-center gap-2">
        <Users className="h-4 w-4 text-[#C9A96E]" />
        <h2 className="text-sm font-semibold text-[#F5F0EB]">Contact Directory</h2>
      </div>

      <div className="space-y-3">
        {contacts.map((contact, idx) => (
          <div
            key={`${contact.email}-${idx}`}
            className="rounded-lg border border-white/[0.05] bg-[#0a0a0f] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#F5F0EB]">{contact.name}</p>

                {/* Roles */}
                {contact.roles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {contact.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded bg-white/[0.08] px-2 py-0.5 text-2xs text-[#9B9590] capitalize"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}

                {/* Contact Links */}
                <div className="mt-3 flex flex-col gap-2 text-2xs">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="inline-flex items-center gap-2 text-[#C9A96E] transition-colors hover:text-[#d4b87e]"
                    >
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="break-all">{contact.email}</span>
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="inline-flex items-center gap-2 text-[#F5F0EB] transition-colors hover:text-[#C9A96E]"
                    >
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      <span>{contact.phone}</span>
                    </a>
                  )}
                </div>

                {/* Notes */}
                {contact.notes && <p className="mt-2 text-2xs italic text-[#9B9590]">{contact.notes}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
