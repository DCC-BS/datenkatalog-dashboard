export default defineAppConfig({
  dashboard: {
    showNavBar: false,
    logoHref: 'https://www.bs.ch',
    aboutLink: 'https://www.bs.ch/schwerpunkte/daten/databs/schwerpunkte/datenkatalog',
    aboutLabel: 'Über uns',
    footer: {
      contactLinks: [
        { href: 'https://www.bs.ch/pd/statistik', label: 'Statistisches Amt' },
        { href: 'https://www.bs.ch/daten/databs/dcc', label: 'DCC Data Competence Center' },
        { href: 'https://data.bs.ch/explore/dataset/100537/', label: 'Link zur Datenquelle' },
        {
          href: 'https://github.com/DCC-BS/datenkatalog-dashboard',
          label: 'Code auf Github',
          showGithubIcon: true,
        },
      ],
      metaLinks: [
        { href: 'https://www.bs.ch/', label: 'Startseite' },
        { href: 'https://www.bs.ch/datenschutzerklaerung', label: 'Datenschutz' },
      ],
      copyrightYear: new Date().getFullYear(),
    },
  },
})
