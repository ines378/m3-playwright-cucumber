Présentation :

Voici un exemple de framework d'automatisation de tests développé avec Playwright et Cucumber.

Playwright est un framework de tests et d'automatisation web. Il permet de tester Chromium, Firefox et WebKit avec une API unique. Playwright est conçu pour une automatisation web multiplateforme, performante, fiable et rapide.

Cucumber est un outil d'exécution de tests automatisés écrits en langage naturel. Grâce à ce langage, tous les membres de votre équipe peuvent les lire. Cette accessibilité favorise la communication, la collaboration et la confiance au sein de votre équipe. Cucumber prend en charge le développement piloté par le comportement (BDD). Au cœur de l'approche BDD de Cucumber se trouve son analyseur syntaxique, Gherkin.

# ETAPES COMPLETES -- CLONER LE PROJET ET LANCER PLAYWRIGHT + CUCUMBER
## 1) PRE-REQUIS
-   Windows 
-   Node.js LTS installé (https://nodejs.org)
-   Git installé
-   Accès au dépôt GitHub
-   Navigateur Chromium (installé par Playwright)
Vérification : node -v npm -v git --version
## 2) CREER UN DOSSIER DE TRAVAIL
Exemple : C:`\dev`{=tex}
Ouvrir PowerShell puis : cd C:`\dev`{=tex}
## 3) CLONER LE PROJET DEPUIS GITHUB
git clone
https://github.com/ines378/m3-playwright-cucumber.git
Puis : cd playwright-cucumber-sample
## 4) INSTALLER LES DEPENDANCES
npm install
npm ci
## 5) INSTALLER PLAYWRIGHT (navigateurs)
npx playwright install
## 6) LANCER LES TESTS CUCUMBER
cucumber-js features/web/m3.feature --require-module ts-node/register --require src/support/config/hooks.ts
ou npm run testm3
# FIN

