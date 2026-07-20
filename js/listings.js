/**
 * listings.js
 *
 * SAMPLE DATA ONLY. These are fictional listings for demo purposes so the
 * Property Search tab has something to browse and analyze. This app has no
 * live MLS or data-provider connection (that requires a licensed feed —
 * e.g. RentCast, ATTOM, or broker MLS access — which isn't available for a
 * personal project). Swapping this file for a real API response is the only
 * change needed to go live; see ROADMAP.md.
 */
const SAMPLE_LISTINGS = [
  {
    id: 'L1', address: '412 Maple Ridge Ct', city: 'Richmond', state: 'VA',
    price: 289000, beds: 3, baths: 2, sqft: 1450, yearBuilt: 1998,
    estRent: 2150, tax: 3200, insurance: 1300, hoa: 0
  },
  {
    id: 'L2', address: '88 Birchwood Ave', city: 'Charlotte', state: 'NC',
    price: 342000, beds: 3, baths: 2.5, sqft: 1720, yearBuilt: 2005,
    estRent: 2450, tax: 3600, insurance: 1450, hoa: 45
  },
  {
    id: 'L3', address: '1207 Falcon Crest Dr', city: 'Raleigh', state: 'NC',
    price: 398000, beds: 4, baths: 3, sqft: 2100, yearBuilt: 2011,
    estRent: 2700, tax: 4100, insurance: 1600, hoa: 0
  },
  {
    id: 'L4', address: '55 Harbor View Ln', city: 'Norfolk', state: 'VA',
    price: 265000, beds: 2, baths: 2, sqft: 1180, yearBuilt: 1985,
    estRent: 1950, tax: 2900, insurance: 1250, hoa: 180
  },
  {
    id: 'L5', address: '930 Sycamore St', city: 'Columbia', state: 'SC',
    price: 219000, beds: 3, baths: 2, sqft: 1380, yearBuilt: 1976,
    estRent: 1800, tax: 2400, insurance: 1150, hoa: 0
  },
  {
    id: 'L6', address: '17 Whitmore Pl', city: 'Alexandria', state: 'VA',
    price: 512000, beds: 3, baths: 2, sqft: 1650, yearBuilt: 1962,
    estRent: 3100, tax: 5600, insurance: 1900, hoa: 0
  },
  {
    id: 'L7', address: '2245 Pinehurst Rd', city: 'Durham', state: 'NC',
    price: 356000, beds: 4, baths: 2.5, sqft: 1980, yearBuilt: 2009,
    estRent: 2600, tax: 3900, insurance: 1550, hoa: 60
  },
  {
    id: 'L8', address: '71 Cobblestone Way', city: 'Greenville', state: 'SC',
    price: 245000, beds: 3, baths: 2, sqft: 1420, yearBuilt: 1994,
    estRent: 1950, tax: 2600, insurance: 1200, hoa: 0
  },
  {
    id: 'L9', address: '640 Laurel Oak Dr', city: 'Fayetteville', state: 'NC',
    price: 198000, beds: 3, baths: 2, sqft: 1320, yearBuilt: 1988,
    estRent: 1700, tax: 2100, insurance: 1100, hoa: 0
  },
  {
    id: 'L10', address: '303 Riverside Pkwy', city: 'Richmond', state: 'VA',
    price: 415000, beds: 4, baths: 3, sqft: 2250, yearBuilt: 2015,
    estRent: 2850, tax: 4400, insurance: 1650, hoa: 120
  },
  {
    id: 'L11', address: '19 Wrenwood Ct', city: 'Charlottesville', state: 'VA',
    price: 378000, beds: 3, baths: 2, sqft: 1600, yearBuilt: 2001,
    estRent: 2400, tax: 3700, insurance: 1500, hoa: 0
  },
  {
    id: 'L12', address: '84 Kestrel Hollow', city: 'Wilmington', state: 'NC',
    price: 329000, beds: 3, baths: 2, sqft: 1550, yearBuilt: 1999,
    estRent: 2250, tax: 3300, insurance: 1400, hoa: 35
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SAMPLE_LISTINGS;
}
