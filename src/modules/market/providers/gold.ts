import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoldProvider {
  private url =
    'http://api.btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v';

  async getGoldPrice() {
    try {
      const response = await axios.get(this.url);
      const items = response.data?.DataList?.Data;

      if (!Array.isArray(items)) return null;

      // Find "VÀNG MIẾNG SJC" by searching all @n_X fields
      let sjc = null;
      for (const item of items) {
        for (const key in item) {
          if (key.startsWith('@n_') && item[key]?.includes('VÀNG MIẾNG SJC')) {
            sjc = item;
            break;
          }
        }
        if (sjc) break;
      }
      console.log('sjc', sjc);
      if (!sjc) return null;

      // Extract row number from @row to get correct field suffix
      const row = sjc['@row'];
      const buyKey = `@pb_${row}`;
      const sellKey = `@ps_${row}`;
      const dateKey = `@d_${row}`;

      return {
        buy: Number(sjc[buyKey]),
        sell: Number(sjc[sellKey]),
        updatedAt: sjc[dateKey],
      };
    } catch (e) {
      console.error('GoldProvider Error:', e);
      return null;
    }
  }
}
