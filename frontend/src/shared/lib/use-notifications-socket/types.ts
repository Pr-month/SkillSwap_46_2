export type TNotificationType =
  | "NEW_REQUEST"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED";

export type TSocketNotification = {
  id?: string;
  type: TNotificationType;
  skillName: string;
  fromUser: string;
  isRead?: boolean;
  createdAt?: string;
};

export type TUseNotificationsSocketOptions = {
  enabled: boolean;
  onNotification: (notification: TSocketNotification) => void;
};
