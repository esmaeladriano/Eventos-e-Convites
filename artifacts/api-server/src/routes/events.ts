import { Router, type IRouter } from "express";
import {
  CancelInviteParams,
  CreateEventBody,
  CreateInviteBody,
  CreateInviteParams,
  GetEventParams,
  ValidateInviteParams,
} from "@workspace/api-zod";

type Invite = {
  id: string;
  eventId: string;
  guestName: string;
  contact: string | null;
  code: string;
  status: string;
  checkedInAt: string | null;
  createdAt: string;
};

type Event = {
  id: string;
  name: string;
  type: string;
  startsAt: string;
  location: string;
  description: string;
  capacity: number;
  coverUrl: string;
  inviteCount: number;
  checkedInCount: number;
  status: string;
};

const router: IRouter = Router();

const events: Event[] = [
  {
    id: "evt-luanda",
    name: "Noite Tropical",
    type: "festa",
    startsAt: "2026-09-12T19:00:00.000Z",
    location: "Casa Jardim, Luanda",
    description: "Uma noite de música, sabores e bons encontros.",
    capacity: 180,
    coverUrl:
      "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85",
    inviteCount: 124,
    checkedInCount: 86,
    status: "upcoming",
  },
  {
    id: "evt-casamento",
    name: "Ana & Miguel",
    type: "casamento",
    startsAt: "2026-10-03T15:30:00.000Z",
    location: "Quinta das Acácias",
    description: "A celebração de uma nova história.",
    capacity: 240,
    inviteCount: 201,
    checkedInCount: 0,
    coverUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85",
    status: "upcoming",
  },
];

const invites: Invite[] = [
  {
    id: "inv-1",
    eventId: "evt-luanda",
    guestName: "Marta Joaquim",
    contact: "+244 923 555 020",
    code: "NT-8F4K2",
    status: "checked_in",
    checkedInAt: "2026-09-12T19:42:00.000Z",
    createdAt: "2026-08-02T10:20:00.000Z",
  },
  {
    id: "inv-2",
    eventId: "evt-luanda",
    guestName: "Paulo Ferreira",
    contact: "+244 934 222 115",
    code: "NT-2A9Q7",
    status: "valid",
    checkedInAt: null,
    createdAt: "2026-08-04T09:10:00.000Z",
  },
  {
    id: "inv-3",
    eventId: "evt-luanda",
    guestName: "Carla Manuel",
    contact: null,
    code: "NT-5L1X8",
    status: "cancelled",
    checkedInAt: null,
    createdAt: "2026-08-05T14:05:00.000Z",
  },
];

function eventWithCounts(event: Event): Event {
  const eventInvites = invites.filter((invite) => invite.eventId === event.id);
  return {
    ...event,
    inviteCount: eventInvites.length || event.inviteCount,
    checkedInCount:
      eventInvites.filter((invite) => invite.status === "checked_in").length ||
      event.checkedInCount,
  };
}

router.get("/events", (_req, res) => {
  res.json(events.map(eventWithCounts));
});

router.post("/events", (req, res) => {
  const input = CreateEventBody.parse(req.body);
  const event: Event = {
    id: `evt-${Date.now()}`,
    ...input,
    startsAt: input.startsAt.toISOString(),
    inviteCount: 0,
    checkedInCount: 0,
    status: "upcoming",
  };
  events.unshift(event);
  res.status(201).json(event);
});

router.get("/events/:id", (req, res) => {
  const { id } = GetEventParams.parse(req.params);
  const event = events.find((candidate) => candidate.id === id);
  if (!event) {
    res.status(404).json({ error: "Evento não encontrado" });
    return;
  }
  res.json({ ...eventWithCounts(event), invites: invites.filter((invite) => invite.eventId === id) });
});

router.post("/events/:id/invites", (req, res) => {
  const { id } = CreateInviteParams.parse(req.params);
  const input = CreateInviteBody.parse(req.body);
  const event = events.find((candidate) => candidate.id === id);
  if (!event) {
    res.status(404).json({ error: "Evento não encontrado" });
    return;
  }
  const count = invites.filter((invite) => invite.eventId === id && invite.status !== "cancelled").length;
  if (count >= event.capacity) {
    res.status(409).json({ error: "A capacidade deste evento foi atingida." });
    return;
  }
  const invite: Invite = {
    id: `inv-${Date.now()}`,
    eventId: id,
    guestName: input.guestName,
    contact: input.contact ?? null,
    code: `${event.name.slice(0, 2).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    status: "valid",
    checkedInAt: null,
    createdAt: new Date().toISOString(),
  };
  invites.unshift(invite);
  res.status(201).json(invite);
});

router.post("/invites/:code/cancel", (req, res) => {
  const { code } = CancelInviteParams.parse(req.params);
  const invite = invites.find((candidate) => candidate.code === code);
  if (!invite) {
    res.status(404).json({ error: "Convite não encontrado" });
    return;
  }
  invite.status = "cancelled";
  res.json(invite);
});

router.post("/invites/:code/validate", (req, res) => {
  const { code } = ValidateInviteParams.parse(req.params);
  const invite = invites.find((candidate) => candidate.code.toLowerCase() === code.toLowerCase());
  if (!invite) {
    res.json({ valid: false, message: "Código inexistente", invite: { id: "", eventId: "", guestName: "", contact: null, code, status: "not_found", checkedInAt: null, createdAt: new Date().toISOString() } });
    return;
  }
  if (invite.status === "cancelled") {
    res.json({ valid: false, message: "Convite cancelado", invite });
    return;
  }
  if (invite.status === "checked_in") {
    res.json({ valid: false, message: "Convite já utilizado", invite });
    return;
  }
  invite.status = "checked_in";
  invite.checkedInAt = new Date().toISOString();
  res.json({ valid: true, message: "Entrada confirmada", invite });
});

export default router;