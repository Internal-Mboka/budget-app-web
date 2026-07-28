export type PwaBrowserId =
  | "chrome"
  | "edge"
  | "opera"
  | "samsung"
  | "firefox-android"
  | "firefox-desktop"
  | "safari-ios"
  | "safari-macos"
  | "unknown";

export type PwaInstallGuide = {
  browserId: PwaBrowserId;
  browserLabel: string;
  title: string;
  intro: string;
  steps: string[];
  footnote?: string;
  /** Installation en un clic via beforeinstallprompt (Chrome, Edge…). */
  supportsOneClickInstall: boolean;
  /** Étapes manuelles réalistes pour ce navigateur. */
  supportsManualInstall: boolean;
};

const GUIDES: Record<PwaBrowserId, Omit<PwaInstallGuide, "browserId">> = {
  chrome: {
    browserLabel: "Google Chrome",
    title: "Installation avec Chrome",
    intro: "Chrome permet d'installer Mboka Budget directement sur votre appareil.",
    steps: [
      "Cliquez sur le bouton « Installer Mboka Budget » ci-dessus si une fenêtre s'ouvre.",
      "Sinon, repérez l'icône d'installation (⊕ ou écran) à droite de la barre d'adresse.",
      "Vous pouvez aussi ouvrir le menu ⋮ en haut à droite, puis « Installer Mboka Budget » ou « Installer l'application ».",
    ],
    supportsOneClickInstall: true,
    supportsManualInstall: true,
  },
  edge: {
    browserLabel: "Microsoft Edge",
    title: "Installation avec Edge",
    intro: "Edge permet d'installer Mboka Budget comme une application Windows ou Mac.",
    steps: [
      "Cliquez sur le bouton « Installer Mboka Budget » ci-dessus si une fenêtre s'ouvre.",
      "Sinon, ouvrez le menu « … » en haut à droite.",
      "Choisissez « Applications », puis « Installer ce site en tant qu'application ».",
    ],
    supportsOneClickInstall: true,
    supportsManualInstall: true,
  },
  opera: {
    browserLabel: "Opera",
    title: "Installation avec Opera",
    intro: "Opera reprend les options d'installation des navigateurs Chromium.",
    steps: [
      "Cliquez sur le bouton « Installer Mboka Budget » ci-dessus si une fenêtre s'ouvre.",
      "Sinon, ouvrez le menu Opera en haut à gauche.",
      "Allez dans « Installer… » ou « Ajouter à l'écran d'accueil » selon votre appareil.",
    ],
    supportsOneClickInstall: true,
    supportsManualInstall: true,
  },
  samsung: {
    browserLabel: "Samsung Internet",
    title: "Installation sur Samsung Internet",
    intro: "Ajoutez Mboka Budget à votre écran d'accueil Android.",
    steps: [
      "Appuyez sur le menu ≡ en bas de l'écran.",
      "Choisissez « Ajouter page à » puis « Écran d'accueil ».",
      "Confirmez le nom « Mboka Budget », puis validez.",
    ],
    supportsOneClickInstall: false,
    supportsManualInstall: true,
  },
  "firefox-android": {
    browserLabel: "Firefox (Android)",
    title: "Installation sur Firefox mobile",
    intro: "Sur Android, Firefox peut ajouter Mboka Budget à votre écran d'accueil.",
    steps: [
      "Appuyez sur le menu ⋮ en haut à droite.",
      "Choisissez « Installer » ou « Ajouter à l'écran d'accueil » si l'option apparaît.",
      "Sinon, ouvrez ce site dans Chrome pour une installation en un clic.",
    ],
    footnote: "L'option exacte peut varier selon la version de Firefox.",
    supportsOneClickInstall: false,
    supportsManualInstall: true,
  },
  "firefox-desktop": {
    browserLabel: "Firefox",
    title: "Firefox ne propose pas l'installation",
    intro:
      "Sur ordinateur, Firefox n'offre pas l'installation d'applications web (PWA). Ce n'est pas un problème de Mboka Budget.",
    steps: [
      "Pour installer l'application, ouvrez ce site dans Google Chrome ou Microsoft Edge.",
      "Connectez-vous avec le même compte : le bouton « Installer Mboka Budget » fonctionnera automatiquement.",
      "Vous pouvez aussi continuer sur Firefox sans installation — la version web reste disponible.",
    ],
    footnote: "Astuce : ajoutez mboka.studio à vos favoris Firefox pour un accès rapide en attendant.",
    supportsOneClickInstall: false,
    supportsManualInstall: false,
  },
  "safari-ios": {
    browserLabel: "Safari (iPhone / iPad)",
    title: "Installation sur iPhone ou iPad",
    intro: "Sur iOS, l'installation passe par Safari et l'écran d'accueil.",
    steps: [
      "Ouvrez cette page dans Safari (pas dans Firefox ni Chrome sur iOS).",
      "Appuyez sur le bouton Partager en bas de l'écran.",
      "Faites défiler et choisissez « Sur l'écran d'accueil », puis « Ajouter ».",
    ],
    supportsOneClickInstall: false,
    supportsManualInstall: true,
  },
  "safari-macos": {
    browserLabel: "Safari (Mac)",
    title: "Installation sur Mac",
    intro: "Safari permet d'épingler Mboka Budget dans le Dock.",
    steps: [
      "Dans la barre de menus, cliquez sur « Fichier ».",
      "Choisissez « Ajouter au Dock » (macOS Sonoma ou plus récent).",
      "Sinon, ouvrez le site dans Chrome ou Edge pour une installation complète.",
    ],
    supportsOneClickInstall: false,
    supportsManualInstall: true,
  },
  unknown: {
    browserLabel: "Votre navigateur",
    title: "Installation recommandée",
    intro: "Tous les navigateurs ne proposent pas l'installation d'applications web.",
    steps: [
      "Pour une installation simple en un clic, utilisez Google Chrome ou Microsoft Edge.",
      "Sinon, cherchez « Installer l'application » ou « Ajouter à l'écran d'accueil » dans le menu de votre navigateur.",
      "Sur iPhone ou iPad, utilisez Safari → Partager → Sur l'écran d'accueil.",
    ],
    supportsOneClickInstall: false,
    supportsManualInstall: true,
  },
};

export function detectPwaBrowserId(userAgent: string): PwaBrowserId {
  const ua = userAgent;

  if (/iphone|ipad|ipod/i.test(ua)) {
    return "safari-ios";
  }

  if (/android/i.test(ua)) {
    if (/SamsungBrowser/i.test(ua)) {
      return "samsung";
    }

    if (/Firefox/i.test(ua)) {
      return "firefox-android";
    }

    if (/EdgA\//i.test(ua) || /Edg\//i.test(ua)) {
      return "edge";
    }

    if (/OPR\//i.test(ua)) {
      return "opera";
    }

    if (/Chrome/i.test(ua)) {
      return "chrome";
    }

    return "unknown";
  }

  if (/Edg\//i.test(ua)) {
    return "edge";
  }

  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) {
    return "opera";
  }

  if (/Firefox/i.test(ua)) {
    return "firefox-desktop";
  }

  if (/Chrome/i.test(ua)) {
    return "chrome";
  }

  if (/Safari/i.test(ua)) {
    return "safari-macos";
  }

  return "unknown";
}

export function getPwaInstallGuide(userAgent: string): PwaInstallGuide {
  const browserId = detectPwaBrowserId(userAgent);
  const guide = GUIDES[browserId];

  return {
    browserId,
    ...guide,
  };
}

/** Guide par défaut côté serveur — remplacé au montage client. */
export function getDefaultPwaInstallGuide(): PwaInstallGuide {
  return getPwaInstallGuide("");
}
