import type { MapCoordinates } from "@/types/map";

// Approximate city centers used to move the map when an owner changes province.
// They are only a map viewport hint; they never overwrite the warehouse coordinates.
export const VIETNAM_PROVINCE_MAP_CENTERS: Readonly<Record<string, MapCoordinates>> = {
  "01": { latitude: 21.0285, longitude: 105.8542 }, // Hà Nội
  "04": { latitude: 22.6667, longitude: 106.25 }, // Cao Bằng
  "08": { latitude: 21.8236, longitude: 105.214 }, // Tuyên Quang
  "11": { latitude: 21.386, longitude: 103.023 }, // Điện Biên
  "12": { latitude: 22.3864, longitude: 103.4703 }, // Lai Châu
  "14": { latitude: 21.327, longitude: 103.914 }, // Sơn La
  "15": { latitude: 22.4856, longitude: 103.9707 }, // Lào Cai
  "19": { latitude: 21.5942, longitude: 105.8482 }, // Thái Nguyên
  "20": { latitude: 21.8537, longitude: 106.761 }, // Lạng Sơn
  "22": { latitude: 20.9511, longitude: 107.0802 }, // Quảng Ninh
  "24": { latitude: 21.1861, longitude: 106.0763 }, // Bắc Ninh
  "25": { latitude: 21.3227, longitude: 105.4019 }, // Phú Thọ
  "31": { latitude: 20.8449, longitude: 106.6881 }, // Hải Phòng
  "33": { latitude: 20.6464, longitude: 106.0511 }, // Hưng Yên
  "37": { latitude: 20.2506, longitude: 105.9745 }, // Ninh Bình
  "38": { latitude: 19.8067, longitude: 105.7852 }, // Thanh Hóa
  "40": { latitude: 18.6796, longitude: 105.6813 }, // Nghệ An
  "42": { latitude: 18.3559, longitude: 105.8877 }, // Hà Tĩnh
  "44": { latitude: 16.8163, longitude: 107.1003 }, // Quảng Trị
  "46": { latitude: 16.4637, longitude: 107.5909 }, // Huế
  "48": { latitude: 16.0544, longitude: 108.2022 }, // Đà Nẵng
  "51": { latitude: 15.1205, longitude: 108.7923 }, // Quảng Ngãi
  "52": { latitude: 13.9716, longitude: 108.015 }, // Gia Lai
  "56": { latitude: 12.2388, longitude: 109.1967 }, // Khánh Hòa
  "66": { latitude: 12.6667, longitude: 108.05 }, // Đắk Lắk
  "68": { latitude: 11.9404, longitude: 108.4583 }, // Lâm Đồng
  "75": { latitude: 10.9453, longitude: 106.8243 }, // Đồng Nai
  "79": { latitude: 10.8231, longitude: 106.6297 }, // Thành phố Hồ Chí Minh
  "80": { latitude: 10.936, longitude: 106.3346 }, // Tây Ninh
  "82": { latitude: 10.3601, longitude: 105.605 }, // Đồng Tháp
  "86": { latitude: 10.2396, longitude: 105.9572 }, // Vĩnh Long
  "91": { latitude: 10.3864, longitude: 105.4352 }, // An Giang
  "92": { latitude: 10.0452, longitude: 105.7469 }, // Cần Thơ
  "96": { latitude: 9.1769, longitude: 105.1524 }, // Cà Mau
};
