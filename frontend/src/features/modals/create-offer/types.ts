export type CreateOfferVariant =
  | "accepted"
  | "created"
  | "registration"
  | "sent"
  | "noSkill";

export interface CreateOfferProps {
  variant: CreateOfferVariant;
  onActionClick: () => void;
}
