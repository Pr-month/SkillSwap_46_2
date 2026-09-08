export enum NotificationType {
  NEW_REQUEST = 'NEW_REQUEST',
  REQUEST_ACCEPTED = 'REQUEST_ACCEPTED',
  REQUEST_REJECTED = 'REQUEST_REJECTED',
}

export type NotificationPayload = {
  type: NotificationType;
  skillName: string;
  fromUser: string;
};
