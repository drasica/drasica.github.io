// Add the final CV destination when available.
window.portfolioLinks = {
  cv: null,
  email: 'mailto:drasica.k@gmail.com',
  telegram: 'https://t.me/kadariart',
  instagram: 'https://www.instagram.com/kadariart/',
  blog: 'https://www.instagram.com/kadariart/'
};

// First visit: Russian for visitors whose clock is set to a Russian time zone, English for everyone else.
// A language picked with the switch is remembered and always wins.
window.portfolioStartLanguage = () => {
  try {
    const saved = localStorage.getItem('portfolio-language');
    if (saved === 'ru' || saved === 'en') return saved;
  } catch {}
  const russianZones = ['Europe/Moscow', 'Europe/Simferopol', 'Europe/Kaliningrad', 'Europe/Samara', 'Europe/Volgograd', 'Europe/Saratov', 'Europe/Ulyanovsk', 'Europe/Astrakhan', 'Europe/Kirov',
    'Asia/Yekaterinburg', 'Asia/Omsk', 'Asia/Novosibirsk', 'Asia/Barnaul', 'Asia/Tomsk', 'Asia/Novokuznetsk', 'Asia/Krasnoyarsk', 'Asia/Irkutsk', 'Asia/Chita', 'Asia/Yakutsk', 'Asia/Khandyga',
    'Asia/Vladivostok', 'Asia/Ust-Nera', 'Asia/Magadan', 'Asia/Sakhalin', 'Asia/Srednekolymsk', 'Asia/Kamchatka', 'Asia/Anadyr'];
  try { return russianZones.includes(Intl.DateTimeFormat().resolvedOptions().timeZone) ? 'ru' : 'en'; } catch { return 'en'; }
};
