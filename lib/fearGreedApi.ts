export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
}

export async function fetchFearGreedIndex(): Promise<FearGreedData | null> {
  try {
    const response = await fetch('https://api.alternative.me/fng/?limit=1');
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      const item = data.data[0];
      return {
        value: parseInt(item.value),
        classification: item.value_classification,
        timestamp: item.timestamp,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching fear greed index:', error);
    return null;
  }
}
