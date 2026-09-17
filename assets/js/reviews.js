/* ==========================================================================
   INTERSTYLE — Client reviews (Google)

   THE ONE FILE TO EDIT when ratings change or new reviews are worth adding.
   Reviews are quoted word for word from the showrooms' Google listings
   (only spacing tidied); never reword one. Names are shortened to a first
   name and initial. The page shows three at random on every visit, and
   "See other reviews" cycles through the rest.

   Ratings and counts were read from Google Maps in September 2026 — refresh
   them every few months.
   ========================================================================== */

window.INTERSTYLE_REVIEWS = {

  places: [
    { city: 'Lagos', rating: 4.5, count: 298, placeId: 'ChIJ6Vr3SBb1OxARUGxdE69Ypjg' },
    { city: 'Abuja', rating: 4.7, count: 29,  placeId: 'ChIJIyETkvEKThARjqEgt2mkjf4' },
    { city: 'Accra', rating: 4.4, count: 9,   placeId: 'ChIJU1DxwPaF3w8RzGNF9MKQvHI' }
  ],

  reviews: [
    { name: 'Obiku E.', city: 'Abuja', stars: 5,
      text: 'The quality and class of items in Interstyle is impeccable. The personnel are also very friendly. Prices maybe relatively high, but the quality makes it worthwhile.' },
    { name: 'Laura', city: 'Accra', stars: 5,
      text: 'I’m really pleased with the service we received from Interstyle. Benjamins was efficient and proactive without being pushy. The products we purchased are working well - they helped us to correct a mistake our plumber made!' },
    { name: 'Nino C.', city: 'Lagos', stars: 5,
      text: 'Fitting for luxury tiles and sanitary wares for use in both office, highest residential and hospitality spaces. They’ve also got a home style outfit with lovely items.' },
    { name: 'Papriquá Food', city: 'Lagos', stars: 5,
      text: 'My absolute favorite tile and sanitary ware store.' },
    { name: 'Ranti O.', city: 'Lagos', stars: 5,
      text: 'Situated at 22A Ligali Ayorinde Street, V. I. This is a wonderful showroom for all kind of good and quality tiles, bathroom fittings and accessories.' },
    { name: 'Umar T.', city: 'Abuja', stars: 5,
      text: 'The quality product here is just incomparable....you just gotta love everything you see.' },
    { name: 'R.J.K.', city: 'Lagos', stars: 5,
      text: 'Great Show Room, Great People & Owners... Product is Top Quality, Parking Available. Recommended' },
    { name: 'M. U.', city: 'Abuja', stars: 4,
      text: 'Great options for sanitary ware and tiles! High end luxury!' }
  ]

};
