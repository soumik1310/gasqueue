export const CYLINDER_DEFAULTS = {
  domestic_14_2kg: {
    label: "Domestic 14.2 kg",
    days: 30,
    range: [25, 45],
    isEstimate: false,
    note: "Typical for a family of 4 cooking 3 meals a day. Bigger families run out sooner.",
    sources: [
      {
        name: "Siasat explainer",
        url: "https://www.siasat.com/ride-out-lpg-shortage-an-explainer-on-how-to-make-your-cylinder-last-longer-3434599/",
      },
      {
        name: "WION",
        url: "https://www.wionews.com/photos/how-long-a-14-2-kg-lpg-cylinder-should-last-in-an-average-indian-household-1773490952278",
      },
      {
        name: "Desi Utility LPG calculator",
        url: "https://desiutility.com/lpg-cylinder-usage-calculator",
      },
      {
        name: "Lok Sabha document",
        url: "https://eparlib.sansad.in/bitstream/123456789/738160/1/4721.pdf",
      },
    ],
  },

  commercial_19kg: {
    label: "Commercial 19 kg",
    days: 10,
    range: [2, 21],
    isEstimate: true,
    note: "Varies hugely by business. Busy restaurants can use a cylinder in under a day. Set the expected cycle per customer for better predictions.",
    sources: [
      {
        name: "Kotak Neo (restaurant consumption)",
        url: "https://www.kotakneo.com/news/market-news/restaurant-fuel-shortage-may-hit-swiggy-zomato-orders",
      },
      {
        name: "The Core",
        url: "https://www.thecore.in/opinion/the-plinth/india-gas-lng-png-piped-gas-west-asia-commercial-cylinder-860319",
      },
      {
        name: "Desi Utility",
        url: "https://desiutility.com/gas",
      },
    ],
  },
};

// the number of days used by the prediction (tier 3)
export function getDefaultDays(cylinderType) {
  const entry = CYLINDER_DEFAULTS[cylinderType] || CYLINDER_DEFAULTS.domestic_14_2kg;
  return entry.days;
}