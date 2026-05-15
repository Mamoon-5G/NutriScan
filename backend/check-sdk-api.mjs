import { GoogleGenAI } from '@google/genai';

const API_KEY = 'AIzaSyD884EUI-vxgs1aNKkK_1brDf5_qWaiRvA';
const ai = new GoogleGenAI({ apiKey: API_KEY });

console.log('GoogleGenAI instance properties:', Object.keys(ai));
console.log('Available methods/properties:', ai);
