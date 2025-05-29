import { ref, watch } from "vue";
import type { NominatimCity } from "../interfaces/nominatimCity";

export function useNominatim() {
  const cityQuery = ref("");
  const suggestions = ref<NominatimCity[]>([]);
  const selectedCity = ref<NominatimCity | null>(null);
  const cityError = ref(false);

  // Debounce timer
  let debounceTimeout: ReturnType<typeof setTimeout>;

  const fetchCities = async () => {
    if (cityQuery.value.length < 3) {
      suggestions.value = [];
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&accept-language=it&countrycodes=it&city=${encodeURIComponent(
          cityQuery.value
        )}`
      );
      const data: NominatimCity[] = await response.json();

      // Filter the data to keep only unique results
      const uniqueByName = new Map<string, NominatimCity>();
      data
        .filter(
          (item) =>
            item.display_name
              ?.toLowerCase()
              .includes(cityQuery.value.toLowerCase()) &&
            ["city", "town", "village"].includes(item.addresstype)
        )
        .forEach((item) => {
          uniqueByName.set(item.name, item);
        });

      suggestions.value = Array.from(uniqueByName.values());
    } catch (error) {
      console.error("Errore nel fetch delle città:", error);
      suggestions.value = [];
    }
  };

  watch(cityQuery, () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      fetchCities();
    }, 300);
  });

  const selectSuggestion = (suggestion: NominatimCity) => {
    selectedCity.value = suggestion;
    cityQuery.value =
      suggestion.address.city ||
      suggestion.address.town ||
      suggestion.address.village!;
    suggestions.value = [];
    cityError.value = false;
  };

  const validateCity = () => {
    if (
      !selectedCity.value ||
      (selectedCity.value.address.city ||
        selectedCity.value.address.town ||
        selectedCity.value.address.village) !== cityQuery.value
    ) {
      cityError.value = true;
      selectedCity.value = null;
    } else {
      cityError.value = false;
    }
  };

  return {
    cityQuery,
    suggestions,
    selectedCity,
    cityError,
    fetchCities,
    selectSuggestion,
    validateCity,
  };
}
