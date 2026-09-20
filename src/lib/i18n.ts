import { useEffect, useState } from "react";

export type SupportedLanguage = "es" | "en" | "fr" | "pt";

const LANG_KEY = "domino_language";

export const LANGUAGES: { code: SupportedLanguage; label: string; full: string }[] = [
  { code: "es", label: "ES", full: "Español" },
  { code: "en", label: "EN", full: "English" },
  { code: "fr", label: "FR", full: "Français" },
  { code: "pt", label: "PT", full: "Português" },
];

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  es: {
    // Nav
    "nav.home": "Inicio",
    "nav.play": "Jugar (Bots)",
    "nav.live": "En vivo",
    "nav.tournaments": "Torneos",
    "nav.plans": "Planes",
    "nav.friends": "Amigos",
    "nav.ranking": "Ranking",
    "nav.settings": "Ajustes",

    // Home
    "home.tagline": "Dominó cubano · doble 6 y doble 9 · en pareja o 1 vs 1",
    "home.level": "Nv",
    "home.loginPrompt": "Entra con tu cuenta para guardar tu nivel, ranking y amigos.",
    "home.loginBtn": "Iniciar sesión",
    "home.playBots": "Jugar contra Bots",
    "home.noLogin": "Sin iniciar sesión",
    "home.onlineMatches": "Partidas online",
    "home.requireAccount": "Requiere cuenta",
    "home.playInPairs": "Jugar en pareja (2 vs 2)",
    "home.duel": "Duelo 1 vs 1",
    "home.double6": "Doble 6 tradicional (28 fichas)",
    "home.double9": "Doble 9 tradicional (55 fichas)",
    "home.matchmakingHint": "Emparejamiento por ELO según jugadores conectados.",
    "home.customTables": "Mesas con amigos o código",
    "home.customTablesDesc": "Crea tu mesa privada o entra con el código de 4 dígitos.",
    "home.createTable": "Crear o unirse a mesa",
    "home.activeTournaments": "Torneos activos",
    "home.viewAllTournaments": "Ver todos los torneos →",
    "home.topRanking": "Top Ranking",
    "home.viewRanking": "Ver tabla completa →",
    "home.helpTitle": "Ayuda y Reglas del Dominó",
    "home.helpDesc":
      "Aprende las reglas oficiales del dominó cubano (doble 6 y doble 9), cómo funciona el tranque, conteo de puntos de salida y juego en parejas.",
    "home.helpBtn": "Ver Guía de Ayuda →",

    // Footer
    "footer.rights": "Todos los derechos reservados",
    "footer.legal": "Aviso legal",
    "footer.cookies": "Cookies",
    "footer.help": "Ayuda",
    "footer.close": "Cerrar",

    // Ajustes / Subscripción
    "settings.title": "Ajustes",
    "settings.needLogin": "Entra con tu cuenta para ver los ajustes.",
    "settings.name": "Nombre",
    "settings.sound": "Efectos de sonido",
    "settings.soundDesc":
      "Activa o silencia el golpe de fichas, pase, victorias y alertas del juego.",
    "settings.subscription": "Subscripción",
    "settings.subscriptionDesc": "Estado de tu cuenta y tiempo restante del plan contratado.",
    "settings.activePlan": "Plan activo",
    "settings.freePlan": "Cuenta Gratuita",
    "settings.freePlanDesc": "30 minutos de juego cada 48 horas.",
    "settings.pendingApproval": "Compra en revisión",
    "settings.pendingApprovalDesc": "Registraste un pago. Se activará en cuanto sea aprobado.",
    "settings.remaining": "Tiempo restante",
    "settings.expiresOn": "Vence el",
    "settings.unlimitedPlay": "Juego ilimitado sin cortes",
    "settings.upgrade": "Adquirir un Plan",
    "settings.managePlans": "Ver o renovar planes",
    "settings.tableTheme": "Tema de mesa",
    "settings.tileDesign": "Diseño de fichas",
    "settings.flag": "Bandera de la mesa",
    "settings.avatarFrame": "Marco de avatar",
    "settings.userTitle": "Título",
    "settings.logout": "Cerrar sesión",
    "settings.days": "días",
    "settings.hours": "horas",
    "settings.minutes": "minutos",
    "settings.expired": "Plan expirado",
  },
  en: {
    // Nav
    "nav.home": "Home",
    "nav.play": "Play (Bots)",
    "nav.live": "Live",
    "nav.tournaments": "Tournaments",
    "nav.plans": "Plans",
    "nav.friends": "Friends",
    "nav.ranking": "Ranking",
    "nav.settings": "Settings",

    // Home
    "home.tagline": "Cuban Domino · double 6 and double 9 · pairs or 1 vs 1",
    "home.level": "Lvl",
    "home.loginPrompt": "Sign in with your account to save your level, ranking and friends.",
    "home.loginBtn": "Sign In",
    "home.playBots": "Play against Bots",
    "home.noLogin": "No login required",
    "home.onlineMatches": "Online Matches",
    "home.requireAccount": "Account required",
    "home.playInPairs": "Play in pairs (2 vs 2)",
    "home.duel": "Duel 1 vs 1",
    "home.double6": "Traditional Double 6 (28 tiles)",
    "home.double9": "Traditional Double 9 (55 tiles)",
    "home.matchmakingHint": "ELO matchmaking with currently online players.",
    "home.customTables": "Tables with friends or code",
    "home.customTablesDesc": "Create your private table or join using a 4-digit code.",
    "home.createTable": "Create or join table",
    "home.activeTournaments": "Active Tournaments",
    "home.viewAllTournaments": "View all tournaments →",
    "home.topRanking": "Top Ranking",
    "home.viewRanking": "View full leaderboard →",
    "home.helpTitle": "Domino Help & Rules",
    "home.helpDesc":
      "Learn official Cuban domino rules (double 6 & double 9), blocked games, opening point counting, and team partnership play.",
    "home.helpBtn": "View Help Guide →",

    // Footer
    "footer.rights": "All rights reserved",
    "footer.legal": "Legal notice",
    "footer.cookies": "Cookies",
    "footer.help": "Help",
    "footer.close": "Close",

    // Ajustes / Subscripción
    "settings.title": "Settings",
    "settings.needLogin": "Sign in to view your settings.",
    "settings.name": "Username",
    "settings.sound": "Sound Effects",
    "settings.soundDesc": "Enable or mute tile slams, passes, victories, and game alerts.",
    "settings.subscription": "Subscription",
    "settings.subscriptionDesc": "Your account status and remaining time on your purchased plan.",
    "settings.activePlan": "Active Plan",
    "settings.freePlan": "Free Account",
    "settings.freePlanDesc": "30 minutes of free play every 48 hours.",
    "settings.pendingApproval": "Purchase under review",
    "settings.pendingApprovalDesc": "Payment recorded. Will activate as soon as admin approves.",
    "settings.remaining": "Remaining time",
    "settings.expiresOn": "Expires on",
    "settings.unlimitedPlay": "Unlimited gameplay with no limits",
    "settings.upgrade": "Get a Plan",
    "settings.managePlans": "View or renew plans",
    "settings.tableTheme": "Table theme",
    "settings.tileDesign": "Tile skin",
    "settings.flag": "Table flag",
    "settings.avatarFrame": "Avatar frame",
    "settings.userTitle": "Title",
    "settings.logout": "Sign out",
    "settings.days": "days",
    "settings.hours": "hours",
    "settings.minutes": "minutes",
    "settings.expired": "Plan expired",
  },
  fr: {
    // Nav
    "nav.home": "Accueil",
    "nav.play": "Jouer (Bots)",
    "nav.live": "En direct",
    "nav.tournaments": "Tournois",
    "nav.plans": "Abonnements",
    "nav.friends": "Amis",
    "nav.ranking": "Classement",
    "nav.settings": "Paramètres",

    // Home
    "home.tagline": "Domino cubain · double 6 et double 9 · en équipes ou 1 contre 1",
    "home.level": "Niv",
    "home.loginPrompt": "Connectez-vous pour enregistrer votre niveau, classement et amis.",
    "home.loginBtn": "Connexion",
    "home.playBots": "Jouer contre l'IA",
    "home.noLogin": "Sans connexion",
    "home.onlineMatches": "Parties en ligne",
    "home.requireAccount": "Compte requis",
    "home.playInPairs": "Jouer en équipes (2 contre 2)",
    "home.duel": "Duel 1 contre 1",
    "home.double6": "Double 6 traditionnel (28 tuiles)",
    "home.double9": "Double 9 traditionnel (55 tuiles)",
    "home.matchmakingHint": "Matchmaking par classement ELO selon les joueurs connectés.",
    "home.customTables": "Tables privées ou avec code",
    "home.customTablesDesc": "Créez votre table privée ou rejoignez avec un code à 4 chiffres.",
    "home.createTable": "Créer ou rejoindre une table",
    "home.activeTournaments": "Tournois actifs",
    "home.viewAllTournaments": "Voir tous les tournois →",
    "home.topRanking": "Meilleurs joueurs",
    "home.viewRanking": "Voir le classement complet →",
    "home.helpTitle": "Aide et Règles du Domino",
    "home.helpDesc":
      "Découvrez les règles officielles du domino cubain (double 6 et double 9), le blocage et le jeu en partenariat.",
    "home.helpBtn": "Voir le guide d'aide →",

    // Footer
    "footer.rights": "Tous droits réservés",
    "footer.legal": "Mentions légales",
    "footer.cookies": "Cookies",
    "footer.help": "Aide",
    "footer.close": "Fermer",

    // Ajustes / Subscripción
    "settings.title": "Paramètres",
    "settings.needLogin": "Connectez-vous pour accéder aux paramètres.",
    "settings.name": "Nom d'utilisateur",
    "settings.sound": "Effets sonores",
    "settings.soundDesc": "Activez ou coupez les sons de pose, passe, victoires et alertes.",
    "settings.subscription": "Abonnement",
    "settings.subscriptionDesc": "Statut de votre compte et durée restante de votre abonnement.",
    "settings.activePlan": "Abonnement actif",
    "settings.freePlan": "Compte Gratuit",
    "settings.freePlanDesc": "30 minutes de jeu gratuites toutes les 48 heures.",
    "settings.pendingApproval": "Achat en attente",
    "settings.pendingApprovalDesc":
      "Paiement enregistré. Activation dès validation administrative.",
    "settings.remaining": "Temps restant",
    "settings.expiresOn": "Expire le",
    "settings.unlimitedPlay": "Jeu illimité sans interruption",
    "settings.upgrade": "Obtenir un abonnement",
    "settings.managePlans": "Voir ou renouveler",
    "settings.tableTheme": "Thème de la table",
    "settings.tileDesign": "Style des tuiles",
    "settings.flag": "Drapeau de table",
    "settings.avatarFrame": "Cadre d'avatar",
    "settings.userTitle": "Titre",
    "settings.logout": "Déconnexion",
    "settings.days": "jours",
    "settings.hours": "heures",
    "settings.minutes": "minutes",
    "settings.expired": "Abonnement expiré",
  },
  pt: {
    // Nav
    "nav.home": "Início",
    "nav.play": "Jogar (Bots)",
    "nav.live": "Ao vivo",
    "nav.tournaments": "Torneios",
    "nav.plans": "Planos",
    "nav.friends": "Amigos",
    "nav.ranking": "Ranking",
    "nav.settings": "Configurações",

    // Home
    "home.tagline": "Dominó cubano · duplo 6 e duplo 9 · em duplas ou 1 contra 1",
    "home.level": "Nv",
    "home.loginPrompt": "Entre com sua conta para salvar seu nível, classificação e amigos.",
    "home.loginBtn": "Entrar",
    "home.playBots": "Jogar contra Bots",
    "home.noLogin": "Sem login",
    "home.onlineMatches": "Partidas online",
    "home.requireAccount": "Requer conta",
    "home.playInPairs": "Jogar em duplas (2 vs 2)",
    "home.duel": "Duelo 1 vs 1",
    "home.double6": "Duplo 6 tradicional (28 pedras)",
    "home.double9": "Duplo 9 tradicional (55 pedras)",
    "home.matchmakingHint": "Emparelhamento por ELO de acordo com os jogadores conectados.",
    "home.customTables": "Mesas com amigos ou código",
    "home.customTablesDesc": "Crie sua mesa privada ou entre com o código de 4 dígitos.",
    "home.createTable": "Criar ou entrar na mesa",
    "home.activeTournaments": "Torneios ativos",
    "home.viewAllTournaments": "Ver todos os torneios →",
    "home.topRanking": "Top Ranking",
    "home.viewRanking": "Ver tabela completa →",
    "home.helpTitle": "Ajuda e Regras do Dominó",
    "home.helpDesc":
      "Aprenda as regras oficiais do dominó cubano (duplo 6 e duplo 9), fechamento de jogo e contagem de pontos.",
    "home.helpBtn": "Ver Guia de Ajuda →",

    // Footer
    "footer.rights": "Todos os direitos reservados",
    "footer.legal": "Aviso legal",
    "footer.cookies": "Cookies",
    "footer.help": "Ajuda",
    "footer.close": "Fechar",

    // Ajustes / Subscripción
    "settings.title": "Configurações",
    "settings.needLogin": "Entre com sua conta para ver as configurações.",
    "settings.name": "Nome de usuário",
    "settings.sound": "Efeitos sonoros",
    "settings.soundDesc": "Ative ou silencie o bater de pedras, passos, vitórias e alertas.",
    "settings.subscription": "Assinatura",
    "settings.subscriptionDesc": "Status da sua conta e tempo restante do plano contratado.",
    "settings.activePlan": "Plano ativo",
    "settings.freePlan": "Conta Gratuita",
    "settings.freePlanDesc": "30 minutos de jogo grátis a cada 48 horas.",
    "settings.pendingApproval": "Compra em análise",
    "settings.pendingApprovalDesc": "Pagamento registrado. Será ativado assim que for aprovado.",
    "settings.remaining": "Tempo restante",
    "settings.expiresOn": "Expira em",
    "settings.unlimitedPlay": "Jogo ilimitado sem restrições",
    "settings.upgrade": "Adquirir um Plano",
    "settings.managePlans": "Ver ou renovar planos",
    "settings.tableTheme": "Tema da mesa",
    "settings.tileDesign": "Design das pedras",
    "settings.flag": "Bandeira da mesa",
    "settings.avatarFrame": "Moldura de avatar",
    "settings.userTitle": "Título",
    "settings.logout": "Sair",
    "settings.days": "dias",
    "settings.hours": "horas",
    "settings.minutes": "minutos",
    "settings.expired": "Plano expirado",
  },
};

export function getLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "es";
  const stored = localStorage.getItem(LANG_KEY) as SupportedLanguage | null;
  if (stored && ["es", "en", "fr", "pt"].includes(stored)) {
    return stored;
  }
  return "es";
}

export function setLanguage(lang: SupportedLanguage): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_KEY, lang);
  document.documentElement.lang = lang;
  window.dispatchEvent(new CustomEvent("domino:language-changed", { detail: { lang } }));
}

export function translate(key: string, lang: SupportedLanguage = getLanguage()): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.es;
  return dict[key] ?? TRANSLATIONS.es[key] ?? key;
}

export function useI18n() {
  const [lang, setLangState] = useState<SupportedLanguage>(getLanguage());

  useEffect(() => {
    const handleLang = (e: Event) => {
      const ce = e as CustomEvent<{ lang: SupportedLanguage }>;
      if (ce.detail?.lang) {
        setLangState(ce.detail.lang);
      } else {
        setLangState(getLanguage());
      }
    };
    window.addEventListener("domino:language-changed", handleLang);
    return () => {
      window.removeEventListener("domino:language-changed", handleLang);
    };
  }, []);

  const t = (key: string) => translate(key, lang);

  const changeLanguage = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setLangState(newLang);
  };

  return {
    lang,
    t,
    setLanguage: changeLanguage,
  };
}
