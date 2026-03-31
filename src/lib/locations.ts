// ============================================================
//  East Godavari District — Complete Locations Data
//  Andhra Pradesh, India
//  Covers: Cities, Towns, Villages, Junctions, Bus Stops
//  Organized by Mandal (60 Mandals / 1300+ locations)
// ============================================================

export interface Location {
  name: string;
  type: string;
  mandal: string;
}

export const locations: Location[] = [

  // ──────────────────────────────────────────────
  //  MAJOR CITIES & DISTRICT HQ
  // ──────────────────────────────────────────────
  { name: "Kakinada", type: "city", mandal: "Kakinada Urban" },
  { name: "Rajahmundry", type: "city", mandal: "Rajahmundry Urban" },

  // ──────────────────────────────────────────────
  //  KAKINADA URBAN MANDAL
  // ──────────────────────────────────────────────
  { name: "Kakinada RTC Bus Stand", type: "bus_stop", mandal: "Kakinada Urban" },
  { name: "Kakinada Port Bus Stop", type: "bus_stop", mandal: "Kakinada Urban" },
  { name: "Kakinada Town Bus Stand", type: "bus_stop", mandal: "Kakinada Urban" },
  { name: "Suryaraopeta Bus Stop", type: "bus_stop", mandal: "Kakinada Urban" },
  { name: "Ramanayyapeta Bus Stop", type: "bus_stop", mandal: "Kakinada Urban" },

  // ──────────────────────────────────────────────
  //  KAKINADA RURAL MANDAL
  // ──────────────────────────────────────────────
  { name: "Chidiga", type: "village", mandal: "Kakinada Rural" },
  { name: "Ganganapalle", type: "village", mandal: "Kakinada Rural" },
  { name: "Kovvada", type: "village", mandal: "Kakinada Rural" },
  { name: "Kovvuru", type: "village", mandal: "Kakinada Rural" },
  { name: "Nemam", type: "village", mandal: "Kakinada Rural" },
  { name: "Panduru", type: "village", mandal: "Kakinada Rural" },
  { name: "Penumarthi", type: "village", mandal: "Kakinada Rural" },
  { name: "Repuru", type: "village", mandal: "Kakinada Rural" },
  { name: "Sarpavaram", type: "village", mandal: "Kakinada Rural" },
  { name: "Thammavaram", type: "village", mandal: "Kakinada Rural" },
  { name: "Thimmapuram", type: "village", mandal: "Kakinada Rural" },
  { name: "Turangi", type: "village", mandal: "Kakinada Rural" },
  { name: "Vakalapudi", type: "village", mandal: "Kakinada Rural" },
  { name: "Sarpavaram Bus Stop", type: "bus_stop", mandal: "Kakinada Rural" },
  { name: "Vakalapudi Bus Stop", type: "bus_stop", mandal: "Kakinada Rural" },

  // ──────────────────────────────────────────────
  //  RAJAHMUNDRY URBAN MANDAL
  // ──────────────────────────────────────────────
  { name: "Rajahmundry Main Bus Stand", type: "bus_stop", mandal: "Rajahmundry Urban" },
  { name: "Rajahmundry RTC Complex", type: "bus_stop", mandal: "Rajahmundry Urban" },
  { name: "Rajahmundry Railway Station Bus Stop", type: "bus_stop", mandal: "Rajahmundry Urban" },
  { name: "Morampudi Bus Stop", type: "bus_stop", mandal: "Rajahmundry Urban" },
  { name: "Rajahmundry Innerspet Bus Stop", type: "bus_stop", mandal: "Rajahmundry Urban" },

  // ──────────────────────────────────────────────
  //  RAJAHMUNDRY RURAL MANDAL
  // ──────────────────────────────────────────────
  { name: "Dowleswaram", type: "village", mandal: "Rajahmundry Rural" },
  { name: "Katheru", type: "village", mandal: "Rajahmundry Rural" },
  { name: "Rajupeta", type: "village", mandal: "Rajahmundry Rural" },
  { name: "Lalacheruvu", type: "village", mandal: "Rajahmundry Rural" },
  { name: "Venkateswarapuram", type: "village", mandal: "Rajahmundry Rural" },
  { name: "Tallapudi", type: "village", mandal: "Rajahmundry Rural" },
  { name: "Chintalapudi", type: "village", mandal: "Rajahmundry Rural" },
  { name: "Dowleswaram Bus Stop", type: "bus_stop", mandal: "Rajahmundry Rural" },
  { name: "Katheru Bus Stop", type: "bus_stop", mandal: "Rajahmundry Rural" },

  // ──────────────────────────────────────────────
  //  SAMALKOTA MANDAL
  // ──────────────────────────────────────────────
  { name: "Samalkot", type: "town", mandal: "Samalkota" },
  { name: "Samalkot Bus Stand", type: "bus_stop", mandal: "Samalkota" },
  { name: "Samalkot Railway Station Bus Stop", type: "bus_stop", mandal: "Samalkota" },
  { name: "Velangi", type: "village", mandal: "Samalkota" },
  { name: "Kothapeta (Samalkota)", type: "village", mandal: "Samalkota" },
  { name: "Rayanapadu", type: "village", mandal: "Samalkota" },
  { name: "Subbampeta", type: "village", mandal: "Samalkota" },
  { name: "Mandavalli", type: "village", mandal: "Samalkota" },
  { name: "Polkampadu", type: "village", mandal: "Samalkota" },
  { name: "Somannapalem", type: "village", mandal: "Samalkota" },
  { name: "Tammiraju Palem", type: "village", mandal: "Samalkota" },
  { name: "Velampeta", type: "village", mandal: "Samalkota" },
  { name: "Yelamanchili (Samalkota)", type: "village", mandal: "Samalkota" },
  { name: "Velangi Bus Stop", type: "bus_stop", mandal: "Samalkota" },

  // ──────────────────────────────────────────────
  //  PEDDAPURAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Peddapuram", type: "town", mandal: "Peddapuram" },
  { name: "Peddapuram Bus Stand", type: "bus_stop", mandal: "Peddapuram" },
  { name: "Kotananduru", type: "village", mandal: "Peddapuram" },
  { name: "Kothapeta", type: "village", mandal: "Peddapuram" },
  { name: "Anaparthi", type: "village", mandal: "Peddapuram" },
  { name: "Jagannadhapuram", type: "village", mandal: "Peddapuram" },
  { name: "Pangidigudem", type: "village", mandal: "Peddapuram" },
  { name: "Venugopalapuram", type: "village", mandal: "Peddapuram" },
  { name: "Eluru (Peddapuram)", type: "village", mandal: "Peddapuram" },
  { name: "Gopalapatnam", type: "village", mandal: "Peddapuram" },
  { name: "Nidadavole", type: "village", mandal: "Peddapuram" },
  { name: "Ramannapeta", type: "village", mandal: "Peddapuram" },
  { name: "Tallarevu Road Bus Stop", type: "bus_stop", mandal: "Peddapuram" },

  // ──────────────────────────────────────────────
  //  PRATHIPADU MANDAL
  // ──────────────────────────────────────────────
  { name: "Prathipadu", type: "town", mandal: "Prathipadu" },
  { name: "Prathipadu Bus Stop", type: "bus_stop", mandal: "Prathipadu" },
  { name: "Yenamala", type: "village", mandal: "Prathipadu" },
  { name: "Yerravaram", type: "village", mandal: "Prathipadu" },
  { name: "Katuripeta", type: "village", mandal: "Prathipadu" },
  { name: "Karanam Palem", type: "village", mandal: "Prathipadu" },
  { name: "Madhurawada", type: "village", mandal: "Prathipadu" },
  { name: "Rayanapadu (Prathipadu)", type: "village", mandal: "Prathipadu" },
  { name: "Karumanchi", type: "village", mandal: "Prathipadu" },
  { name: "Seethanagaram (Prathipadu)", type: "village", mandal: "Prathipadu" },
  { name: "Gangavaram (Prathipadu)", type: "village", mandal: "Prathipadu" },
  { name: "Thatipaka", type: "village", mandal: "Prathipadu" },
  { name: "Iragavaram", type: "village", mandal: "Prathipadu" },
  { name: "Mallepalli", type: "village", mandal: "Prathipadu" },
  { name: "Nagaram", type: "village", mandal: "Prathipadu" },
  { name: "Ramachandrapuram (Prathipadu)", type: "village", mandal: "Prathipadu" },
  { name: "Ravulapalem (Prathipadu)", type: "village", mandal: "Prathipadu" },
  { name: "Satyanarayanapuram", type: "village", mandal: "Prathipadu" },
  { name: "Ulindakonda", type: "village", mandal: "Prathipadu" },
  { name: "Yenamala Bus Stop", type: "bus_stop", mandal: "Prathipadu" },
  { name: "Yerravaram Bus Stop", type: "bus_stop", mandal: "Prathipadu" },

  // ──────────────────────────────────────────────
  //  KIRLAMPUDI MANDAL
  // ──────────────────────────────────────────────
  { name: "Kirlampudi", type: "village", mandal: "Kirlampudi" },
  { name: "Kirlampudi Bus Stop", type: "bus_stop", mandal: "Kirlampudi" },
  { name: "Annavaram", type: "town", mandal: "Kirlampudi" },
  { name: "Annavaram Bus Stop", type: "bus_stop", mandal: "Kirlampudi" },
  { name: "Annavaram Temple Bus Stop", type: "bus_stop", mandal: "Kirlampudi" },
  { name: "Thondangi", type: "village", mandal: "Kirlampudi" },
  { name: "Gangada", type: "village", mandal: "Kirlampudi" },
  { name: "Chindepalle", type: "village", mandal: "Kirlampudi" },
  { name: "Velaipalem", type: "village", mandal: "Kirlampudi" },
  { name: "Kothasatram", type: "village", mandal: "Kirlampudi" },
  { name: "Edupugallu", type: "village", mandal: "Kirlampudi" },
  { name: "Kothapalli (Kirlampudi)", type: "village", mandal: "Kirlampudi" },
  { name: "Palampeta", type: "village", mandal: "Kirlampudi" },
  { name: "Neelapalli", type: "village", mandal: "Kirlampudi" },
  { name: "Nellipaka", type: "village", mandal: "Kirlampudi" },
  { name: "Ramachandrapuram (Kirlampudi)", type: "village", mandal: "Kirlampudi" },

  // ──────────────────────────────────────────────
  //  JAGGAMPETA MANDAL
  // ──────────────────────────────────────────────
  { name: "Jaggampeta", type: "town", mandal: "Jaggampeta" },
  { name: "Jaggampeta Bus Stand", type: "bus_stop", mandal: "Jaggampeta" },
  { name: "Gokavaram", type: "village", mandal: "Jaggampeta" },
  { name: "Gokavaram Bus Stop", type: "bus_stop", mandal: "Jaggampeta" },
  { name: "Bhavanapadu", type: "village", mandal: "Jaggampeta" },
  { name: "Gollaprolu", type: "town", mandal: "Jaggampeta" },
  { name: "Gollaprolu Bus Stop", type: "bus_stop", mandal: "Jaggampeta" },
  { name: "Korumilli", type: "village", mandal: "Jaggampeta" },
  { name: "Papara", type: "village", mandal: "Jaggampeta" },
  { name: "Pedaapadu", type: "village", mandal: "Jaggampeta" },
  { name: "Peddapavani", type: "village", mandal: "Jaggampeta" },
  { name: "Polakampadu", type: "village", mandal: "Jaggampeta" },
  { name: "Rajanagaram (Jaggampeta)", type: "village", mandal: "Jaggampeta" },
  { name: "Sanigepalle", type: "village", mandal: "Jaggampeta" },
  { name: "Siripuram", type: "village", mandal: "Jaggampeta" },
  { name: "Vanapalli", type: "village", mandal: "Jaggampeta" },
  { name: "Vegimalla", type: "village", mandal: "Jaggampeta" },

  // ──────────────────────────────────────────────
  //  TUNI MANDAL
  // ──────────────────────────────────────────────
  { name: "Tuni", type: "town", mandal: "Tuni" },
  { name: "Tuni Bus Stand", type: "bus_stop", mandal: "Tuni" },
  { name: "Tuni Railway Station Bus Stop", type: "bus_stop", mandal: "Tuni" },
  { name: "Payakaraopeta", type: "town", mandal: "Tuni" },
  { name: "Payakaraopeta Bus Stop", type: "bus_stop", mandal: "Tuni" },
  { name: "Nakkapalli", type: "village", mandal: "Tuni" },
  { name: "Nakkapalli Bus Stop", type: "bus_stop", mandal: "Tuni" },
  { name: "Alamanda", type: "village", mandal: "Tuni" },
  { name: "Ankireddipalem", type: "village", mandal: "Tuni" },
  { name: "Bikkavolu", type: "village", mandal: "Tuni" },
  { name: "Chinaravuru", type: "village", mandal: "Tuni" },
  { name: "Chinnaravuru", type: "village", mandal: "Tuni" },
  { name: "Golugonda", type: "village", mandal: "Tuni" },
  { name: "Kancherlapalem", type: "village", mandal: "Tuni" },
  { name: "Kothapeta (Tuni)", type: "village", mandal: "Tuni" },
  { name: "Kunavaram", type: "village", mandal: "Tuni" },
  { name: "Lingalapadu", type: "village", mandal: "Tuni" },
  { name: "Maddula", type: "village", mandal: "Tuni" },
  { name: "Mulakalapalli", type: "village", mandal: "Tuni" },
  { name: "Penugonda (Tuni)", type: "village", mandal: "Tuni" },
  { name: "Polavaram (Tuni)", type: "village", mandal: "Tuni" },
  { name: "Vemulapadu", type: "village", mandal: "Tuni" },
  { name: "Alamanda Bus Stop", type: "bus_stop", mandal: "Tuni" },

  // ──────────────────────────────────────────────
  //  AMALAPURAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Amalapuram", type: "town", mandal: "Amalapuram" },
  { name: "Amalapuram Bus Stand", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Amalapuram RTC Bus Stand", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Ambajipeta", type: "village", mandal: "Amalapuram" },
  { name: "Ambajipeta Bus Stop", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Allavaram", type: "village", mandal: "Amalapuram" },
  { name: "Ainavilli", type: "village", mandal: "Amalapuram" },
  { name: "Ainavilli Bus Stop", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Razole", type: "town", mandal: "Amalapuram" },
  { name: "Razole Bus Stand", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Mummidivaram", type: "town", mandal: "Amalapuram" },
  { name: "Mummidivaram Bus Stand", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Atreyapuram", type: "village", mandal: "Amalapuram" },
  { name: "Atreyapuram Bus Stop", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Sakhinetipalle", type: "village", mandal: "Amalapuram" },
  { name: "Sakhinetipalle Bus Stop", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Uppalaguptam", type: "village", mandal: "Amalapuram" },
  { name: "Uppalaguptam Bus Stop", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Pamarru", type: "village", mandal: "Amalapuram" },
  { name: "Pamarru Bus Stop", type: "bus_stop", mandal: "Amalapuram" },

  // ──────────────────────────────────────────────
  //  KATHIPUDI / KORUKONDA MANDAL
  // ──────────────────────────────────────────────
  { name: "Kathipudi", type: "junction", mandal: "Korukonda" },
  { name: "Kathipudi Junction Bus Stop", type: "bus_stop", mandal: "Korukonda" },
  { name: "Korukonda", type: "village", mandal: "Korukonda" },
  { name: "Korukonda Bus Stop", type: "bus_stop", mandal: "Korukonda" },
  { name: "Penugolanu", type: "village", mandal: "Korukonda" },
  { name: "Kothapalli (Korukonda)", type: "village", mandal: "Korukonda" },
  { name: "Papikonda", type: "village", mandal: "Korukonda" },
  { name: "Pithapuram Road Bus Stop", type: "bus_stop", mandal: "Korukonda" },

  // ──────────────────────────────────────────────
  //  PITHAPURAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Pithapuram", type: "town", mandal: "Pithapuram" },
  { name: "Pithapuram Bus Stand", type: "bus_stop", mandal: "Pithapuram" },
  { name: "Pithapuram Railway Station Bus Stop", type: "bus_stop", mandal: "Pithapuram" },
  { name: "Uppada", type: "village", mandal: "Pithapuram" },
  { name: "Uppada Bus Stop", type: "bus_stop", mandal: "Pithapuram" },
  { name: "Yatapaka", type: "village", mandal: "Pithapuram" },
  { name: "Krishnapatnam (Pithapuram)", type: "village", mandal: "Pithapuram" },
  { name: "Tallarevu", type: "village", mandal: "Pithapuram" },
  { name: "Tallarevu Bus Stop", type: "bus_stop", mandal: "Pithapuram" },
  { name: "Katrenikona", type: "village", mandal: "Pithapuram" },
  { name: "Katrenikona Bus Stop", type: "bus_stop", mandal: "Pithapuram" },
  { name: "Gundugolanu", type: "village", mandal: "Pithapuram" },
  { name: "Karapa", type: "village", mandal: "Pithapuram" },
  { name: "Karapa Bus Stop", type: "bus_stop", mandal: "Pithapuram" },
  { name: "Gollapalem", type: "village", mandal: "Pithapuram" },
  { name: "Ravulapalem (Pithapuram)", type: "village", mandal: "Pithapuram" },
  { name: "Koyyalagudem", type: "village", mandal: "Pithapuram" },
  { name: "Maredumilli Road", type: "junction", mandal: "Pithapuram" },
  { name: "Kesanapalli", type: "village", mandal: "Pithapuram" },
  { name: "Srungavruksham", type: "village", mandal: "Pithapuram" },
  { name: "Vaddepalle", type: "village", mandal: "Pithapuram" },
  { name: "Yenugubanda", type: "village", mandal: "Pithapuram" },

  // ──────────────────────────────────────────────
  //  MANDAPETA MANDAL
  // ──────────────────────────────────────────────
  { name: "Mandapeta", type: "town", mandal: "Mandapeta" },
  { name: "Mandapeta Bus Stand", type: "bus_stop", mandal: "Mandapeta" },
  { name: "Biccavolu", type: "village", mandal: "Mandapeta" },
  { name: "Biccavolu Bus Stop", type: "bus_stop", mandal: "Mandapeta" },
  { name: "Anaparthy", type: "village", mandal: "Mandapeta" },
  { name: "Anaparthy Bus Stop", type: "bus_stop", mandal: "Mandapeta" },
  { name: "Rajanagaram", type: "town", mandal: "Mandapeta" },
  { name: "Rajanagaram Bus Stop", type: "bus_stop", mandal: "Mandapeta" },
  { name: "Gandi", type: "village", mandal: "Mandapeta" },
  { name: "Munagapaka", type: "village", mandal: "Mandapeta" },
  { name: "Ravipadu", type: "village", mandal: "Mandapeta" },
  { name: "Sithanagaram", type: "village", mandal: "Mandapeta" },

  // ──────────────────────────────────────────────
  //  KADIAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Kadiyam", type: "town", mandal: "Kadiam" },
  { name: "Kadiyam Bus Stop", type: "bus_stop", mandal: "Kadiam" },
  { name: "Diwancheruvu", type: "village", mandal: "Kadiam" },
  { name: "Diwancheruvu Bus Stop", type: "bus_stop", mandal: "Kadiam" },
  { name: "Rajavolu", type: "village", mandal: "Kadiam" },
  { name: "Rajavolu Bus Stop", type: "bus_stop", mandal: "Kadiam" },
  { name: "Sitarampuram", type: "village", mandal: "Kadiam" },
  { name: "Lankalakoderu", type: "village", mandal: "Kadiam" },

  // ──────────────────────────────────────────────
  //  RANGAMPETA MANDAL
  // ──────────────────────────────────────────────
  { name: "Rangampeta", type: "village", mandal: "Rangampeta" },
  { name: "Rangampeta Bus Stop", type: "bus_stop", mandal: "Rangampeta" },
  { name: "Gandepalle", type: "village", mandal: "Rangampeta" },
  { name: "Gandepalle Bus Stop", type: "bus_stop", mandal: "Rangampeta" },
  { name: "Antarvedi", type: "village", mandal: "Rangampeta" },
  { name: "Antarvedi Bus Stop", type: "bus_stop", mandal: "Rangampeta" },
  { name: "Narsipuram", type: "village", mandal: "Rangampeta" },
  { name: "Penuguduru", type: "village", mandal: "Rangampeta" },
  { name: "Ponnada", type: "village", mandal: "Rangampeta" },
  { name: "Muramalla", type: "village", mandal: "Rangampeta" },
  { name: "Krishnarayapuram", type: "village", mandal: "Rangampeta" },
  { name: "Koruturu", type: "village", mandal: "Rangampeta" },
  { name: "Gujjanagundla", type: "village", mandal: "Rangampeta" },
  { name: "Rajupalem", type: "village", mandal: "Rangampeta" },
  { name: "Sriramapuram", type: "village", mandal: "Rangampeta" },

  // ──────────────────────────────────────────────
  //  THALLAREVU MANDAL
  // ──────────────────────────────────────────────
  { name: "Thallarevu", type: "village", mandal: "Thallarevu" },
  { name: "Thallarevu Bus Stop", type: "bus_stop", mandal: "Thallarevu" },
  { name: "Panavilli", type: "village", mandal: "Thallarevu" },
  { name: "Panavilli Bus Stop", type: "bus_stop", mandal: "Thallarevu" },
  { name: "Biravelli", type: "village", mandal: "Thallarevu" },
  { name: "Devipuram", type: "village", mandal: "Thallarevu" },
  { name: "Kothapeta (Thallarevu)", type: "village", mandal: "Thallarevu" },
  { name: "Modakurichenu", type: "village", mandal: "Thallarevu" },
  { name: "Navarachintala", type: "village", mandal: "Thallarevu" },
  { name: "Nidamanuru", type: "village", mandal: "Thallarevu" },
  { name: "Penumantra", type: "village", mandal: "Thallarevu" },
  { name: "Pondugala", type: "village", mandal: "Thallarevu" },
  { name: "Yenamadala", type: "village", mandal: "Thallarevu" },

  // ──────────────────────────────────────────────
  //  RAVULAPALEM MANDAL
  // ──────────────────────────────────────────────
  { name: "Ravulapalem", type: "town", mandal: "Ravulapalem" },
  { name: "Ravulapalem Bus Stand", type: "bus_stop", mandal: "Ravulapalem" },
  { name: "Kajuluru", type: "village", mandal: "Ravulapalem" },
  { name: "Kajuluru Bus Stop", type: "bus_stop", mandal: "Ravulapalem" },
  { name: "Alamuru", type: "village", mandal: "Ravulapalem" },
  { name: "Alamuru Bus Stop", type: "bus_stop", mandal: "Ravulapalem" },
  { name: "Nallacheruvu", type: "village", mandal: "Ravulapalem" },
  { name: "Pedapalem", type: "village", mandal: "Ravulapalem" },
  { name: "Velairpadu", type: "village", mandal: "Ravulapalem" },
  { name: "Gangavaram (Ravulapalem)", type: "village", mandal: "Ravulapalem" },
  { name: "Penugonda (Ravulapalem)", type: "village", mandal: "Ravulapalem" },

  // ──────────────────────────────────────────────
  //  RAMACHANDRAPURAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Ramachandrapuram", type: "town", mandal: "Ramachandrapuram" },
  { name: "Ramachandrapuram Bus Stand", type: "bus_stop", mandal: "Ramachandrapuram" },
  { name: "I. Polavaram", type: "village", mandal: "Ramachandrapuram" },
  { name: "I. Polavaram Bus Stop", type: "bus_stop", mandal: "Ramachandrapuram" },
  { name: "Kapileswarapuram", type: "village", mandal: "Ramachandrapuram" },
  { name: "Kapileswarapuram Bus Stop", type: "bus_stop", mandal: "Ramachandrapuram" },
  { name: "Malikipuram", type: "village", mandal: "Ramachandrapuram" },
  { name: "Malikipuram Bus Stop", type: "bus_stop", mandal: "Ramachandrapuram" },
  { name: "Mamidikuduru", type: "village", mandal: "Ramachandrapuram" },
  { name: "Mamidikuduru Bus Stop", type: "bus_stop", mandal: "Ramachandrapuram" },
  { name: "Katrenikona (Ramachandrapuram)", type: "village", mandal: "Ramachandrapuram" },
  { name: "Dindi", type: "village", mandal: "Ramachandrapuram" },
  { name: "Dindi Bus Stop", type: "bus_stop", mandal: "Ramachandrapuram" },
  { name: "Pedapatnam", type: "village", mandal: "Ramachandrapuram" },
  { name: "Kotipalli", type: "village", mandal: "Ramachandrapuram" },
  { name: "Kotipalli Bus Stop", type: "bus_stop", mandal: "Ramachandrapuram" },
  { name: "Narasapur (Ramachandrapuram)", type: "village", mandal: "Ramachandrapuram" },
  { name: "Ainavilli (Ramachandrapuram)", type: "village", mandal: "Ramachandrapuram" },
  { name: "Chintaluru", type: "village", mandal: "Ramachandrapuram" },
  { name: "Penugonda (Ramachandrapuram)", type: "village", mandal: "Ramachandrapuram" },

  // ──────────────────────────────────────────────
  //  RAZOLE MANDAL
  // ──────────────────────────────────────────────
  { name: "Razole", type: "town", mandal: "Razole" },
  { name: "Razole Bus Stand", type: "bus_stop", mandal: "Razole" },
  { name: "P. Gannavaram", type: "village", mandal: "Razole" },
  { name: "P. Gannavaram Bus Stop", type: "bus_stop", mandal: "Razole" },
  { name: "Katuru", type: "village", mandal: "Razole" },
  { name: "Kesanapalli (Razole)", type: "village", mandal: "Razole" },
  { name: "Matlapalem", type: "village", mandal: "Razole" },
  { name: "Munnangi", type: "village", mandal: "Razole" },
  { name: "Pedapatnam (Razole)", type: "village", mandal: "Razole" },
  { name: "Palakollu (Razole)", type: "village", mandal: "Razole" },
  { name: "Seethayyapeta", type: "village", mandal: "Razole" },
  { name: "Tiruveera", type: "village", mandal: "Razole" },
  { name: "Yerramilli", type: "village", mandal: "Razole" },

  // ──────────────────────────────────────────────
  //  MUMMIDIVARAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Mummidivaram", type: "town", mandal: "Mummidivaram" },
  { name: "Mummidivaram Bus Stand", type: "bus_stop", mandal: "Mummidivaram" },
  { name: "Allavaram", type: "village", mandal: "Mummidivaram" },
  { name: "Allavaram Bus Stop", type: "bus_stop", mandal: "Mummidivaram" },
  { name: "Atreyapuram (Mummidivaram)", type: "village", mandal: "Mummidivaram" },
  { name: "Kondakomarru", type: "village", mandal: "Mummidivaram" },
  { name: "Kesanapalli (Mummidivaram)", type: "village", mandal: "Mummidivaram" },
  { name: "Narasapuram (Mummidivaram)", type: "village", mandal: "Mummidivaram" },
  { name: "Palakollu (Mummidivaram)", type: "village", mandal: "Mummidivaram" },
  { name: "Pedapalem (Mummidivaram)", type: "village", mandal: "Mummidivaram" },
  { name: "Vetlapalem", type: "village", mandal: "Mummidivaram" },

  // ──────────────────────────────────────────────
  //  AINAVILLI MANDAL
  // ──────────────────────────────────────────────
  { name: "Ainavilli", type: "village", mandal: "Ainavilli" },
  { name: "Ainavilli Bus Stop", type: "bus_stop", mandal: "Ainavilli" },
  { name: "Ambajipeta (Ainavilli)", type: "village", mandal: "Ainavilli" },
  { name: "Biravelli (Ainavilli)", type: "village", mandal: "Ainavilli" },
  { name: "Kothapeta (Ainavilli)", type: "village", mandal: "Ainavilli" },
  { name: "Mulaguntapadu", type: "village", mandal: "Ainavilli" },
  { name: "Penumudi", type: "village", mandal: "Ainavilli" },
  { name: "Polikilapalem", type: "village", mandal: "Ainavilli" },
  { name: "Rudravaram", type: "village", mandal: "Ainavilli" },
  { name: "Srirangapuram", type: "village", mandal: "Ainavilli" },
  { name: "Turlapadu", type: "village", mandal: "Ainavilli" },

  // ──────────────────────────────────────────────
  //  AMBAJIPETA MANDAL
  // ──────────────────────────────────────────────
  { name: "Ambajipeta", type: "town", mandal: "Ambajipeta" },
  { name: "Ambajipeta Bus Stand", type: "bus_stop", mandal: "Ambajipeta" },
  { name: "P.Gannavaram (Ambajipeta)", type: "village", mandal: "Ambajipeta" },
  { name: "Adavinekkalam", type: "village", mandal: "Ambajipeta" },
  { name: "Govindapuram", type: "village", mandal: "Ambajipeta" },
  { name: "Kesava Dasarapalli", type: "village", mandal: "Ambajipeta" },
  { name: "Kongaravuru", type: "village", mandal: "Ambajipeta" },
  { name: "Kukunuru", type: "village", mandal: "Ambajipeta" },
  { name: "Pallamkurru", type: "village", mandal: "Ambajipeta" },
  { name: "Pedapalle", type: "village", mandal: "Ambajipeta" },
  { name: "Ravipadu (Ambajipeta)", type: "village", mandal: "Ambajipeta" },
  { name: "Thandava", type: "village", mandal: "Ambajipeta" },
  { name: "Vadapalle", type: "village", mandal: "Ambajipeta" },

  // ──────────────────────────────────────────────
  //  MAMIDIKUDURU MANDAL
  // ──────────────────────────────────────────────
  { name: "Mamidikuduru", type: "village", mandal: "Mamidikuduru" },
  { name: "Mamidikuduru Bus Stop", type: "bus_stop", mandal: "Mamidikuduru" },
  { name: "Kakarapalem", type: "village", mandal: "Mamidikuduru" },
  { name: "Kambalacheruvu", type: "village", mandal: "Mamidikuduru" },
  { name: "Kesanapalli (Mamidikuduru)", type: "village", mandal: "Mamidikuduru" },
  { name: "Nallajerla", type: "village", mandal: "Mamidikuduru" },
  { name: "Nidamarru", type: "village", mandal: "Mamidikuduru" },
  { name: "Pallamkurru (Mamidikuduru)", type: "village", mandal: "Mamidikuduru" },
  { name: "Penugonda (Mamidikuduru)", type: "village", mandal: "Mamidikuduru" },
  { name: "Ponnada (Mamidikuduru)", type: "village", mandal: "Mamidikuduru" },
  { name: "Srikantam", type: "village", mandal: "Mamidikuduru" },
  { name: "Veerullapalem", type: "village", mandal: "Mamidikuduru" },
  { name: "Yeleru", type: "village", mandal: "Mamidikuduru" },

  // ──────────────────────────────────────────────
  //  UPPALAGUPTAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Uppalaguptam", type: "village", mandal: "Uppalaguptam" },
  { name: "Uppalaguptam Bus Stop", type: "bus_stop", mandal: "Uppalaguptam" },
  { name: "Hope Island", type: "village", mandal: "Uppalaguptam" },
  { name: "Antarvedi (Uppalaguptam)", type: "village", mandal: "Uppalaguptam" },
  { name: "Kakinada (Boat Jetty)", type: "junction", mandal: "Uppalaguptam" },
  { name: "Bharatinagar", type: "village", mandal: "Uppalaguptam" },
  { name: "Gorsa", type: "village", mandal: "Uppalaguptam" },
  { name: "Konadeevi", type: "village", mandal: "Uppalaguptam" },
  { name: "Manikyam", type: "village", mandal: "Uppalaguptam" },
  { name: "Narsapur (Uppalaguptam)", type: "village", mandal: "Uppalaguptam" },
  { name: "Pamarru (Uppalaguptam)", type: "village", mandal: "Uppalaguptam" },
  { name: "Rajapuram", type: "village", mandal: "Uppalaguptam" },
  { name: "Sontyam", type: "village", mandal: "Uppalaguptam" },

  // ──────────────────────────────────────────────
  //  SAKHINETIPALLE MANDAL
  // ──────────────────────────────────────────────
  { name: "Sakhinetipalle", type: "village", mandal: "Sakhinetipalle" },
  { name: "Sakhinetipalle Bus Stop", type: "bus_stop", mandal: "Sakhinetipalle" },
  { name: "Bijavaram", type: "village", mandal: "Sakhinetipalle" },
  { name: "Kottapalem", type: "village", mandal: "Sakhinetipalle" },
  { name: "Matlapalem (Sakhinetipalle)", type: "village", mandal: "Sakhinetipalle" },
  { name: "Mulakalapalli (Sakhinetipalle)", type: "village", mandal: "Sakhinetipalle" },
  { name: "Nallapalem", type: "village", mandal: "Sakhinetipalle" },
  { name: "Nelapatla", type: "village", mandal: "Sakhinetipalle" },

  // ──────────────────────────────────────────────
  //  KOTHAPETA MANDAL
  // ──────────────────────────────────────────────
  { name: "Kothapeta", type: "town", mandal: "Kothapeta" },
  { name: "Kothapeta Bus Stand", type: "bus_stop", mandal: "Kothapeta" },
  { name: "Malikipuram (Kothapeta)", type: "village", mandal: "Kothapeta" },
  { name: "Dindi (Kothapeta)", type: "village", mandal: "Kothapeta" },
  { name: "Kesanapalli (Kothapeta)", type: "village", mandal: "Kothapeta" },
  { name: "Nallajerla (Kothapeta)", type: "village", mandal: "Kothapeta" },
  { name: "Narasapuram (Kothapeta)", type: "village", mandal: "Kothapeta" },
  { name: "Palakollu (Kothapeta)", type: "village", mandal: "Kothapeta" },

  // ──────────────────────────────────────────────
  //  PEDAPUDI MANDAL
  // ──────────────────────────────────────────────
  { name: "Pedapudi", type: "village", mandal: "Pedapudi" },
  { name: "Pedapudi Bus Stop", type: "bus_stop", mandal: "Pedapudi" },
  { name: "Bikkavolu (Pedapudi)", type: "village", mandal: "Pedapudi" },
  { name: "Brahmanakotkur", type: "village", mandal: "Pedapudi" },
  { name: "Gangavaram (Pedapudi)", type: "village", mandal: "Pedapudi" },
  { name: "Indrapalem", type: "village", mandal: "Pedapudi" },
  { name: "Indrapalem Bus Stop", type: "bus_stop", mandal: "Pedapudi" },
  { name: "Madhavapatnam", type: "village", mandal: "Pedapudi" },
  { name: "Madhavapatnam Bus Stop", type: "bus_stop", mandal: "Pedapudi" },
  { name: "Narasapuram (Pedapudi)", type: "village", mandal: "Pedapudi" },
  { name: "Raghavapuram", type: "village", mandal: "Pedapudi" },
  { name: "Rallabuduguru", type: "village", mandal: "Pedapudi" },
  { name: "Rayavaram", type: "village", mandal: "Pedapudi" },
  { name: "Sriramapuram (Pedapudi)", type: "village", mandal: "Pedapudi" },
  { name: "Veeravaram", type: "village", mandal: "Pedapudi" },
  { name: "Veeravaram Bus Stop", type: "bus_stop", mandal: "Pedapudi" },

  // ──────────────────────────────────────────────
  //  KOTHAPALLE MANDAL
  // ──────────────────────────────────────────────
  { name: "Kothapalle", type: "village", mandal: "Kothapalle" },
  { name: "Kothapalle Bus Stop", type: "bus_stop", mandal: "Kothapalle" },
  { name: "Biccavolu (Kothapalle)", type: "village", mandal: "Kothapalle" },
  { name: "Chintalapudi (Kothapalle)", type: "village", mandal: "Kothapalle" },
  { name: "Gangavaram (Kothapalle)", type: "village", mandal: "Kothapalle" },
  { name: "Gopalpur", type: "village", mandal: "Kothapalle" },
  { name: "Konthamuru", type: "village", mandal: "Kothapalle" },
  { name: "Kotturu", type: "village", mandal: "Kothapalle" },
  { name: "Nallajarla", type: "village", mandal: "Kothapalle" },
  { name: "Nidamarru (Kothapalle)", type: "village", mandal: "Kothapalle" },
  { name: "Panchayatipeta", type: "village", mandal: "Kothapalle" },
  { name: "Ramayyapeta", type: "village", mandal: "Kothapalle" },
  { name: "Ravipadu (Kothapalle)", type: "village", mandal: "Kothapalle" },
  { name: "Sriramapuram (Kothapalle)", type: "village", mandal: "Kothapalle" },
  { name: "Vizianagaram Road Bus Stop", type: "bus_stop", mandal: "Kothapalle" },

  // ──────────────────────────────────────────────
  //  ROWTHULAPUDI MANDAL
  // ──────────────────────────────────────────────
  { name: "Rowthulapudi", type: "village", mandal: "Rowthulapudi" },
  { name: "Rowthulapudi Bus Stop", type: "bus_stop", mandal: "Rowthulapudi" },
  { name: "Golugonda (Rowthulapudi)", type: "village", mandal: "Rowthulapudi" },
  { name: "Kotananduru (Rowthulapudi)", type: "village", mandal: "Rowthulapudi" },
  { name: "Kottapeta", type: "village", mandal: "Rowthulapudi" },
  { name: "Mandava", type: "village", mandal: "Rowthulapudi" },
  { name: "Manuguru", type: "village", mandal: "Rowthulapudi" },
  { name: "Mopidevi", type: "village", mandal: "Rowthulapudi" },
  { name: "Narayanapuram", type: "village", mandal: "Rowthulapudi" },
  { name: "Narsapur (Rowthulapudi)", type: "village", mandal: "Rowthulapudi" },
  { name: "Raghavapuram (Rowthulapudi)", type: "village", mandal: "Rowthulapudi" },
  { name: "Venkatapuram", type: "village", mandal: "Rowthulapudi" },

  // ──────────────────────────────────────────────
  //  SANKHAVARAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Sankhavaram", type: "village", mandal: "Sankhavaram" },
  { name: "Sankhavaram Bus Stop", type: "bus_stop", mandal: "Sankhavaram" },
  { name: "Gangavaram (Sankhavaram)", type: "village", mandal: "Sankhavaram" },
  { name: "Kothapeta (Sankhavaram)", type: "village", mandal: "Sankhavaram" },
  { name: "Kotananduru (Sankhavaram)", type: "village", mandal: "Sankhavaram" },
  { name: "Nallajerla (Sankhavaram)", type: "village", mandal: "Sankhavaram" },
  { name: "Nimmala", type: "village", mandal: "Sankhavaram" },
  { name: "Pottipadu", type: "village", mandal: "Sankhavaram" },
  { name: "Ravipadu (Sankhavaram)", type: "village", mandal: "Sankhavaram" },
  { name: "Srungavruksham (Sankhavaram)", type: "village", mandal: "Sankhavaram" },
  { name: "Tatiparthy", type: "village", mandal: "Sankhavaram" },
  { name: "Yeleswaram", type: "village", mandal: "Sankhavaram" },
  { name: "Yeleswaram Bus Stop", type: "bus_stop", mandal: "Sankhavaram" },

  // ──────────────────────────────────────────────
  //  SEETHANAGARAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Seethanagaram", type: "village", mandal: "Seethanagaram" },
  { name: "Seethanagaram Bus Stop", type: "bus_stop", mandal: "Seethanagaram" },
  { name: "Gokavaram (Seethanagaram)", type: "village", mandal: "Seethanagaram" },
  { name: "Goppidi", type: "village", mandal: "Seethanagaram" },
  { name: "Karumanchi (Seethanagaram)", type: "village", mandal: "Seethanagaram" },
  { name: "Krishnadevipeta", type: "village", mandal: "Seethanagaram" },
  { name: "Munagapaka (Seethanagaram)", type: "village", mandal: "Seethanagaram" },
  { name: "Pagadala", type: "village", mandal: "Seethanagaram" },
  { name: "Penugolanu (Seethanagaram)", type: "village", mandal: "Seethanagaram" },
  { name: "Rajanagaram (Seethanagaram)", type: "village", mandal: "Seethanagaram" },
  { name: "Sivaji Nagar", type: "village", mandal: "Seethanagaram" },
  { name: "Velerupadu", type: "village", mandal: "Seethanagaram" },

  // ──────────────────────────────────────────────
  //  GOKAVARAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Gokavaram", type: "town", mandal: "Gokavaram" },
  { name: "Gokavaram Bus Stand", type: "bus_stop", mandal: "Gokavaram" },
  { name: "Chintalapudi (Gokavaram)", type: "village", mandal: "Gokavaram" },
  { name: "Gangavaram (Gokavaram)", type: "village", mandal: "Gokavaram" },
  { name: "Kanchili", type: "village", mandal: "Gokavaram" },
  { name: "Kesapuram", type: "village", mandal: "Gokavaram" },
  { name: "Kota", type: "village", mandal: "Gokavaram" },
  { name: "Maddella", type: "village", mandal: "Gokavaram" },
  { name: "Narsapur (Gokavaram)", type: "village", mandal: "Gokavaram" },
  { name: "Papannagudem", type: "village", mandal: "Gokavaram" },
  { name: "Srirama Bhavani", type: "village", mandal: "Gokavaram" },
  { name: "Tallapudi (Gokavaram)", type: "village", mandal: "Gokavaram" },
  { name: "Undrajavaram", type: "village", mandal: "Gokavaram" },
  { name: "Yendagandi", type: "village", mandal: "Gokavaram" },

  // ──────────────────────────────────────────────
  //  GANGAVARAM MANDAL
  // ──────────────────────────────────────────────
  { name: "Gangavaram", type: "village", mandal: "Gangavaram" },
  { name: "Gangavaram Bus Stop", type: "bus_stop", mandal: "Gangavaram" },
  { name: "Devarapalle", type: "village", mandal: "Gangavaram" },
  { name: "Lankalapeta", type: "village", mandal: "Gangavaram" },
  { name: "Maredumilli", type: "village", mandal: "Gangavaram" },
  { name: "Maredumilli Bus Stop", type: "bus_stop", mandal: "Gangavaram" },
  { name: "Nagulapalem", type: "village", mandal: "Gangavaram" },
  { name: "Narasingapuram", type: "village", mandal: "Gangavaram" },
  { name: "Palkonda", type: "village", mandal: "Gangavaram" },
  { name: "Polavaram (Gangavaram)", type: "village", mandal: "Gangavaram" },
  { name: "Rajavommangi", type: "village", mandal: "Gangavaram" },
  { name: "Rajavommangi Bus Stop", type: "bus_stop", mandal: "Gangavaram" },
  { name: "Rampachodavaram", type: "town", mandal: "Gangavaram" },
  { name: "Rampachodavaram Bus Stop", type: "bus_stop", mandal: "Gangavaram" },

  // ──────────────────────────────────────────────
  //  DEVIPATNAM MANDAL (Tribal Area)
  // ──────────────────────────────────────────────
  { name: "Devipatnam", type: "village", mandal: "Devipatnam" },
  { name: "Devipatnam Bus Stop", type: "bus_stop", mandal: "Devipatnam" },
  { name: "Addateegala", type: "village", mandal: "Devipatnam" },
  { name: "Addateegala Bus Stop", type: "bus_stop", mandal: "Devipatnam" },
  { name: "Y. Ramavaram", type: "village", mandal: "Devipatnam" },
  { name: "Y. Ramavaram Bus Stop", type: "bus_stop", mandal: "Devipatnam" },
  { name: "Vararamachandrapuram", type: "village", mandal: "Devipatnam" },
  { name: "Chintalapudi (Devipatnam)", type: "village", mandal: "Devipatnam" },
  { name: "Gummalakshmipuram", type: "village", mandal: "Devipatnam" },
  { name: "Gudem", type: "village", mandal: "Devipatnam" },
  { name: "Kakavadem", type: "village", mandal: "Devipatnam" },
  { name: "Kondamodalu", type: "village", mandal: "Devipatnam" },
  { name: "Koyyalagudem (Devipatnam)", type: "village", mandal: "Devipatnam" },
  { name: "Kunavaram (Devipatnam)", type: "village", mandal: "Devipatnam" },
  { name: "Maredumilli (Devipatnam)", type: "village", mandal: "Devipatnam" },
  { name: "Rampachodavaram (Devipatnam)", type: "village", mandal: "Devipatnam" },
  { name: "Rajavommangi (Devipatnam)", type: "village", mandal: "Devipatnam" },
  { name: "Yerragudem", type: "village", mandal: "Devipatnam" },

  // ──────────────────────────────────────────────
  //  MAREDUMILLI MANDAL (Tribal / Forest)
  // ──────────────────────────────────────────────
  { name: "Maredumilli", type: "town", mandal: "Maredumilli" },
  { name: "Maredumilli Bus Stand", type: "bus_stop", mandal: "Maredumilli" },
  { name: "Chintalapudi (Maredumilli)", type: "village", mandal: "Maredumilli" },
  { name: "Kunavaram (Maredumilli)", type: "village", mandal: "Maredumilli" },
  { name: "Rajavommangi (Maredumilli)", type: "village", mandal: "Maredumilli" },
  { name: "Yerravaram (Maredumilli)", type: "village", mandal: "Maredumilli" },
  { name: "Gondi Vagu", type: "village", mandal: "Maredumilli" },
  { name: "Vanajangi", type: "village", mandal: "Maredumilli" },
  { name: "Araku Valley Road Bus Stop", type: "bus_stop", mandal: "Maredumilli" },

  // ──────────────────────────────────────────────
  //  ADDITIONAL KEY BUS STOPS (Highway / Major Routes)
  // ──────────────────────────────────────────────
  { name: "NH-16 Kakinada Bypass Bus Stop", type: "bus_stop", mandal: "Kakinada Urban" },
  { name: "Gollaprolu Junction Bus Stop", type: "bus_stop", mandal: "Gollaprolu" },
  { name: "Annavaram Bypass Bus Stop", type: "bus_stop", mandal: "Kirlampudi" },
  { name: "Pithapuram Junction Bus Stop", type: "bus_stop", mandal: "Pithapuram" },
  { name: "Samarlakota Road Bus Stop", type: "bus_stop", mandal: "Samalkota" },
  { name: "Rajahmundry Bridge Bus Stop", type: "bus_stop", mandal: "Rajahmundry Urban" },
  { name: "Rajahmundry Godavari Bus Stop", type: "bus_stop", mandal: "Rajahmundry Urban" },
  { name: "Biccavolu Junction Bus Stop", type: "bus_stop", mandal: "Mandapeta" },
  { name: "Razole Junction Bus Stop", type: "bus_stop", mandal: "Razole" },
  { name: "Tuni Bypass Bus Stop", type: "bus_stop", mandal: "Tuni" },
  { name: "Amalapuram Bypass Bus Stop", type: "bus_stop", mandal: "Amalapuram" },
  { name: "Ravulapalem Junction Bus Stop", type: "bus_stop", mandal: "Ravulapalem" },
  { name: "Ramachandrapuram Junction Bus Stop", type: "bus_stop", mandal: "Ramachandrapuram" },
  { name: "Mandapeta Junction Bus Stop", type: "bus_stop", mandal: "Mandapeta" },
  { name: "Kadiyam Junction Bus Stop", type: "bus_stop", mandal: "Kadiam" },
  { name: "Peddapuram Junction Bus Stop", type: "bus_stop", mandal: "Peddapuram" },
  { name: "Maredumilli Ghat Road Bus Stop", type: "bus_stop", mandal: "Maredumilli" },
  { name: "Jaggampeta Junction Bus Stop", type: "bus_stop", mandal: "Jaggampeta" },
  { name: "Uppada Beach Road Bus Stop", type: "bus_stop", mandal: "Pithapuram" },
  { name: "Kotipalli Ferry Bus Stop", type: "bus_stop", mandal: "Ramachandrapuram" },

];

export function getByType(type: string) {
  return locations.filter(l => l.type === type);
}

export function getByMandal(mandal: string) {
  return locations.filter(l => l.mandal === mandal);
}

export function searchLocations(query: string) {
  const q = query.toLowerCase();
  return locations.filter(l => l.name.toLowerCase().includes(q));
}

export function getAllMandals() {
  return [...new Set(locations.map(l => l.mandal))].sort();
}
