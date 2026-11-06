import axios from 'axios'
import type {
  CitySearchItem,
  DailyForecast,
  GeoLocation,
  WeatherData,
  WeatherTips,
} from '../types/weather'

/**
 * 天气服务封装
 * 当前使用免费且无需 Key 的 Open-Meteo：
 * - 天气：https://api.open-meteo.com
 * - 地理编码：https://geocoding-api.open-meteo.com
 * - 逆地理：BigDataCloud（免费、无需 Key）
 *
 * 若要换成和风天气 / 高德，只需替换本文件中的请求实现，
 * 页面组件无需改动（保持 WeatherData 返回结构即可）。
 *
 * 备选演示 API（无需 Key）：
 *   GET https://wttr.in/{城市名}?format=j1
 */

const weatherHttp = axios.create({
  baseURL: 'https://api.open-meteo.com/v1',
  timeout: 12000,
})

const geoHttp = axios.create({
  baseURL: 'https://geocoding-api.open-meteo.com/v1',
  timeout: 12000,
})

const DEFAULT_CITY: GeoLocation = {
  latitude: 39.9042,
  longitude: 116.4074,
  city: '北京市',
  admin1: '北京',
  country: '中国',
}

const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

export function mapWeatherCode(code: number): { icon: string; description: string } {
  if (code === 0) return { icon: '☀️', description: '晴' }
  if (code <= 3) return { icon: '⛅', description: code === 1 ? '晴间多云' : '阴' }
  if (code <= 48) return { icon: '🌫️', description: '雾' }
  if (code <= 57) return { icon: '🌦️', description: '毛毛雨' }
  if (code <= 67) return { icon: '🌧️', description: '雨' }
  if (code <= 77) return { icon: '🌨️', description: '雪' }
  if (code <= 82) return { icon: '🌧️', description: '阵雨' }
  if (code <= 99) return { icon: '⛈️', description: '雷阵雨' }
  return { icon: '☁️', description: '多云' }
}

function windText(speed: number, direction: number): string {
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北']
  const idx = Math.round(((direction % 360) / 45)) % 8
  let level = 0
  if (speed < 1) level = 0
  else if (speed < 6) level = 1
  else if (speed < 12) level = 2
  else if (speed < 20) level = 3
  else if (speed < 29) level = 4
  else level = 5
  return `${dirs[idx]}风 ${level}级`
}

function buildTips(
  temp: number,
  feelsLike: number,
  humidity: number,
  weatherCode: number,
  windSpeed: number,
  tempMin: number,
  tempMax: number,
): WeatherTips {
  const diff = Math.round(tempMax - tempMin)
  const isRain = weatherCode >= 51 && weatherCode <= 82
  const isSnow = weatherCode >= 71 && weatherCode <= 77
  const isWindy = windSpeed >= 20

  // 穿衣（她怕冷，整体加暖一档）
  let clothing: string
  if (temp >= 26) clothing = '短袖裙子刚刚好，早晚凉记得套件薄开衫~'
  else if (temp >= 18) clothing = '长袖+外套最稳妥，你怕冷别为了好看硬扛'
  else if (temp >= 10) clothing = '厚卫衣或薄羽绒安排上，你怕冷，围巾早早准备好'
  else clothing = '羽绒服/厚外套裹紧，围巾手套帽子全副武装，你最怕冷啦'
  if (isRain) clothing += ' 今天有雨，包里塞把小伞 ☔'
  if (isSnow) clothing += ' 下雪啦，穿防滑鞋小心路滑 ❄️'
  if (isWindy) clothing += ' 风大，长发记得扎好哦 💨'

  // 护肤
  let skincare: string
  if (humidity >= 75) skincare = '空气湿润，清爽保湿就够啦，别涂太厚闷痘'
  else if (humidity >= 50) skincare = '湿度刚刚好，正常水乳+防晒即可'
  else skincare = '天气偏干，多喝水多敷面膜，唇膏随身带 💄'
  if (temp <= 5) skincare += ' 冷风刺激大，回家用温水洗脸'
  if (isRain) skincare += ' 淋了雨要及时擦干头发哦'

  // 温差提醒
  let temperature: string
  if (diff >= 8) temperature = `今天温差 ${diff}°，早晚凉中午热，洋葱式穿衣最稳妥`
  else if (diff >= 5) temperature = `温差 ${diff}°，出门备件外套不亏`
  else temperature = '全天温度比较平稳，穿舒服就行'
  const feelDiff = Math.round(feelsLike - temp)
  if (feelDiff <= -3) temperature += `，体感比实际冷 ${Math.abs(feelDiff)}°，你怕冷，多穿一件不商量`
  else if (feelDiff >= 3) temperature += `，体感比实际热 ${feelDiff}°，里面穿舒服点就好`
  else if (temp <= 15) temperature += '，降温了，多喝热水别冻着哦'
  else temperature += ''

  // 综合
  let mood: string
  if (isRain) mood = '下雨天适合窝着喝杯热奶茶，想你的时候就连雨都是甜的 🌧️'
  else if (isSnow) mood = '下雪天要一起踩雪才浪漫呀 ☃️'
  else if (temp >= 25) mood = '好天气！适合出门散散步拍拍照，记得想我哦 🌞'
  else mood = '不管天气怎样，你开心就是最好的天气 💗'

  return { clothing, skincare, temperature, mood }
}

function weekLabel(dateStr: string, index: number): string {
  if (index === 0) return '今天'
  if (index === 1) return '明天'
  const d = new Date(dateStr)
  return `周${WEEK_CN[d.getDay()]}`
}

/** 获取浏览器定位经纬度 */
export function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('当前浏览器不支持定位'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        })
      },
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    )
  })
}

/** 经纬度逆解析为城市名 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeoLocation> {
  try {
    const { data } = await axios.get(
      'https://api.bigdatacloud.net/data/reverse-geocode-client',
      {
        params: { latitude, longitude, localityLanguage: 'zh' },
        timeout: 10000,
      },
    )

    const city =
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      data.countryName ||
      '未知地点'

    return {
      latitude,
      longitude,
      city,
      admin1: data.principalSubdivision,
      country: data.countryName,
    }
  } catch {
    // 失败时仍返回坐标，城市用默认占位
    return {
      latitude,
      longitude,
      city: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
    }
  }
}

/** 自动定位：成功返回城市，失败抛错由调用方回退默认城市 */
export async function locateUserCity(): Promise<GeoLocation> {
  const coords = await getCurrentPosition()
  return reverseGeocode(coords.latitude, coords.longitude)
}

export function getDefaultCity(): GeoLocation {
  return { ...DEFAULT_CITY }
}

/** 按城市名搜索（手动切换地址） */
// Open-Meteo 地理编码对中文支持差，先内置常用城市本地匹配，再回退在线搜索
const KNOWN_CITIES: Array<{
  name: string
  admin1: string
  latitude: number
  longitude: number
}> = [
  { name: '北京', admin1: '北京', latitude: 39.9042, longitude: 116.4074 },
  { name: '上海', admin1: '上海', latitude: 31.2304, longitude: 121.4737 },
  { name: '天津', admin1: '天津', latitude: 39.0842, longitude: 117.201 },
  { name: '重庆', admin1: '重庆', latitude: 29.563, longitude: 106.5516 },
  { name: '广州', admin1: '广东', latitude: 23.1291, longitude: 113.2644 },
  { name: '深圳', admin1: '广东', latitude: 22.5431, longitude: 114.0579 },
  { name: '成都', admin1: '四川', latitude: 30.5728, longitude: 104.0668 },
  { name: '杭州', admin1: '浙江', latitude: 30.2741, longitude: 120.1551 },
  { name: '武汉', admin1: '湖北', latitude: 30.5928, longitude: 114.3055 },
  { name: '西安', admin1: '陕西', latitude: 34.3416, longitude: 108.9398 },
  { name: '南京', admin1: '江苏', latitude: 32.0603, longitude: 118.7969 },
  { name: '苏州', admin1: '江苏', latitude: 31.2989, longitude: 120.5853 },
  { name: '郑州', admin1: '河南', latitude: 34.7466, longitude: 113.6254 },
  { name: '长沙', admin1: '湖南', latitude: 28.2282, longitude: 112.9388 },
  { name: '沈阳', admin1: '辽宁', latitude: 41.8057, longitude: 123.4315 },
  { name: '青岛', admin1: '山东', latitude: 36.0671, longitude: 120.3826 },
  { name: '大连', admin1: '辽宁', latitude: 38.914, longitude: 121.6147 },
  { name: '厦门', admin1: '福建', latitude: 24.4798, longitude: 118.0894 },
  { name: '昆明', admin1: '云南', latitude: 25.0389, longitude: 102.7183 },
  { name: '合肥', admin1: '安徽', latitude: 31.8206, longitude: 117.2272 },
  { name: '佛山', admin1: '广东', latitude: 23.0215, longitude: 113.1214 },
  { name: '东莞', admin1: '广东', latitude: 23.0207, longitude: 113.7518 },
  { name: '宁波', admin1: '浙江', latitude: 29.8683, longitude: 121.544 },
  { name: '无锡', admin1: '江苏', latitude: 31.4912, longitude: 120.3119 },
  { name: '济南', admin1: '山东', latitude: 36.6512, longitude: 117.1201 },
  { name: '福州', admin1: '福建', latitude: 26.0745, longitude: 119.2965 },
  { name: '温州', admin1: '浙江', latitude: 27.9938, longitude: 120.6994 },
  { name: '南宁', admin1: '广西', latitude: 22.817, longitude: 108.3669 },
  { name: '贵阳', admin1: '贵州', latitude: 26.647, longitude: 106.6302 },
  { name: '兰州', admin1: '甘肃', latitude: 36.0611, longitude: 103.8343 },
  { name: '乌鲁木齐', admin1: '新疆', latitude: 43.8256, longitude: 87.6168 },
  { name: '拉萨', admin1: '西藏', latitude: 29.652, longitude: 91.1721 },
  { name: '海口', admin1: '海南', latitude: 20.044, longitude: 110.199 },
  { name: '三亚', admin1: '海南', latitude: 18.2528, longitude: 109.5119 },
  { name: '洛阳', admin1: '河南', latitude: 34.6197, longitude: 112.454 },
  { name: '宜昌', admin1: '湖北', latitude: 30.6919, longitude: 111.2865 },
  { name: '襄阳', admin1: '湖北', latitude: 32.0084, longitude: 112.122 },
  { name: '十堰', admin1: '湖北', latitude: 32.6467, longitude: 110.7882 },
  { name: '荆州', admin1: '湖北', latitude: 30.3352, longitude: 112.239 },
  { name: '孝感', admin1: '湖北', latitude: 30.9256, longitude: 113.9266 },
  { name: '黄冈', admin1: '湖北', latitude: 30.4536, longitude: 114.8725 },
  { name: '南昌', admin1: '江西', latitude: 28.682, longitude: 115.8579 },
  { name: '太原', admin1: '山西', latitude: 37.8706, longitude: 112.5489 },
  { name: '石家庄', admin1: '河北', latitude: 38.0428, longitude: 114.5149 },
  { name: '哈尔滨', admin1: '黑龙江', latitude: 45.8038, longitude: 126.5349 },
  { name: '长春', admin1: '吉林', latitude: 43.8171, longitude: 125.3235 },
  { name: '呼和浩特', admin1: '内蒙古', latitude: 40.8426, longitude: 111.7492 },
  // —— 海外热门城市 ——
  { name: '曼谷', admin1: '泰国', latitude: 13.7563, longitude: 100.5018 },
  { name: '清迈', admin1: '泰国', latitude: 18.7883, longitude: 98.9853 },
  { name: '普吉岛', admin1: '泰国', latitude: 7.8804, longitude: 98.3923 },
  { name: '芭提雅', admin1: '泰国', latitude: 12.9236, longitude: 100.8825 },
  { name: '新加坡', admin1: '新加坡', latitude: 1.3521, longitude: 103.8198 },
  { name: '吉隆坡', admin1: '马来西亚', latitude: 3.139, longitude: 101.6869 },
  { name: '东京', admin1: '日本', latitude: 35.6762, longitude: 139.6503 },
  { name: '大阪', admin1: '日本', latitude: 34.6937, longitude: 135.5023 },
  { name: '首尔', admin1: '韩国', latitude: 37.5665, longitude: 126.978 },
  { name: '巴厘岛', admin1: '印尼', latitude: -8.6705, longitude: 115.2126 },
  { name: '悉尼', admin1: '澳大利亚', latitude: -33.8688, longitude: 151.2093 },
  { name: '墨尔本', admin1: '澳大利亚', latitude: -37.8136, longitude: 144.9631 },
  { name: '奥克兰', admin1: '新西兰', latitude: -36.8485, longitude: 174.7633 },
  { name: '惠灵顿', admin1: '新西兰', latitude: -41.2865, longitude: 174.7762 },
  { name: '伦敦', admin1: '英国', latitude: 51.5074, longitude: -0.1278 },
  { name: '巴黎', admin1: '法国', latitude: 48.8566, longitude: 2.3522 },
  { name: '迪拜', admin1: '阿联酋', latitude: 25.2048, longitude: 55.2708 },
  { name: '纽约', admin1: '美国', latitude: 40.7128, longitude: -74.006 },
  { name: '洛杉矶', admin1: '美国', latitude: 34.0522, longitude: -118.2437 },
  { name: '温哥华', admin1: '加拿大', latitude: 49.2827, longitude: -123.1207 },
  { name: '多伦多', admin1: '加拿大', latitude: 43.6532, longitude: -79.3832 },
]

/** 热门城市一键选（手机上不用打字） */
export const HOT_CITIES: CitySearchItem[] = ['十堰', '武汉', '北京', '上海', '广州', '深圳', '成都', '杭州', '曼谷', '清迈', '奥克兰', '悉尼']
  .map((n) => KNOWN_CITIES.find((c) => c.name === n))
  .filter((c): c is NonNullable<typeof c> => Boolean(c))
  .map((c, i) => ({
    id: i,
    name: c.name,
    admin1: c.admin1,
    latitude: c.latitude,
    longitude: c.longitude,
    label: `${c.name} · ${c.admin1}`,
  }))

export async function searchCities(keyword: string): Promise<CitySearchItem[]> {
  const q = keyword.trim()
  if (!q) return []
  const local = KNOWN_CITIES.filter(
    (c) => c.name.includes(q) || q.includes(c.name),
  ).slice(0, 8)
  if (local.length) {
    return local.map((c, i) => ({
      id: i + 1,
      name: c.name,
      latitude: c.latitude,
      longitude: c.longitude,
      admin1: c.admin1,
      country: '中国',
      label: `${c.name} · ${c.admin1}`,
    }))
  }

  const { data } = await geoHttp.get('/search', {
    params: {
      name: q,
      count: 8,
      language: 'zh',
      format: 'json',
    },
  })

  const results = (data.results || []) as Array<{
    id: number
    name: string
    latitude: number
    longitude: number
    admin1?: string
    country?: string
  }>

  return results.map((item) => {
    const parts = [item.name, item.admin1, item.country].filter(Boolean)
    return {
      id: item.id,
      name: item.name,
      latitude: item.latitude,
      longitude: item.longitude,
      admin1: item.admin1,
      country: item.country,
      label: parts.join(' · '),
    }
  })
}

/** 根据经纬度拉取实时天气 + 三日预报 */
export async function fetchWeatherByCoords(
  latitude: number,
  longitude: number,
  city: string,
): Promise<WeatherData> {
  const { data } = await weatherHttp.get('/forecast', {
    params: {
      latitude,
      longitude,
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      timezone: 'auto',
      forecast_days: 3,
    },
  })

  const cur = data.current
  const meta = mapWeatherCode(cur.weather_code)

  // 记录该城市 UTC 偏移（秒），供主页问候/上班时间按当地时间算
  try {
    localStorage.setItem('kitty_weather_tz_v1', String(data.utc_offset_seconds ?? 0))
  } catch {
    // ignore
  }

  const forecast: DailyForecast[] = (data.daily.time as string[]).map(
    (date: string, i: number) => {
      const code = data.daily.weather_code[i] as number
      const dayMeta = mapWeatherCode(code)
      return {
        date,
        weekLabel: weekLabel(date, i),
        weatherCode: code,
        icon: dayMeta.icon,
        description: dayMeta.description,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
      }
    },
  )

  return {
    city,
    latitude,
    longitude,
    temperature: cur.temperature_2m,
    feelsLike: cur.apparent_temperature,
    humidity: cur.relative_humidity_2m,
    weatherCode: cur.weather_code,
    description: meta.description,
    icon: meta.icon,
    windSpeed: cur.wind_speed_10m,
    windDirection: cur.wind_direction_10m,
    windText: windText(cur.wind_speed_10m, cur.wind_direction_10m),
    forecast,
    tips: buildTips(
      cur.temperature_2m,
      cur.apparent_temperature,
      cur.relative_humidity_2m,
      cur.weather_code,
      cur.wind_speed_10m,
      data.daily.temperature_2m_min[0] as number,
      data.daily.temperature_2m_max[0] as number,
    ),
    updatedAt: new Date().toISOString(),
  }
}

export async function fetchWeatherByCity(location: GeoLocation): Promise<WeatherData> {
  return fetchWeatherByCoords(location.latitude, location.longitude, location.city)
}

/**
 * 备选：wttr.in（无需 Key，适合演示）
 * 注意：国内网络可能不稳定，默认走 Open-Meteo。
 */
export async function fetchWeatherByWttr(cityName: string): Promise<WeatherData> {
  const { data } = await axios.get(`https://wttr.in/${encodeURIComponent(cityName)}`, {
    params: { format: 'j1' },
    timeout: 12000,
  })

  const current = data.current_condition[0]
  const area = data.nearest_area?.[0]
  const city =
    area?.areaName?.[0]?.value ||
    area?.region?.[0]?.value ||
    cityName

  const temp = Number(current.temp_C)
  const feels = Number(current.FeelsLikeC)
  const humidity = Number(current.humidity)
  const desc = current.weatherDesc?.[0]?.value || '多云'
  const code = Number(current.weatherCode || 0)
  const meta = mapWeatherCode(code >= 100 ? 2 : code)

  const forecast: DailyForecast[] = (data.weather || [])
    .slice(0, 3)
    .map((day: { date: string; maxtempC: string; mintempC: string; hourly: Array<{ weatherCode: string }> }, i: number) => {
      const dayCode = Number(day.hourly?.[4]?.weatherCode || 0)
      const dayMeta = mapWeatherCode(dayCode >= 100 ? 2 : dayCode)
      return {
        date: day.date,
        weekLabel: weekLabel(day.date, i),
        weatherCode: dayCode,
        icon: dayMeta.icon,
        description: dayMeta.description,
        tempMax: Math.round(Number(day.maxtempC)),
        tempMin: Math.round(Number(day.mintempC)),
      }
    })

  return {
    city,
    latitude: Number(area?.latitude || 0),
    longitude: Number(area?.longitude || 0),
    temperature: temp,
    feelsLike: feels,
    humidity,
    weatherCode: code,
    description: desc,
    icon: meta.icon,
    windSpeed: Number(current.windspeedKmph || 0),
    windDirection: Number(current.winddirDegree || 0),
    windText: `${current.winddir16Point || ''} ${current.windspeedKmph || 0}km/h`,
    forecast,
    tips: buildTips(
      temp,
      temp,
      humidity,
      code >= 100 ? 61 : code,
      Number(current.windspeedKmph || 0),
      forecast[0]?.tempMin ?? temp,
      forecast[0]?.tempMax ?? temp,
    ),
    updatedAt: new Date().toISOString(),
  }
}
