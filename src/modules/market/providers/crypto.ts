import axios from 'axios';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CryptoProvider {
  async getPrices() {
    try {
      // const res = await axios.get(
      //   'https://api.coingecko.com/api/v3/simple/price',
      //   {
      //     params: {
      //       ids: 'bitcoin,ethereum',
      //       vs_currencies: 'usd',
      //     },
      //   },
      // );

      // return {
      //   btc: res.data.bitcoin?.vnd ?? null,
      //   eth: res.data.ethereum?.vnd ?? null,
      // };

      return {
        btc: '500000000',
        eth: '40000000',
      };
    } catch (e) {
      console.error('CryptoProvider Error:', e);
      return { btc: null, eth: null };
    }
  }
}
