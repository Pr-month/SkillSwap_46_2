declare module 'passport-yandex' {
  import { Strategy as PassportStrategy } from 'passport';

  export type YandexEmail = {
    value: string;
  };

  export type Profile = {
    id: string;
    displayName?: string;
    username?: string;
    emails?: YandexEmail[];
    _json?: {
      default_email?: string;
      display_name?: string;
      real_name?: string;
    };
  };

  export type StrategyOptions = {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };

  export class Strategy extends PassportStrategy {
    constructor(
      options: StrategyOptions,
      verify: (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: Error | null, user?: unknown) => void,
      ) => void,
    );
  }
}
