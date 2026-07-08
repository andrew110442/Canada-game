import { Landmark } from './types';
import stanleyParkImg from './assets/images/stanley_park_1783323453220.jpg';
import victoriaHarbourImg from './assets/images/victoria_harbour_1783324188950.jpg';
import yellowknifeAuroraImg from './assets/images/yellowknife_aurora_1783324364443.jpg';
import churchillPolarBearsImg from './assets/images/churchill_polar_bears_1783324466154.jpg';
import niagaraFallsImg from './assets/images/niagara_falls_1783324564502.jpg';
import torontoCnTowerImg from './assets/images/toronto_cn_tower_1783324666426.jpg';
import quebecCastleImg from './assets/images/quebec_castle_autumn_1783324744622.jpg';
import hopewellRocksImg from './assets/images/hopewell_rocks_kayak_1783324866980.jpg';
import peggysCoveLighthouseImg from './assets/images/peggys_cove_lighthouse_1783324954637.jpg';

export const LANDMARKS: Landmark[] = [
  {
    id: 'victoria',
    name: '維多利亞內港',
    nameEn: 'Victoria Inner Harbour',
    province: '英屬哥倫比亞省 (BC)',
    pointsRequired: 100,
    description: '踏上楓葉國度的起點！美麗優雅的英式港灣與古典帝后飯店，象徵著團隊揚帆起航。',
    coords: { x: 8, y: 76 },
    fact: '維多利亞是加拿大最溫暖的城市之一，也是英屬哥倫比亞省的首府，擁有濃郁的英倫風情。',
    image: victoriaHarbourImg
  },
  {
    id: 'vancouver',
    name: '溫哥華史丹利公園',
    nameEn: 'Stanley Park, Vancouver',
    province: '英屬哥倫比亞省 (BC)',
    pointsRequired: 500,
    description: '漫步太平洋海岸！巨大的原始溫帶雨林與雄偉的原住民圖騰，代表著團隊多元而包容的卓越文化。',
    coords: { x: 16, y: 68 },
    fact: '史丹利公園面積高達 405 公頃，比紐約中央公園還要大，並擁有著名的原住民圖騰柱。',
    image: stanleyParkImg
  },
  {
    id: 'banff',
    name: '落磯山路易斯湖',
    nameEn: 'Lake Louise, Banff',
    province: '亞伯達省 (AB)',
    pointsRequired: 1000,
    description: '征服落磯山的傳奇！如藍寶石般的冰川湖水，倒映著雄偉雪山，見證團隊的堅韌。',
    coords: { x: 25, y: 62 },
    fact: '路易斯湖的水色源於冰川融水中富含的「冰川粉」，在陽光折射下呈現奇幻的蒂芙尼藍。',
    image: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'yellowknife',
    name: '黃刀鎮極光',
    nameEn: 'Yellowknife Aurora',
    province: '西北地區 (NT)',
    pointsRequired: 2000,
    description: '幸運與榮耀之光！在深夜寒空中躍動的翠綠極光，象徵團隊的無限創意與爆發力。',
    coords: { x: 31, y: 38 },
    fact: '黃刀鎮被譽為「世界極光之都」，一年有超過 240 天可以觀賞到極光。',
    image: yellowknifeAuroraImg
  },
  {
    id: 'churchill',
    name: '邱吉爾鎮北極熊',
    nameEn: 'Churchill Polar Bears',
    province: '曼尼托巴省 (MB)',
    pointsRequired: 4000,
    description: '無畏極地風霜！與北極至尊北極熊並肩，象徵團隊不畏艱難、勇往直前的業務開拓精神。',
    coords: { x: 48, y: 48 },
    fact: '邱吉爾鎮是世界上少數能如此近距離觀測野生北極熊的地方，被譽為「世界北極熊之都」。',
    image: churchillPolarBearsImg
  },
  {
    id: 'niagara',
    name: '尼加拉大瀑布',
    nameEn: 'Niagara Falls',
    province: '安大略省 (ON)',
    pointsRequired: 6000,
    description: '雷霆萬鈞的業務動能！奔騰咆哮的巨量瀑布，如同團隊勢不可擋的成交業績。',
    coords: { x: 67, y: 86 },
    fact: '尼加拉大瀑布每分鐘有高達 16.8 萬立方公尺的水量傾瀉而下。',
    image: niagaraFallsImg
  },
  {
    id: 'cntower',
    name: '多倫多電視塔',
    nameEn: 'CN Tower',
    province: '安大略省 (ON)',
    pointsRequired: 8000,
    description: '登峰造極，問鼎頂峰！矗立在天際線的現代地標，代表著個人與團隊達到最高榮耀。',
    coords: { x: 72, y: 80 },
    fact: 'CN Tower 高達 553 公尺，曾連續 34 年保持世界最高獨立構築物的紀錄。',
    image: torontoCnTowerImg
  },
  {
    id: 'quebec',
    name: '魁北克老城',
    nameEn: 'Old Quebec Castle',
    province: '魁北克省 (QC)',
    pointsRequired: 12000,
    description: '歐風古堡的榮耀殿堂！走過石板街道與古老城牆，在芳堤娜城堡前共享成功的喜悅。',
    coords: { x: 82, y: 71 },
    fact: '魁北克老城是北美唯一保留有城牆的城市，已被聯合國教科文組織列為世界文化遺產。',
    image: quebecCastleImg
  },
  {
    id: 'hopewell',
    name: '芬迪灣霍普威爾岩',
    nameEn: 'Hopewell Rocks, Bay of Fundy',
    province: '新不倫瑞克省 (NB)',
    pointsRequired: 15000,
    description: '掌握財富起伏的潮汐力量！奇特壯觀的海蝕巨岩，象徵團隊洞察市場先機、造就中流砥柱。',
    coords: { x: 89, y: 73 },
    fact: '芬迪灣擁有世界上最高的潮汐（可達 16 公尺），退潮時可在海床上與巨大的「花瓶岩」並肩漫步。',
    image: hopewellRocksImg
  },
  {
    id: 'peggys',
    name: '佩姬灣燈塔',
    nameEn: "Peggy's Cove Lighthouse",
    province: '新斯科細亞省 (NS)',
    pointsRequired: 20000,
    description: '終極加國冒險王！聳立在花崗岩海岸的紅白燈塔，照亮北大西洋，指引航向終極勝利。',
    coords: { x: 94, y: 77 },
    fact: '佩姬灣燈塔是世界上最著名、被拍照次數最多的燈塔之一，象徵著守護與堅持。',
    image: peggysCoveLighthouseImg
  }
];
