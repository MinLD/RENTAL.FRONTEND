import type { ReactNode } from "react";

import styles from "./auth-layout.module.css";

type AuthLayoutProps = Readonly<{
  children: ReactNode;
}>;

const AUTH_BACKGROUND_IMAGE = "/images/auth-preview-bg.avif";

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={styles.root}>
      <div aria-hidden="true">
        <div className={styles.backgroundUnderlay} />
        <div
          className={styles.backgroundUnderlayImage}
          style={{ backgroundImage: `url(${AUTH_BACKGROUND_IMAGE})` }}
        />
      </div>

      <div className={styles.mediaCircle}>
        <div className={styles.mediaWrapper}>
          <div
            aria-hidden="true"
            className={styles.mediaImage}
            style={{ backgroundImage: `url(${AUTH_BACKGROUND_IMAGE})` }}
          />

          <div className={styles.leftInfo}>
            <div>
              <p className={styles.logo}>
                DP<span>RENTAL</span>
              </p>
              <p className={styles.logoCaption}>Sàn thiết bị công trường</p>
            </div>

            {/* <p className={styles.heroText}>
              Kiến tạo tiên phong đồng hành phát triển
            </p> */}

            <p className={styles.copyright}>
              © 2026 DPRENTAL. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className={styles.borderCircle} />

      <main className={styles.main}>
        <div className={styles.formSection}>
          <div className={styles.formBoundary}>
            <div className={styles.formWrapper}>
              <div className={styles.formHeader}>
                <div className={styles.mobileLogo}>
                  <p className={styles.mobileLogoText}>
                    DP<span>RENTAL</span>
                  </p>
                </div>

                {/* <button className={styles.languageButton} type="button">
                  <span className={styles.languageBadge}>VN</span>
                  Tiếng Việt
                </button> */}
              </div>

              <div>
                <div className={styles.mobileCaption}>
                  Sàn thiết bị công trường
                </div>
                {children}
              </div>

              <p className={styles.formFooter}></p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
