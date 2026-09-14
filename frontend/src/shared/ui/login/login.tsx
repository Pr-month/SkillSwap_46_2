import type { FC } from "react";
import type { LoginUIProps } from "./types";
import styles from "./login.module.css";
import lightBulb from "../../../assets/images/light-bulb.svg";

import divider from "../../../assets/images/Divider.svg";
import { Button } from "../button";
import { Link } from "react-router-dom";
import { BasicInput } from "../input/basic-input";
import { AuthLayout } from "../auth-layout";
import { PasswordInput } from "../input/password-input";
import { Icon } from "../icon";

export const LoginUI: FC<LoginUIProps> = ({
  email,
  setEmail,
  errorText,
  handleSubmit,
  password,
  setPassword,
  onYandexLogin,
}) => (
  <AuthLayout
    type="login"
    title="Вход"
    image={lightBulb}
    description={{
      title: "С возвращением в SkillSwap!",
      text: "Обменивайтесь знаниями и навыками с другими людьми",
    }}
  >
    <div className={styles.login__form}>
      <div className={styles.accounts}>
        <button
          type="button"
          className={styles.account__yandex}
          onClick={onYandexLogin}
        >
          <span className={styles.yandexLogo} aria-hidden="true">
            Я
          </span>
          <span>Продолжить с Яндекс ID</span>
        </button>
        <div className={styles.account__apple}>
          <Icon name="apple" size={24} color="currentColor" />
          <span>Продолжить с Apple</span>
        </div>
      </div>
      <div className={styles.divider}>
        <img src={divider} alt="Разделитель" />
        <span>или</span>
        <img src={divider} alt="Разделитель" />
      </div>
      <form className={styles.form} name="login" onSubmit={handleSubmit}>
        <div className={styles.form__with__error}>
          <div className={styles.form__fields}>
            <BasicInput
              label="Email"
              placeholder="Введите email"
              onChange={(value) => setEmail(value)}
              value={email}
              error={!!errorText && !email}
              required
            />
            <PasswordInput
              label="Пароль"
              placeholder="Введите пароль"
              onChange={(value) => setPassword(value)}
              value={password}
              error={!!errorText && !password}
              required
            />
          </div>
          {errorText && <p className={styles.error}>{errorText}</p>}
        </div>
        <div className={styles.forms__buttons}>
          <Button variant="primary" type="submit">
            Войти
          </Button>
          <Link to="/registration" className={styles.registration__link}>
            Зарегистрироваться
          </Link>
        </div>
      </form>
    </div>
  </AuthLayout>
);
