export interface NominatimCity {
  display_name: string
  addresstype: string
  name: string
  address: {
    city?: string
    town?: string
    village?: string
  }
}